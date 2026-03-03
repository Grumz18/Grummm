using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;

namespace Platform.Modules.ProjectPosts.Application.Commands;

public sealed class UploadWithTemplateCommandHandler(IProjectPostRepository repository)
{
    public async Task<ProjectPostDto?> HandleAsync(UploadWithTemplateCommand command, CancellationToken cancellationToken = default)
    {
        UploadWithTemplateCommandValidator.Validate(command);
        return await repository.UploadWithTemplateAsync(command, cancellationToken);
    }
}
