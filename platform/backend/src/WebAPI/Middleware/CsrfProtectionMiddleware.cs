using Microsoft.AspNetCore.Antiforgery;

namespace Platform.WebAPI.Middleware;

public sealed class CsrfProtectionMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get,
        HttpMethods.Head,
        HttpMethods.Options,
        HttpMethods.Trace
    };

    public async Task Invoke(HttpContext context, IAntiforgery antiforgery)
    {
        if (SafeMethods.Contains(context.Request.Method))
        {
            await next(context);
            return;
        }

        if (!context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (context.Request.Headers.ContainsKey("Authorization"))
        {
            await next(context);
            return;
        }

        if (context.Request.Cookies.Count == 0)
        {
            await next(context);
            return;
        }

        await antiforgery.ValidateRequestAsync(context);
        await next(context);
    }
}
