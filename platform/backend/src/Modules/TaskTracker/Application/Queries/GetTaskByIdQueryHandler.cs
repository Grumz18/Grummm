using Platform.Modules.TaskTracker.Application.Repositories;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Application.Queries;

public sealed class GetTaskByIdQueryHandler(ITaskItemRepository repository)
{
    public Task<TaskItem?> HandleAsync(GetTaskByIdQuery query, CancellationToken cancellationToken = default)
    {
        return repository.FindByIdAsync(query.TaskId, query.OwnerUserId, cancellationToken);
    }
}
