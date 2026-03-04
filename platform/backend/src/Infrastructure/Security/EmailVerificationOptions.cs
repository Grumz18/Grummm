namespace Platform.Infrastructure.Security;

public sealed class EmailVerificationOptions
{
    public bool Enabled { get; init; } = false;
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; } = 587;
    public bool UseSsl { get; init; } = true;
    public string SmtpUser { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
}

