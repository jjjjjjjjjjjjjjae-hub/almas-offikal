namespace AlmasSmartLearn;

public sealed class TouchDevice
{
    public string Path { get; init; } = "";
    public string Name { get; init; } = "";
    public double MaxX { get; init; }
    public double MaxY { get; init; }
}

public sealed class GestureAction
{
    public string Type { get; init; } = "TAP";
    public double X { get; init; }
    public double Y { get; init; }
    public double? X2 { get; init; }
    public double? Y2 { get; init; }
    public int DurationMs { get; init; }
    public int Rotation { get; init; }
}

public sealed class KeyBinding
{
    public string Key { get; init; } = "";
    public GestureAction Action { get; init; } = new();
}

public sealed class GameProfile
{
    public string Schema { get; init; } = "almas.game.profile.v2";
    public string Name { get; init; } = "Free Fire";
    public DateTime Created { get; init; } = DateTime.Now;
    public string Source { get; init; } = "root-getevent-smart-learn";
    public string TouchDevice { get; init; } = "";
    public double RawMaxX { get; init; }
    public double RawMaxY { get; init; }
    public List<KeyBinding> Bindings { get; init; } = new();
}
