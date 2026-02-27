using Platform.Modules.TaskTracker.Application.Repositories;
using Platform.Modules.TaskTracker.Application.Validation;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Application.Commands;

public sealed class CreateTaskCommandHandler(ITaskItemRepository repository)
{
    public async Task<TaskItem> HandleAsync(CreateTaskCommand command, CancellationToken cancellationToken = default)
    {
        TaskTrackerCommandValidator.Validate(command);

        var task = TaskItem.Create(
            ownerUserId: command.OwnerUserId,
            title: command.Title,
            description: command.Description,
            nowUtc: DateTime.UtcNow);

        await repository.AddAsync(task, cancellationToken);
        return task;
    }
}
