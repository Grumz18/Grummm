using System.Collections.Concurrent;
using Platform.Core.Contracts.Auth;

namespace Platform.Infrastructure.Security;

public sealed class InMemoryRefreshTokenStore : IRefreshTokenStore
{
    private readonly ConcurrentDictionary<string, RefreshTokenRecord> _tokensById = new();
    private readonly ConcurrentDictionary<string, string> _tokenHashIndex = new();

    public Task<RefreshTokenRecord?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        if (_tokenHashIndex.TryGetValue(tokenHash, out var tokenId) && _tokensById.TryGetValue(tokenId, out var record))
        {
            return Task.FromResult<RefreshTokenRecord?>(record);
        }

        return Task.FromResult<RefreshTokenRecord?>(null);
    }

    public Task SaveAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default)
    {
        _tokensById[record.TokenId] = record;
        _tokenHashIndex[record.TokenHash] = record.TokenId;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default)
    {
        _tokensById[record.TokenId] = record;
        _tokenHashIndex[record.TokenHash] = record.TokenId;
        return Task.CompletedTask;
    }
}
