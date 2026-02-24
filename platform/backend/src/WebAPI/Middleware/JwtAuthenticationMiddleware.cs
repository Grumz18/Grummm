using Platform.Core.Contracts.Auth;

namespace Platform.WebAPI.Middleware;

public sealed class JwtAuthenticationMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context, IJwtTokenService jwtTokenService)
    {
        var header = context.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var token = header["Bearer ".Length..].Trim();
        if (!jwtTokenService.TryValidateAccessToken(token, out var principal) || principal is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "invalid_access_token" });
            return;
        }

        context.User = principal;
        await next(context);
    }
}
