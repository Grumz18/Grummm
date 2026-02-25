namespace Platform.Modules.TaskTracker.Contracts;

public static class TaskTrackerMappings
{
    public static CreateTaskCommand ToCommand(CreateTaskRequest request, string ownerUserId)
    {
        return new CreateTaskCommand(
            OwnerUserId: ownerUserId,
            Title: request.Title.Trim(),
            Description: string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());
    }
}
