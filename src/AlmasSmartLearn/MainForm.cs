using System.Text.Encodings.Web;
using System.Text.Json;

namespace AlmasSmartLearn;

public sealed class MainForm : Form
{
    private readonly AdbService _adb = new();
    private readonly GestureCollector _collector = new();
    private readonly CancellationTokenSource _lifetime = new();
    private readonly List<KeyBinding> _bindings = new();

    private TouchDevice? _touchDevice;
    private GestureAction? _pendingGesture;
    private Task? _streamTask;

    private readonly Label _status = new();
    private readonly Label _learnStatus = new();
    private readonly Button _connect = new();
    private readonly Button _learn = new();
    private readonly Button _save = new();
    private readonly TextBox _profileName = new();
    private readonly DataGridView _grid = new();

    public MainForm()
    {
        Text = "Almas Smart Learn - Root Game Setup";
        Width = 930;
        Height = 650;
        MinimumSize = new Size(820, 560);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10F);
        KeyPreview = true;

        BuildUi();
        _collector.GestureReady += OnGestureReady;
        KeyDown += OnKeyDownCapture;
        FormClosing += OnClosing;
    }

    private void BuildUi()
    {
        var title = new Label
        {
            Text = "ALMAS SMART LEARN",
            Font = new Font("Segoe UI", 18F, FontStyle.Bold),
            AutoSize = true,
            Left = 22,
            Top = 18
        };
        Controls.Add(title);

        var subtitle = new Label
        {
            Text = "Телефондағы ойын батырмасын бас -> PC пернесін бас -> bind автоматты сақталады",
            AutoSize = true,
            Left = 24,
            Top = 58
        };
        Controls.Add(subtitle);

        _status.Text = "Телефон қосылмаған";
        _status.AutoSize = false;
        _status.Left = 24;
        _status.Top = 88;
        _status.Width = 850;
        _status.Height = 38;
        Controls.Add(_status);

        _connect.Text = "1. Телефонды қосу";
        _connect.Left = 24;
        _connect.Top = 130;
        _connect.Width = 190;
        _connect.Height = 40;
        _connect.Click += ConnectClicked;
        Controls.Add(_connect);

        var profileLabel = new Label { Text = "Профиль:", Left = 230, Top = 140, AutoSize = true };
        Controls.Add(profileLabel);

        _profileName.Text = "Free Fire";
        _profileName.Left = 300;
        _profileName.Top = 135;
        _profileName.Width = 160;
        Controls.Add(_profileName);

        _learn.Text = "2. Ақылды үйрету";
        _learn.Left = 480;
        _learn.Top = 130;
        _learn.Width = 190;
        _learn.Height = 40;
        _learn.Enabled = false;
        _learn.Click += LearnClicked;
        Controls.Add(_learn);

        _save.Text = "Профильді сақтау";
        _save.Left = 690;
        _save.Top = 130;
        _save.Width = 190;
        _save.Height = 40;
        _save.Enabled = false;
        _save.Click += SaveClicked;
        Controls.Add(_save);

        _learnStatus.Text = "Алдымен телефонды қосыңыз.";
        _learnStatus.Left = 24;
        _learnStatus.Top = 185;
        _learnStatus.Width = 850;
        _learnStatus.Height = 54;
        _learnStatus.BorderStyle = BorderStyle.FixedSingle;
        _learnStatus.Padding = new Padding(10);
        Controls.Add(_learnStatus);

        _grid.Left = 24;
        _grid.Top = 255;
        _grid.Width = 856;
        _grid.Height = 300;
        _grid.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
        _grid.AllowUserToAddRows = false;
        _grid.AllowUserToDeleteRows = false;
        _grid.ReadOnly = true;
        _grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        _grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        _grid.RowHeadersVisible = false;
        _grid.Columns.Add("Key", "PC перне");
        _grid.Columns.Add("Type", "Әрекет");
        _grid.Columns.Add("X", "X");
        _grid.Columns.Add("Y", "Y");
        _grid.Columns.Add("Duration", "ms");
        _grid.Columns.Add("Rotation", "Rotation");
        Controls.Add(_grid);

        var footer = new Label
        {
            Text = "TAP < 350 ms | HOLD >= 350 ms | қозғалыс >= 6% = SWIPE | 0/90/180/270 rotation есептеледі",
            Left = 24,
            Top = 570,
            Width = 856,
            Height = 28,
            Anchor = AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom
        };
        Controls.Add(footer);
    }

    private async void ConnectClicked(object? sender, EventArgs e)
    {
        _connect.Enabled = false;
        _status.Text = "ADB және root тексеріліп жатыр...";
        _status.ForeColor = Color.DarkBlue;

        try
        {
            var adbPath = _adb.LocateAdb();
            await _adb.EnsurePhoneAndRootAsync();
            _touchDevice = await _adb.DetectTouchDeviceAsync();
            var rotation = await _adb.GetRotationAsync();
            _collector.Configure(_touchDevice);

            _streamTask = RunStreamAsync(_touchDevice);

            _status.Text = $"OK | {_touchDevice.Path} | {_touchDevice.Name} | raw={_touchDevice.MaxX:0}x{_touchDevice.MaxY:0} | rotation={rotation} | ADB={adbPath}";
            _status.ForeColor = Color.DarkGreen;
            _learnStatus.Text = "Дайын. 'Ақылды үйрету' басыңыз, содан кейін телефонда қажетті ойын батырмасын басыңыз.";
            _learn.Enabled = true;
            _save.Enabled = true;
        }
        catch (Exception ex)
        {
            _status.Text = "Қате: " + ex.Message;
            _status.ForeColor = Color.DarkRed;
            MessageBox.Show(ex.Message, "Almas Smart Learn", MessageBoxButtons.OK, MessageBoxIcon.Error);
            _connect.Enabled = true;
        }
    }

    private async Task RunStreamAsync(TouchDevice device)
    {
        try
        {
            await _adb.StreamTouchEventsAsync(device, _collector.ProcessEventLine, _lifetime.Token);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            if (!IsDisposed && IsHandleCreated)
            {
                BeginInvoke(() =>
                {
                    _status.Text = "getevent тоқтады: " + ex.Message;
                    _status.ForeColor = Color.DarkRed;
                    _learn.Enabled = false;
                    _connect.Enabled = true;
                });
            }
        }
    }

    private async void LearnClicked(object? sender, EventArgs e)
    {
        if (_touchDevice is null) return;
        try
        {
            var rotation = await _adb.GetRotationAsync();
            _pendingGesture = null;
            _collector.StartLearning(rotation);
            _learnStatus.Text = $"LEARN MODE (rotation={rotation}): телефоннан ойындағы қажетті батырманы бір рет басыңыз.";
            _learnStatus.ForeColor = Color.DarkBlue;
            Activate();
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Қате", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void OnGestureReady(GestureAction gesture)
    {
        if (IsDisposed || !IsHandleCreated) return;
        BeginInvoke(() =>
        {
            _pendingGesture = gesture;
            _learnStatus.Text = $"ҰСТАЛДЫ: {gesture.Type} | X={gesture.X:P1} Y={gesture.Y:P1} | {gesture.DurationMs} ms. Енді ноутбуктан перне басыңыз.";
            _learnStatus.ForeColor = Color.DarkGreen;
            Activate();
            Focus();
        });
    }

    private void OnKeyDownCapture(object? sender, KeyEventArgs e)
    {
        if (_pendingGesture is null) return;

        var key = FormatKey(e);
        if (string.IsNullOrWhiteSpace(key)) return;

        _bindings.RemoveAll(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        _bindings.Add(new KeyBinding { Key = key, Action = _pendingGesture });
        _pendingGesture = null;
        RefreshGrid();
        SaveProfile(showMessage: false);

        _learnStatus.Text = $"OK: {key} сақталды. Келесі батырма үшін 'Ақылды үйрету' басыңыз.";
        _learnStatus.ForeColor = Color.DarkGreen;
        e.SuppressKeyPress = true;
        e.Handled = true;
    }

    private static string FormatKey(KeyEventArgs e)
    {
        string key = e.KeyCode switch
        {
            Keys.Space => "SPACE",
            Keys.Return => "ENTER",
            Keys.Escape => "ESC",
            Keys.LButton => "LMB",
            Keys.RButton => "RMB",
            Keys.ShiftKey or Keys.LShiftKey or Keys.RShiftKey => "SHIFT",
            Keys.ControlKey or Keys.LControlKey or Keys.RControlKey => "CTRL",
            Keys.Menu or Keys.LMenu or Keys.RMenu => "ALT",
            _ => e.KeyCode.ToString().ToUpperInvariant()
        };

        if (e.Control && !key.Contains("CTRL")) key = "CTRL+" + key;
        if (e.Alt && !key.Contains("ALT")) key = "ALT+" + key;
        if (e.Shift && !key.Contains("SHIFT")) key = "SHIFT+" + key;
        return key;
    }

    private void RefreshGrid()
    {
        _grid.Rows.Clear();
        foreach (var binding in _bindings)
        {
            var a = binding.Action;
            _grid.Rows.Add(binding.Key, a.Type, a.X.ToString("P1"), a.Y.ToString("P1"), a.DurationMs, a.Rotation);
        }
    }

    private async void SaveClicked(object? sender, EventArgs e)
    {
        try
        {
            var path = SaveProfile(showMessage: false);
            MessageBox.Show($"Профиль сақталды:\n{path}", "Almas Smart Learn", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Қате", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        await Task.CompletedTask;
    }

    private string SaveProfile(bool showMessage)
    {
        if (_touchDevice is null) throw new InvalidOperationException("Алдымен телефонды қосыңыз.");
        var name = string.IsNullOrWhiteSpace(_profileName.Text) ? "Game" : _profileName.Text.Trim();
        var profile = new GameProfile
        {
            Name = name,
            Created = DateTime.Now,
            TouchDevice = _touchDevice.Path,
            RawMaxX = _touchDevice.MaxX,
            RawMaxY = _touchDevice.MaxY,
            Bindings = _bindings.ToList()
        };

        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AlmasSmartLearn", "profiles");
        Directory.CreateDirectory(root);
        var safe = string.Concat(name.Select(ch => Path.GetInvalidFileNameChars().Contains(ch) ? '_' : ch));
        var path = Path.Combine(root, safe + ".json");
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };
        File.WriteAllText(path, JsonSerializer.Serialize(profile, options));
        if (showMessage) MessageBox.Show(path, "Сақталды");
        return path;
    }

    private void OnClosing(object? sender, FormClosingEventArgs e)
    {
        try { _collector.CancelLearning(); } catch { }
        try { _lifetime.Cancel(); } catch { }
        try { _adb.StopEventStream(); } catch { }
        try { _adb.Dispose(); } catch { }
        try { _lifetime.Dispose(); } catch { }
    }
}
