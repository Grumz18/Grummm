using Microsoft.AspNetCore.Http;

namespace Platform.Modules.ProjectPosts.Application.Plugins;

public interface IPythonTemplateRuntime
{
    Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken);
    Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken);
    Task<IResult?> DispatchAsync(string slug, string path, string method, HttpContext context, CancellationToken cancellationToken);
}
