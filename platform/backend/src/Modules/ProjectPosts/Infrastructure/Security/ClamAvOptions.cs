namespace Platform.Modules.ProjectPosts.Infrastructure.Security;

public sealed class ClamAvOptions
{
    public bool Enabled { get; init; } = false;
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 3310;
    public int ConnectTimeoutSeconds { get; init; } = 5;
    public int ScanTimeoutSeconds { get; init; } = 60;
    public long MaxFileSizeBytes { get; init; } = 100 * 1024 * 1024;
}
