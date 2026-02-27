using System.ComponentModel.DataAnnotations;
using Platform.Modules.TaskTracker.Application.Commands;

namespace Platform.Modules.TaskTracker.Application.Validation;

public static class TaskTrackerCommandValidator
{
    public static void Validate(CreateTaskCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.OwnerUserId))
        {
            throw new ValidationException("OwnerUserId is required.");
        }

        if (string.IsNullOrWhiteSpace(command.Title))
        {
            throw new ValidationException("Title is required.");
        }

        if (command.Title.Length > 120)
        {
            throw new ValidationException("Title length must be <= 120.");
        }

        if (command.Description is { Length: > 2000 })
        {
            throw new ValidationException("Description length must be <= 2000.");
        }
    }

    public static void Validate(CompleteTaskCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.OwnerUserId))
        {
            throw new ValidationException("OwnerUserId is required.");
        }

        if (command.TaskId == Guid.Empty)
        {
            throw new ValidationException("TaskId is required.");
        }
    }
}
