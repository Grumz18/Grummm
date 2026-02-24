namespace Platform.Core.Contracts.Auth;

public sealed record AuthUser(string UserId, string UserName, string Role);

public sealed record TokenPair(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);

public sealed record RefreshTokenRotationResult(
    bool Success,
    TokenPair? Tokens,
    string? Error);

public sealed record RefreshTokenRecord(
    string TokenId,
    string FamilyId,
    string? ParentTokenId,
    string TokenHash,
    string UserId,
    string UserName,
    string Role,
    DateTime ExpiresAtUtc,
    DateTime? RevokedAtUtc,
    string? ReplacedByTokenId);
