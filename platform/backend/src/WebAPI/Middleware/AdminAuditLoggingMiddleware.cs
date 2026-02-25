using System.Security.Claims;
using Platform.Core.Contracts.Audit;

namespace Platform.WebAPI.Middleware;

public sealed class AdminAuditLoggingMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get,
        HttpMethods.Head,
        HttpMethods.Options,
        HttpMethods.Trace
    };

    public async Task Invoke(HttpContext context, IAuditLogWriter auditLogWriter)
    {
        await next(context);

        if (!ShouldAudit(context))
        {
            return;
        }

        var user = context.User;
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        var userName = user.FindFirstValue(ClaimTypes.Name);
        var role = user.FindFirstValue(ClaimTypes.Role) ?? "unknown";
        var action = $"{context.Request.Method} {context.Request.Path}";
        var query = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null;
        var ip = context.Connection.RemoteIpAddress?.ToString();
        var userAgent = context.Request.Headers.UserAgent.ToString();

        var record = new AdminActionAuditRecord(
            OccurredAtUtc: DateTime.UtcNow,
            UserId: userId,
            UserName: userName,
            Role: role,
            Action: action,
            HttpMethod: context.Request.Method,
            RequestPath: context.Request.Path.ToString(),
            QueryString: query,
            ResponseStatusCode: context.Response.StatusCode,
            CorrelationId: context.TraceIdentifier,
            IpAddress: ip,
            UserAgent: string.IsNullOrWhiteSpace(userAgent) ? null : userAgent);

        await auditLogWriter.WriteAdminActionAsync(record, context.RequestAborted);
    }

    private static bool ShouldAudit(HttpContext context)
    {
        if (SafeMethods.Contains(context.Request.Method))
        {
            return false;
        }

        if (!context.Request.Path.StartsWithSegments("/api/app", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var user = context.User;
        return user.Identity?.IsAuthenticated is true && user.IsInRole("Admin");
    }
}
