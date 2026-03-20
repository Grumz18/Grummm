using Microsoft.AspNetCore.Http;
using Platform.Modules.ProjectPosts.Application.Plugins;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class NoopCSharpTemplatePluginRuntime : ICSharpTemplatePluginRuntime
{
    public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task<IResult?> DispatchAsync(string slug, string path, string method, HttpContext context, CancellationToken cancellationToken)
    {
        return Task.FromResult<IResult?>(null);
    }
}
