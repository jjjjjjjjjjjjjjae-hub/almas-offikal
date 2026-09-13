using System.Globalization;
using System.Text.RegularExpressions;

namespace AlmasSmartLearn;

public sealed class GestureCollector
{
    private readonly object _gate = new();
    private readonly List<PointSample> _points = new();
    private TouchDevice? _device;
    private bool _learning;
    private bool _touchActive;
    private long? _rawX;
    private long? _rawY;
    private DateTime _started;
    private int _rotation;

    public event Action<GestureAction>? GestureReady;
    public bool IsLearning { get { lock (_gate) return _learning; } }

    public void Configure(TouchDevice device)
    {
        lock (_gate) _device = device;
    }

    public void StartLearning(int rotation)
    {
        lock (_gate)
        {
            if (_device is null) throw new InvalidOperationException("Touchscreen әлі анықталмаған.");
            _rotation = Math.Clamp(rotation, 0, 3);
            _learning = true;
            _touchActive = false;
            _rawX = null;
            _rawY = null;
            _points.Clear();
        }
    }

    public void CancelLearning()
    {
        lock (_gate)
        {
            _learning = false;
            _touchActive = false;
            _points.Clear();
        }
    }

    public void ProcessEventLine(string line)
    {
        GestureAction? completed = null;
        lock (_gate)
        {
            if (!_learning || _device is null) return;

            var tracking = Regex.Match(line, @"ABS_MT_TRACKING_ID\s+(-?[0-9a-fA-F]+)", RegexOptions.IgnoreCase);
            if (tracking.Success)
            {
                var token = tracking.Groups[1].Value;
                var release = token.Equals("ffffffff", StringComparison.OrdinalIgnoreCase) || token == "-1";
                if (release)
                {
                    if (_touchActive && _points.Count > 0) completed = FinishLocked();
                    _touchActive = false;
                }
                else if (!_touchActive)
                {
                    BeginTouchLocked();
                }
            }

            if (Regex.IsMatch(line, @"BTN_TOUCH\s+DOWN", RegexOptions.IgnoreCase) && !_touchActive)
                BeginTouchLocked();

            if (_touchActive)
            {
                var x = Regex.Match(line, @"ABS_MT_POSITION_X\s+([0-9a-fA-F]+)", RegexOptions.IgnoreCase);
                if (x.Success) _rawX = ParseGetEventNumber(x.Groups[1].Value);

                var y = Regex.Match(line, @"ABS_MT_POSITION_Y\s+([0-9a-fA-F]+)", RegexOptions.IgnoreCase);
                if (y.Success) _rawY = ParseGetEventNumber(y.Groups[1].Value);

                if (line.Contains("SYN_REPORT", StringComparison.OrdinalIgnoreCase) && _rawX.HasValue && _rawY.HasValue)
                {
                    var (lx, ly) = ConvertRawToLogical(_rawX.Value, _rawY.Value, _device, _rotation);
                    _points.Add(new PointSample(lx, ly, DateTime.UtcNow));
                }
            }

            if (Regex.IsMatch(line, @"BTN_TOUCH\s+UP", RegexOptions.IgnoreCase))
            {
                if (_touchActive && _points.Count > 0) completed = FinishLocked();
                _touchActive = false;
            }
        }

        if (completed is not null) GestureReady?.Invoke(completed);
    }

    private void BeginTouchLocked()
    {
        _touchActive = true;
        _points.Clear();
        _started = DateTime.UtcNow;
        _rawX = null;
        _rawY = null;
    }

    private GestureAction FinishLocked()
    {
        _learning = false;
        var duration = Math.Max(1, (int)(DateTime.UtcNow - _started).TotalMilliseconds);
        var first = _points[0];
        var last = _points[^1];
        var dx = last.X - first.X;
        var dy = last.Y - first.Y;
        var distance = Math.Sqrt(dx * dx + dy * dy);
        var type = distance >= 0.06 ? "SWIPE" : duration >= 350 ? "HOLD" : "TAP";

        double x, y;
        double? x2 = null, y2 = null;
        if (type == "SWIPE")
        {
            x = first.X; y = first.Y; x2 = last.X; y2 = last.Y;
        }
        else
        {
            x = Median(_points.Select(p => p.X));
            y = Median(_points.Select(p => p.Y));
        }

        return new GestureAction
        {
            Type = type,
            X = Math.Round(x, 5),
            Y = Math.Round(y, 5),
            X2 = x2.HasValue ? Math.Round(x2.Value, 5) : null,
            Y2 = y2.HasValue ? Math.Round(y2.Value, 5) : null,
            DurationMs = duration,
            Rotation = _rotation
        };
    }

    private static long ParseGetEventNumber(string value)
    {
        if (long.TryParse(value, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var hex)) return hex;
        return long.TryParse(value, out var dec) ? dec : 0;
    }

    private static (double X, double Y) ConvertRawToLogical(long rawX, long rawY, TouchDevice device, int rotation)
    {
        var nx = Math.Clamp(rawX / device.MaxX, 0.0, 1.0);
        var ny = Math.Clamp(rawY / device.MaxY, 0.0, 1.0);
        return rotation switch
        {
            1 => (ny, 1.0 - nx),
            2 => (1.0 - nx, 1.0 - ny),
            3 => (1.0 - ny, nx),
            _ => (nx, ny)
        };
    }

    private static double Median(IEnumerable<double> values)
    {
        var sorted = values.OrderBy(x => x).ToArray();
        if (sorted.Length == 0) return 0;
        var mid = sorted.Length / 2;
        return sorted.Length % 2 == 0 ? (sorted[mid - 1] + sorted[mid]) / 2.0 : sorted[mid];
    }

    private readonly record struct PointSample(double X, double Y, DateTime Time);
}
