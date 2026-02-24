namespace Platform.Core.Contracts.Auth;

public interface IRefreshTokenService
{
    Task<TokenPair> IssueAsync(AuthUser user, CancellationToken cancellationToken = default);
    Task<RefreshTokenRotationResult> RotateAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<bool> RevokeAsync(string refreshToken, CancellationToken cancellationToken = default);
}
