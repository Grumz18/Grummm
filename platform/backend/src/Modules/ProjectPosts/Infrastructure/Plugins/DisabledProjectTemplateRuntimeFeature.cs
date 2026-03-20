using Platform.Modules.ProjectPosts.Application.Plugins;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class DisabledProjectTemplateRuntimeFeature : IProjectTemplateRuntimeFeature
{
    public bool IsEnabled => false;
}
