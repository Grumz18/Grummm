using Microsoft.Extensions.DependencyInjection;
using Platform.Modules.ProjectPosts.Application.Plugins;
using Platform.Modules.ProjectPosts.Infrastructure.Plugins;

namespace Platform.Modules.ProjectPosts;

public sealed partial class ProjectPostsModule
{
    partial void RegisterRuntimeServices(IServiceCollection services)
    {
        services.AddReverseProxy();
        services.AddOptions<PythonTemplateRuntimeOptions>()
            .BindConfiguration("PythonRuntime");
        services.AddSingleton<ICSharpTemplatePluginRuntime, CSharpTemplatePluginRuntime>();
        services.AddSingleton<IPythonTemplateRuntime, PythonTemplateRuntime>();
        services.AddSingleton<IProjectTemplateRuntimeFeature, EnabledProjectTemplateRuntimeFeature>();
        services.AddHostedService<CSharpTemplatePluginBootstrapHostedService>();
        services.AddHostedService<PythonTemplatePluginBootstrapHostedService>();
    }

    private sealed class EnabledProjectTemplateRuntimeFeature : IProjectTemplateRuntimeFeature
    {
        public bool IsEnabled => true;
    }
}
