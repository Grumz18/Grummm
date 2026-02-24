using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Platform.Core.Contracts.Auth;

namespace Platform.Infrastructure.Security;

public sealed class RefreshTokenService(
    IJwtTokenService jwtTokenService,
    IRefreshTokenStore refreshTokenStore,
    IOptions<JwtOptions> options,
    ILogger<RefreshTokenService> logger) : IRefreshTokenService
{
    private readonly JwtOptions _options = options.Value;

    public async Task<TokenPair> IssueAsync(AuthUser user, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var refreshToken = GenerateToken();
        var tokenId = Guid.NewGuid().ToString("N");
        var refreshExpiresAtUtc = now.AddDays(_options.RefreshTokenLifetimeDays);

        var record = new RefreshTokenRecord(
            TokenId: tokenId,
            FamilyId: tokenId,
            ParentTokenId: null,
            TokenHash: ComputeHash(refreshToken),
            UserId: user.UserId,
            UserName: user.UserName,
            Role: user.Role,
            ExpiresAtUtc: refreshExpiresAtUtc,
            RevokedAtUtc: null,
            ReplacedByTokenId: null);

        await refreshTokenStore.SaveAsync(record, cancellationToken);

        var accessExpiresAtUtc = jwtTokenService.GetAccessTokenExpiryUtc();
        var accessToken = jwtTokenService.CreateAccessToken(user, accessExpiresAtUtc);

        return new TokenPair(accessToken, accessExpiresAtUtc, refreshToken, refreshExpiresAtUtc);
    }

    public async Task<RefreshTokenRotationResult> RotateAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return new RefreshTokenRotationResult(false, null, "refresh_token_required");
        }

        var now = DateTime.UtcNow;
        var tokenHash = ComputeHash(refreshToken);
        var current = await refreshTokenStore.FindByTokenHashAsync(tokenHash, cancellationToken);

        if (current is null)
        {
            return new RefreshTokenRotationResult(false, null, "refresh_token_not_found");
        }

        if (current.RevokedAtUtc is not null)
        {
            return new RefreshTokenRotationResult(false, null, "refresh_token_revoked");
        }

        if (current.ExpiresAtUtc <= now)
        {
            return new RefreshTokenRotationResult(false, null, "refresh_token_expired");
        }

        var newRefreshToken = GenerateToken();
        var newTokenId = Guid.NewGuid().ToString("N");
        var newRefreshExpiresAtUtc = now.AddDays(_options.RefreshTokenLifetimeDays);

        var rotated = new RefreshTokenRecord(
            TokenId: newTokenId,
            FamilyId: current.FamilyId,
            ParentTokenId: current.TokenId,
            TokenHash: ComputeHash(newRefreshToken),
            UserId: current.UserId,
            UserName: current.UserName,
            Role: current.Role,
            ExpiresAtUtc: newRefreshExpiresAtUtc,
            RevokedAtUtc: null,
            ReplacedByTokenId: null);

        var revokedCurrent = current with
        {
            RevokedAtUtc = now,
            ReplacedByTokenId = newTokenId
        };

        await refreshTokenStore.UpdateAsync(revokedCurrent, cancellationToken);
        await refreshTokenStore.SaveAsync(rotated, cancellationToken);

        var accessExpiresAtUtc = jwtTokenService.GetAccessTokenExpiryUtc();
        var accessToken = jwtTokenService.CreateAccessToken(
            new AuthUser(current.UserId, current.UserName, current.Role),
            accessExpiresAtUtc);

        logger.LogInformation(
            "Refresh token rotated. FamilyId: {FamilyId}, OldTokenId: {OldTokenId}, NewTokenId: {NewTokenId}",
            current.FamilyId,
            current.TokenId,
            newTokenId);

        var pair = new TokenPair(accessToken, accessExpiresAtUtc, newRefreshToken, newRefreshExpiresAtUtc);
        return new RefreshTokenRotationResult(true, pair, null);
    }

    public async Task<bool> RevokeAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return false;
        }

        var current = await refreshTokenStore.FindByTokenHashAsync(ComputeHash(refreshToken), cancellationToken);
        if (current is null || current.RevokedAtUtc is not null)
        {
            return false;
        }

        var revoked = current with { RevokedAtUtc = DateTime.UtcNow };
        await refreshTokenStore.UpdateAsync(revoked, cancellationToken);
        return true;
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[48];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string ComputeHash(string input)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash);
    }
}
