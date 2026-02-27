using Platform.Modules.TaskTracker.Application.Repositories;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Application.Queries;

public sealed class GetTasksQueryHandler(ITaskItemRepository repository)
{
    public Task<IReadOnlyCollection<TaskItem>> HandleAsync(GetTasksQuery query, CancellationToken cancellationToken = default)
    {
        return repository.ListByOwnerAsync(query.OwnerUserId, cancellationToken);
    }
}
