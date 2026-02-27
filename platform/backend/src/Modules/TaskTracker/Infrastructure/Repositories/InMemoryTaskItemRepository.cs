using System.Collections.Concurrent;
using Platform.Modules.TaskTracker.Application.Repositories;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Infrastructure.Repositories;

public sealed class InMemoryTaskItemRepository : ITaskItemRepository
{
    private readonly ConcurrentDictionary<Guid, TaskItem> _items = new();

    public Task AddAsync(TaskItem taskItem, CancellationToken cancellationToken = default)
    {
        _items[taskItem.Id] = taskItem;
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<TaskItem>> ListByOwnerAsync(string ownerUserId, CancellationToken cancellationToken = default)
    {
        var result = _items.Values
            .Where(x => string.Equals(x.OwnerUserId, ownerUserId, StringComparison.Ordinal))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToArray();

        return Task.FromResult<IReadOnlyCollection<TaskItem>>(result);
    }

    public Task<TaskItem?> FindByIdAsync(Guid taskId, string ownerUserId, CancellationToken cancellationToken = default)
    {
        if (_items.TryGetValue(taskId, out var task)
            && string.Equals(task.OwnerUserId, ownerUserId, StringComparison.Ordinal))
        {
            return Task.FromResult<TaskItem?>(task);
        }

        return Task.FromResult<TaskItem?>(null);
    }

    public Task UpdateAsync(TaskItem taskItem, CancellationToken cancellationToken = default)
    {
        _items[taskItem.Id] = taskItem;
        return Task.CompletedTask;
    }

    public Task<int> CountAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_items.Count);
    }
}
