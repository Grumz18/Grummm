using System.Net;
using Microsoft.AspNetCore.Antiforgery;
using Platform.WebAPI.Validation;

namespace Platform.WebAPI.Middleware;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (RequestValidationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/problem+json";

            var problem = new
            {
                type = "https://httpstatuses.com/400",
                title = "Validation failed",
                status = context.Response.StatusCode,
                traceId = context.TraceIdentifier,
                errors = ex.Errors
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (Exception ex)
        {
            if (ex is AntiforgeryValidationException)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                context.Response.ContentType = "application/problem+json";

                var csrfProblem = new
                {
                    type = "https://httpstatuses.com/400",
                    title = "CSRF validation failed",
                    status = context.Response.StatusCode,
                    traceId = context.TraceIdentifier
                };

                await context.Response.WriteAsJsonAsync(csrfProblem);
                return;
            }

            logger.LogError(ex, "Unhandled exception. CorrelationId: {CorrelationId}", context.TraceIdentifier);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var problem = new
            {
                type = "https://httpstatuses.com/500",
                title = "Internal Server Error",
                status = context.Response.StatusCode,
                traceId = context.TraceIdentifier
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
