using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;

namespace Platform.Modules.ProjectPosts;

public sealed partial class ProjectPostsModule
{
    public partial void MapEndpoints(IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/public/projects");
        var privateGroup = app.MapGroup("/api/app/projects").RequireAuthorization("AdminOnly");

        publicGroup.MapGet("/", async (IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var items = await repository.ListAsync(cancellationToken);
            return Results.Ok(new { items });
        });

        publicGroup.MapGet("/{id}", async (string id, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var item = await repository.GetByIdAsync(id, cancellationToken);
            return item is null ? Results.NotFound() : Results.Ok(item);
        });

        privateGroup.MapGet("/", async (IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var items = await repository.ListAsync(cancellationToken);
            return Results.Ok(new { items });
        });

        privateGroup.MapPost("/", async (UpsertProjectPostRequest request, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            ValidateDto(request);
            var normalized = Normalize(request);
            var created = await repository.UpsertAsync(normalized, cancellationToken);
            return Results.Created($"/api/app/projects/{created.Id}", created);
        });

        privateGroup.MapPut("/{id}", async (string id, UpsertProjectPostRequest request, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            ValidateDto(request);
            var normalized = Normalize(request) with { Id = id.Trim() };
            var updated = await repository.UpsertAsync(normalized, cancellationToken);
            return Results.Ok(updated);
        });

        privateGroup.MapPost("/{id}/upload-with-template",
            async (
                string id,
                HttpRequest httpRequest,
                UploadWithTemplateCommandHandler commandHandler,
                CancellationToken cancellationToken) =>
            {
                var form = await httpRequest.ReadFormAsync(cancellationToken);

                var request = new UploadWithTemplateRequest(
                    TemplateType: form["templateType"].ToString(),
                    FrontendFiles: form.Files
                        .Where(f => string.Equals(f.Name, "frontendFiles", StringComparison.Ordinal))
                        .ToArray(),
                    BackendFiles: form.Files
                        .Where(f => string.Equals(f.Name, "backendFiles", StringComparison.Ordinal))
                        .ToArray());

                ValidateDto(request);
                var command = UploadWithTemplateMappings.ToCommand(id, request);
                var updated = await commandHandler.HandleAsync(command, cancellationToken);

                return updated is null ? Results.NotFound() : Results.Ok(updated);
            });

        privateGroup.MapDelete("/{id}", async (string id, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var deleted = await repository.DeleteAsync(id, cancellationToken);
            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}
