using Npgsql;
using Platform.Core.Contracts.Auth;

namespace Platform.Infrastructure.Security;

public sealed class PostgresRefreshTokenStore(string connectionString) : IRefreshTokenStore
{
    private static bool _schemaEnsured;
    private static readonly object SchemaLock = new();

    public async Task<RefreshTokenRecord?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           select token_id, family_id, parent_token_id, token_hash,
                                  user_id, user_name, role,
                                  expires_at_utc, revoked_at_utc, replaced_by_token_id
                           from refresh_tokens
                           where token_hash = @tokenHash;
                           """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("tokenHash", tokenHash);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadRecord(reader);
    }

    public async Task SaveAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           insert into refresh_tokens
                               (token_id, family_id, parent_token_id, token_hash, user_id, user_name, role, expires_at_utc, revoked_at_utc, replaced_by_token_id)
                           values
                               (@tokenId, @familyId, @parentTokenId, @tokenHash, @userId, @userName, @role, @expiresAtUtc, @revokedAtUtc, @replacedByTokenId)
                           on conflict (token_id) do update set
                               token_hash = excluded.token_hash,
                               revoked_at_utc = excluded.revoked_at_utc,
                               replaced_by_token_id = excluded.replaced_by_token_id;
                           """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddRecordParameters(command, record);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateAsync(RefreshTokenRecord record, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           update refresh_tokens
                           set revoked_at_utc = @revokedAtUtc,
                               replaced_by_token_id = @replacedByTokenId
                           where token_id = @tokenId;
                           """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("tokenId", record.TokenId);
        command.Parameters.AddWithValue("revokedAtUtc", (object?)record.RevokedAtUtc ?? DBNull.Value);
        command.Parameters.AddWithValue("replacedByTokenId", (object?)record.ReplacedByTokenId ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);
        return connection;
    }

    private async Task EnsureSchemaAsync(NpgsqlConnection connection, CancellationToken cancellationToken)
    {
        if (_schemaEnsured) return;

        const string ddl = """
                           create table if not exists refresh_tokens (
                               token_id        text primary key,
                               family_id       text not null,
                               parent_token_id text,
                               token_hash      text not null,
                               user_id         text not null,
                               user_name       text not null,
                               role            text not null,
                               expires_at_utc  timestamp not null,
                               revoked_at_utc  timestamp,
                               replaced_by_token_id text
                           );

                           create index if not exists idx_refresh_tokens_token_hash on refresh_tokens (token_hash);
                           create index if not exists idx_refresh_tokens_family_id on refresh_tokens (family_id);
                           create index if not exists idx_refresh_tokens_expires_at on refresh_tokens (expires_at_utc)
                               where revoked_at_utc is null;
                           """;

        await using var command = new NpgsqlCommand(ddl, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);

        lock (SchemaLock)
        {
            _schemaEnsured = true;
        }
    }

    private static RefreshTokenRecord ReadRecord(NpgsqlDataReader reader)
    {
        return new RefreshTokenRecord(
            TokenId: reader.GetString(0),
            FamilyId: reader.GetString(1),
            ParentTokenId: reader.IsDBNull(2) ? null : reader.GetString(2),
            TokenHash: reader.GetString(3),
            UserId: reader.GetString(4),
            UserName: reader.GetString(5),
            Role: reader.GetString(6),
            ExpiresAtUtc: DateTime.SpecifyKind(reader.GetDateTime(7), DateTimeKind.Utc),
            RevokedAtUtc: reader.IsDBNull(8) ? null : DateTime.SpecifyKind(reader.GetDateTime(8), DateTimeKind.Utc),
            ReplacedByTokenId: reader.IsDBNull(9) ? null : reader.GetString(9));
    }

    private static void AddRecordParameters(NpgsqlCommand command, RefreshTokenRecord record)
    {
        command.Parameters.AddWithValue("tokenId", record.TokenId);
        command.Parameters.AddWithValue("familyId", record.FamilyId);
        command.Parameters.AddWithValue("parentTokenId", (object?)record.ParentTokenId ?? DBNull.Value);
        command.Parameters.AddWithValue("tokenHash", record.TokenHash);
        command.Parameters.AddWithValue("userId", record.UserId);
        command.Parameters.AddWithValue("userName", record.UserName);
        command.Parameters.AddWithValue("role", record.Role);
        command.Parameters.AddWithValue("expiresAtUtc", record.ExpiresAtUtc);
        command.Parameters.AddWithValue("revokedAtUtc", (object?)record.RevokedAtUtc ?? DBNull.Value);
        command.Parameters.AddWithValue("replacedByTokenId", (object?)record.ReplacedByTokenId ?? DBNull.Value);
    }
}
