using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;

namespace AlmasSmartLearn;

public sealed class AdbService : IDisposable
{
    private Process? _streamProcess;
    private CancellationTokenSource? _streamCts;
    public string? AdbPath { get; private set; }

    public string LocateAdb()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var candidates = new List<string>
        {
            Path.Combine(AppContext.BaseDirectory, "adb.exe"),
            Path.Combine(AppContext.BaseDirectory, "platform-tools", "adb.exe"),
            Path.Combine(home, "Downloads", "platform-tools-latest-windows", "platform-tools", "adb.exe"),
            Path.Combine(home, "Downloads", "platform-tools", "adb.exe")
        };
        foreach (var part in (Environment.GetEnvironmentVariable("PATH") ?? string.Empty).Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            try { candidates.Add(Path.Combine(part.Trim(), "adb.exe")); } catch { }
        }
        var found = candidates.FirstOrDefault(File.Exists);
        if (found is null) throw new FileNotFoundException("adb.exe табылмады. Android platform-tools орнатыңыз немесе adb.exe файлын қолданбаның қасына қойыңыз.");
        AdbPath = found;
        return found;
    }

    public async Task<string> RunAsync(params string[] args)
    {
        if (AdbPath is null) LocateAdb();
        var psi = new ProcessStartInfo
        {
            FileName = AdbPath!, UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
        };
        foreach (var arg in args) psi.ArgumentList.Add(arg);
        using var process = Process.Start(psi) ?? throw new InvalidOperationException("ADB іске қосылмады.");
        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        var stdout = await stdoutTask;
        var stderr = await stderrTask;
        if (process.ExitCode != 0) throw new InvalidOperationException(string.IsNullOrWhiteSpace(stderr) ? stdout.Trim() : stderr.Trim());
        return stdout;
    }

    public async Task EnsurePhoneAndRootAsync()
    {
        var devices = await RunAsync("devices");
        var online = devices.Replace("\r", "").Split('\n').Select(x => x.TrimEnd()).Any(x => x.EndsWith("\tdevice", StringComparison.Ordinal));
        if (!online) throw new InvalidOperationException("ADB арқылы телефон табылмады. USB debugging қосып, телефондағы RSA рұқсатын қабылдаңыз.");
        var root = await RunAsync("shell", "su", "-c", "id");
        if (!root.Contains("uid=0", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Root рұқсаты берілмеді. Magisk сұрауын Grant етіңіз.");
    }

    public async Task<TouchDevice> DetectTouchDeviceAsync()
    {
        var text = await RunAsync("shell", "su", "-c", "getevent -lp");
        var items = new List<Candidate>();
        Candidate? current = null;
        foreach (var raw in text.Replace("\r", "").Split('\n'))
        {
            var add = Regex.Match(raw, @"add device \d+:\s*(/dev/input/event\d+)", RegexOptions.IgnoreCase);
            if (add.Success)
            {
                if (current is not null) items.Add(current);
                current = new Candidate { Path = add.Groups[1].Value };
                continue;
            }
            if (current is null) continue;
            var name = Regex.Match(raw, "name:\\s*\"([^\"]+)\"");
            if (name.Success) current.Name = name.Groups[1].Value;
            if (raw.Contains("ABS_MT_POSITION_X", StringComparison.OrdinalIgnoreCase) || Regex.IsMatch(raw, @"\b0035\b"))
            {
                var m = Regex.Match(raw, @"max\s+(-?\d+)", RegexOptions.IgnoreCase);
                if (m.Success && double.TryParse(m.Groups[1].Value, out var v) && v > 0) current.MaxX = v;
            }
            if (raw.Contains("ABS_MT_POSITION_Y", StringComparison.OrdinalIgnoreCase) || Regex.IsMatch(raw, @"\b0036\b"))
            {
                var m = Regex.Match(raw, @"max\s+(-?\d+)", RegexOptions.IgnoreCase);
                if (m.Success && double.TryParse(m.Groups[1].Value, out var v) && v > 0) current.MaxY = v;
            }
        }
        if (current is not null) items.Add(current);
        var best = items.Where(x => x.MaxX > 0 && x.MaxY > 0).OrderByDescending(x => x.MaxX * x.MaxY).FirstOrDefault();
        if (best is null) throw new InvalidOperationException("Touchscreen event құрылғысы табылмады. Root getevent қолжетімді екенін тексеріңіз.");
        return new TouchDevice { Path = best.Path, Name = string.IsNullOrWhiteSpace(best.Name) ? "Touchscreen" : best.Name, MaxX = best.MaxX, MaxY = best.MaxY };
    }

    public async Task<int> GetRotationAsync()
    {
        try
        {
            var input = await RunAsync("shell", "dumpsys", "input");
            var m = Regex.Match(input, @"SurfaceOrientation:\s*([0-3])", RegexOptions.IgnoreCase);
            if (m.Success) return int.Parse(m.Groups[1].Value);
        }
        catch { }
        try
        {
            var display = await RunAsync("shell", "dumpsys", "display");
            var m = Regex.Match(display, @"mCurrentOrientation\s*=\s*([0-3])", RegexOptions.IgnoreCase);
            if (m.Success) return int.Parse(m.Groups[1].Value);
        }
        catch { }
        try
        {
            var value = (await RunAsync("shell", "settings", "get", "system", "user_rotation")).Trim();
            if (int.TryParse(value, out var rotation) && rotation is >= 0 and <= 3) return rotation;
        }
        catch { }
        return 0;
    }

    public async Task StreamTouchEventsAsync(TouchDevice device, Action<string> onLine, CancellationToken externalToken)
    {
        StopEventStream();
        if (AdbPath is null) LocateAdb();
        _streamCts = CancellationTokenSource.CreateLinkedTokenSource(externalToken);
        var psi = new ProcessStartInfo
        {
            FileName = AdbPath!, UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
        };
        psi.ArgumentList.Add("shell"); psi.ArgumentList.Add("su"); psi.ArgumentList.Add("-c"); psi.ArgumentList.Add($"getevent -lt {device.Path}");
        _streamProcess = Process.Start(psi) ?? throw new InvalidOperationException("getevent іске қосылмады.");
        var process = _streamProcess;
        var token = _streamCts.Token;
        _ = Task.Run(async () =>
        {
            try { while (!token.IsCancellationRequested && !process.HasExited && await process.StandardError.ReadLineAsync(token) is not null) { } } catch { }
        }, token);
        try
        {
            while (!token.IsCancellationRequested && !process.HasExited)
            {
                var line = await process.StandardOutput.ReadLineAsync(token);
                if (line is null) break;
                onLine(line);
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            if (!process.HasExited) try { process.Kill(entireProcessTree: true); } catch { }
        }
    }

    public void StopEventStream()
    {
        try { _streamCts?.Cancel(); } catch { }
        if (_streamProcess is { HasExited: false }) try { _streamProcess.Kill(entireProcessTree: true); } catch { }
        try { _streamProcess?.Dispose(); } catch { }
        _streamProcess = null;
        _streamCts?.Dispose();
        _streamCts = null;
    }

    public void Dispose() => StopEventStream();

    private sealed class Candidate
    {
        public string Path { get; set; } = "";
        public string Name { get; set; } = "";
        public double MaxX { get; set; }
        public double MaxY { get; set; }
    }
}
