namespace Platform.Core.Contracts.Audit;

public sealed record AdminActionAuditRecord(
    DateTime OccurredAtUtc,
    string UserId,
    string? UserName,
    string Role,
    string Action,
    string HttpMethod,
    string RequestPath,
    string? QueryString,
    int ResponseStatusCode,
    string? CorrelationId,
    string? IpAddress,
    string? UserAgent);
