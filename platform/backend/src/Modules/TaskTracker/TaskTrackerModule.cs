using Platform.Core.Contracts.Modules;

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
    }
}
