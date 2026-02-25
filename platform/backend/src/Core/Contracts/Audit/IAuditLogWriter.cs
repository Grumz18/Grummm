namespace Platform.Core.Contracts.Audit;

public interface IAuditLogWriter
{
    Task WriteAdminActionAsync(AdminActionAuditRecord record, CancellationToken cancellationToken = default);
}
