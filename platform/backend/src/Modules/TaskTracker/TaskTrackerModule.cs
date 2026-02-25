using System.ComponentModel.DataAnnotations;
using Platform.Core.Contracts.Security;
using Platform.Core.Contracts.Modules;
using Platform.Modules.TaskTracker.Contracts;

namespace Platform.Modules.TaskTracker;

public sealed class TaskTrackerModule : IModule
{
    public void RegisterServices(IServiceCollection services)
    {
        // Placeholder module: no business services yet.
    }

    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/public/tasks");
        var privateGroup = app.MapGroup("/api/app/tasks").RequireAuthorization("AdminOnly");

        publicGroup.MapGet("/", () => Results.Ok(new
        {
            module = "TaskTracker",
            area = "public",
            message = "TaskTracker public placeholder endpoint"
        }));

        privateGroup.MapGet("/", () => Results.Ok(new
        {
            module = "TaskTracker",
            area = "private",
            message = "TaskTracker private placeholder endpoint"
        }));

        privateGroup.MapGet("/{ownerUserId}/items", (HttpContext context, string ownerUserId) =>
        {
            if (!OwnershipGuard.IsOwnerOrAdmin(context.User, ownerUserId))
            {
                return Results.Forbid();
            }

            return Results.Ok(new
            {
                module = "TaskTracker",
                ownerUserId,
                items = Array.Empty<object>()
            });
        });

        privateGroup.MapPost("/{ownerUserId}/items", (HttpContext context, string ownerUserId, CreateTaskRequest request) =>
        {
            ValidateDto(request);

            if (!OwnershipGuard.IsOwnerOrAdmin(context.User, ownerUserId))
            {
                return Results.Forbid();
            }

            var command = TaskTrackerMappings.ToCommand(request, ownerUserId);

            return Results.Ok(new
            {
                module = "TaskTracker",
                action = "create",
                ownerUserId = command.OwnerUserId,
                title = command.Title,
                description = command.Description
            });
        });
    }

    private static void ValidateDto<T>(T request)
    {
        var context = new ValidationContext(request!);
        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(request!, context, results, true);

        if (isValid)
        {
            return;
        }

        var errors = results
            .Select(r => r.ErrorMessage ?? "Validation error")
            .ToArray();

        throw new ValidationException(string.Join("; ", errors));
    }
}
