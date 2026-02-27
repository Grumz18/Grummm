using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Application.Repositories;

public interface ITaskItemRepository
{
    Task AddAsync(TaskItem taskItem, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskItem>> ListByOwnerAsync(string ownerUserId, CancellationToken cancellationToken = default);
    Task<TaskItem?> FindByIdAsync(Guid taskId, string ownerUserId, CancellationToken cancellationToken = default);
    Task UpdateAsync(TaskItem taskItem, CancellationToken cancellationToken = default);
    Task<int> CountAllAsync(CancellationToken cancellationToken = default);
}
