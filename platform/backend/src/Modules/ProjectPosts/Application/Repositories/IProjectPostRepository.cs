using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Contracts;

namespace Platform.Modules.ProjectPosts.Application.Repositories;

public interface IProjectPostRepository
{
    Task<IReadOnlyList<ProjectPostDto>> ListAsync(CancellationToken cancellationToken);
    Task<ProjectPostDto?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<ProjectPostDto> UpsertAsync(ProjectPostDto post, CancellationToken cancellationToken);
    Task<ProjectPostDto?> UploadWithTemplateAsync(UploadWithTemplateCommand command, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken);
}
