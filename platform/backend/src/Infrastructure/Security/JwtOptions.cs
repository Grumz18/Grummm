namespace Platform.Infrastructure.Security;

public sealed class JwtOptions
{
    public string Issuer { get; init; } = "platform";
    public string Audience { get; init; } = "platform-client";
    public string SigningKey { get; init; } = "change-this-dev-signing-key-minimum-length";
    public int AccessTokenLifetimeMinutes { get; init; } = 15;
    public int RefreshTokenLifetimeDays { get; init; } = 7;
    public int ClockSkewSeconds { get; init; } = 0;
}
