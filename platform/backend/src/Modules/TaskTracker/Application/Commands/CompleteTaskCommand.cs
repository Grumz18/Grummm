namespace Platform.Modules.TaskTracker.Application.Commands;

public sealed record CompleteTaskCommand(
    string OwnerUserId,
    Guid TaskId);
