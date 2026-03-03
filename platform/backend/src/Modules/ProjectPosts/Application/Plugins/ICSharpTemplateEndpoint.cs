using Microsoft.AspNetCore.Http;

namespace Platform.Modules.ProjectPosts.Application.Plugins;

public interface ICSharpTemplateEndpoint
{
    string Method { get; }
    string Path { get; }
    Task<IResult> HandleAsync(HttpContext context, CancellationToken cancellationToken);
}
