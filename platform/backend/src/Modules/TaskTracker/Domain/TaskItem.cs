namespace Platform.Modules.TaskTracker.Domain;

public sealed class TaskItem
{
    private TaskItem(
        Guid id,
        string ownerUserId,
        string title,
        string? description,
        DateTime createdAtUtc)
    {
        Id = id;
        OwnerUserId = ownerUserId;
        Title = title;
        Description = description;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; }
    public string OwnerUserId { get; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime CreatedAtUtc { get; }
    public DateTime? CompletedAtUtc { get; private set; }

    public static TaskItem Create(string ownerUserId, string title, string? description, DateTime nowUtc)
    {
        return new TaskItem(
            id: Guid.NewGuid(),
            ownerUserId: ownerUserId,
            title: title,
            description: description,
            createdAtUtc: nowUtc);
    }

    public void Complete(DateTime nowUtc)
    {
        if (IsCompleted)
        {
            return;
        }

        IsCompleted = true;
        CompletedAtUtc = nowUtc;
    }
}
