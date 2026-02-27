using Platform.Modules.TaskTracker.Application.Commands;
using Platform.Modules.TaskTracker.Domain;

namespace Platform.Modules.TaskTracker.Contracts;

public static class TaskTrackerMappings
{
    public static CreateTaskCommand ToCreateCommand(CreateTaskRequest request, string ownerUserId)
    {
        return new CreateTaskCommand(
            OwnerUserId: ownerUserId,
            Title: request.Title.Trim(),
            Description: string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());
    }

    public static CompleteTaskCommand ToCompleteCommand(Guid taskId, string ownerUserId)
    {
        return new CompleteTaskCommand(ownerUserId, taskId);
    }

    public static TaskItemDto ToDto(TaskItem task)
    {
        return new TaskItemDto(
            Id: task.Id,
            Title: task.Title,
            Description: task.Description,
            IsCompleted: task.IsCompleted,
            CreatedAtUtc: task.CreatedAtUtc,
            CompletedAtUtc: task.CompletedAtUtc);
    }
}
