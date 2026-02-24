namespace Platform.Core.Contracts.Auth;

public interface IRefreshTokenStore
{
    Task<RefreshTokenRecord?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task SaveAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default);
    Task UpdateAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default);
}
