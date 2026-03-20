using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Platform.Modules.ProjectPosts.Application.Plugins;

namespace Platform.Modules.ProjectPosts;

public sealed partial class ProjectPostsModule
{
    partial void MapRuntimeEndpoints(IEndpointRouteBuilder app)
    {
        var dynamicPluginGroup = app.MapGroup("/api/app/{slug}").RequireAuthorization("AdminOnly");
        dynamicPluginGroup.MapMethods("/{**pluginPath}",
            ["GET", "POST", "PUT", "PATCH", "DELETE"],
            async (
                string slug,
                string? pluginPath,
                HttpContext httpContext,
                ICSharpTemplatePluginRuntime pluginRuntime,
                IPythonTemplateRuntime pythonRuntime,
                CancellationToken cancellationToken) =>
            {
                if (string.Equals(slug, "projects", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "tasks", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "auth", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "security", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.NotFound();
                }

                var dispatchPath = "/" + (pluginPath ?? string.Empty);
                var dispatchResult = await pluginRuntime.DispatchAsync(
                    slug,
                    dispatchPath,
                    httpContext.Request.Method,
                    httpContext,
                    cancellationToken);

                if (dispatchResult is not null)
                {
                    return dispatchResult;
                }

                var pythonResult = await pythonRuntime.DispatchAsync(
                    slug,
                    dispatchPath,
                    httpContext.Request.Method,
                    httpContext,
                    cancellationToken);

                return pythonResult ?? Results.NotFound();
            });
    }
}
