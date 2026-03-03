using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Platform.Modules.ProjectPosts.Application.Plugins;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class PythonTemplatePluginBootstrapHostedService(
    IProjectPostRepository repository,
    IPythonTemplateRuntime pythonRuntime,
    ILogger<PythonTemplatePluginBootstrapHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var posts = await repository.ListAsync(cancellationToken);
        var pythonPosts = posts.Where(p => p.Template == TemplateType.Python).ToArray();
        foreach (var post in pythonPosts)
        {
            try
            {
                await pythonRuntime.LoadForSlugAsync(post.Id, post.BackendPath, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to bootstrap Python runtime for slug {Slug}", post.Id);
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
