namespace Platform.Infrastructure.Audit;

public sealed class AdminActionAuditEntity
{
    public long Id { get; set; }
    public DateTime OccurredAtUtc { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string RequestPath { get; set; } = string.Empty;
    public string? QueryString { get; set; }
    public int ResponseStatusCode { get; set; }
    public string? CorrelationId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
