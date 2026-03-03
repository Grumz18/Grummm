using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Platform.Modules.ProjectPosts.Application.Plugins;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class CSharpTemplatePluginBootstrapHostedService(
    IProjectPostRepository repository,
    ICSharpTemplatePluginRuntime pluginRuntime,
    ILogger<CSharpTemplatePluginBootstrapHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var posts = await repository.ListAsync(cancellationToken);
        var csharpPosts = posts.Where(p => p.Template == TemplateType.CSharp).ToArray();
        foreach (var post in csharpPosts)
        {
            try
            {
                await pluginRuntime.LoadForSlugAsync(post.Id, post.BackendPath, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to bootstrap C# plugin for slug {Slug}", post.Id);
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
