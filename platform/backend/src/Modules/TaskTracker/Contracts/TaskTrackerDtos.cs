using System.ComponentModel.DataAnnotations;

namespace Platform.Modules.TaskTracker.Contracts;

public sealed record CreateTaskRequest(
    [property: Required, MinLength(1), MaxLength(120)] string Title,
    [property: MaxLength(2000)] string? Description);

public sealed record TaskItemDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsCompleted,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc);
