namespace Platform.Modules.TaskTracker.Application.Commands;

public sealed record CreateTaskCommand(
    string OwnerUserId,
    string Title,
    string? Description);
