namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class PythonTemplateRuntimeOptions
{
    public bool Enabled { get; init; } = true;
    public string PythonExecutable { get; init; } = "python3";
    public string? PythonDll { get; init; }
    public string[] RestrictedImports { get; init; } = ["os", "subprocess", "socket", "ctypes"];
}
