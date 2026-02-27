namespace Platform.Modules.TaskTracker.Application.Queries;

public sealed record GetTaskByIdQuery(string OwnerUserId, Guid TaskId);
