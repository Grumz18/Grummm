using Platform.Modules.TaskTracker.Application.Repositories;
using Platform.Modules.TaskTracker.Application.Validation;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Application.Commands;

public sealed class CompleteTaskCommandHandler(ITaskItemRepository repository)
{
    public async Task<TaskItem?> HandleAsync(CompleteTaskCommand command, CancellationToken cancellationToken = default)
    {
        TaskTrackerCommandValidator.Validate(command);

        var task = await repository.FindByIdAsync(command.TaskId, command.OwnerUserId, cancellationToken);
        if (task is null)
        {
            return null;
        }

        task.Complete(DateTime.UtcNow);
        await repository.UpdateAsync(task, cancellationToken);
        return task;
    }
}
