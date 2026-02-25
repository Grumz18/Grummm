using Platform.Core.Contracts.Audit;

namespace Platform.Infrastructure.Audit;

public sealed class NoopAuditLogWriter : IAuditLogWriter
{
    public Task WriteAdminActionAsync(AdminActionAuditRecord record, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
