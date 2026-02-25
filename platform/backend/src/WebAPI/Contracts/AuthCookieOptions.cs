namespace Platform.WebAPI.Contracts;

public sealed class AuthCookieOptions
{
    public string RefreshTokenCookieName { get; init; } = "__Host-platform-rt";
    public string Path { get; init; } = "/api/public/auth";
    public bool UseStrictSameSite { get; init; } = true;
}
