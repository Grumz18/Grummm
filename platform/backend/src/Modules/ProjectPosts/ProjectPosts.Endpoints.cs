using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.StaticFiles;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Security.Claims;
using System.Xml.Linq;
using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Application.Plugins;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;
using Platform.Modules.ProjectPosts.Domain.Entities;
using Platform.Modules.ProjectPosts.Infrastructure.Repositories;

namespace Platform.Modules.ProjectPosts;

public sealed partial class ProjectPostsModule
{
    private static readonly XNamespace SitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
    private static readonly FileExtensionContentTypeProvider ViewerContentTypeProvider = new();

    public partial void MapEndpoints(IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/public/projects");
        var privateGroup = app.MapGroup("/api/app/projects").RequireAuthorization("AdminOnly");
        var publicContentGroup = app.MapGroup("/api/public/content");
        var privateContentGroup = app.MapGroup("/api/app/content").RequireAuthorization("AdminOnly");

        app.MapGet("/sitemap.xml", async (HttpContext context, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var items = await repository.ListAsync(cancellationToken);
            var xml = BuildSitemapXml(context, items);
            return Results.Text(xml, "application/xml; charset=utf-8");
        });

        publicGroup.MapGet("/", async (IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var items = await repository.ListAsync(cancellationToken);
            return Results.Ok(new { items = items.Select(ToPublicProjectPostDto).ToArray() });
        });

        publicGroup.MapGet("/{id}/viewer/{**assetPath}", async (
            string id,
            string? assetPath,
            HttpContext httpContext,
            IProjectPostRepository repository,
            CancellationToken cancellationToken) =>
        {
            var item = await repository.GetByIdAsync(id, cancellationToken);
            if (item is null
                || item.Kind != ProjectEntryKind.Project
                || item.Template != TemplateType.Static
                || !item.PublicDemoEnabled
                || string.IsNullOrWhiteSpace(item.FrontendPath)
                || !Directory.Exists(item.FrontendPath))
            {
                return Results.NotFound();
            }

            if (!TryResolveProjectViewerFile(item.FrontendPath, assetPath, out var fullPath) || fullPath is null)
            {
                return Results.NotFound();
            }

            httpContext.Response.Headers.CacheControl = "public, max-age=300";
            httpContext.Response.Headers.Append("X-Robots-Tag", "noindex, nofollow");
            httpContext.Response.Headers.Append("Referrer-Policy", "same-origin");

            return Results.File(fullPath, GetViewerContentType(fullPath), enableRangeProcessing: false);
        });

        publicGroup.MapGet("/{id}", async (string id, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var item = await repository.GetByIdAsync(id, cancellationToken);
            return item is null ? Results.NotFound() : Results.Ok(ToPublicProjectPostDto(item));
        });

        privateGroup.MapGet("/", async (IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var items = await repository.ListAsync(cancellationToken);
            return Results.Ok(new { items = items.Select(ToPublicProjectPostDto).ToArray() });
        });

        publicContentGroup.MapGet("/landing", async (IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            var content = await repository.GetLandingContentAsync(cancellationToken);
            return Results.Ok(content);
        });

        privateContentGroup.MapPut("/landing", async (UpsertLandingContentRequest request, IProjectPostRepository repository, CancellationToken cancellationToken) =>
        {
            ValidateDto(request);
            var normalized = Normalize(request);
            var updated = await repository.UpsertLandingContentAsync(normalized, cancellationToken);
            return Results.Ok(updated);
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
                if (!httpRequest.HasFormContentType)
                {
                    throw new ValidationException("Content-Type must be multipart/form-data.");
                }

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
                var command = UploadWithTemplateMappings.ToCommand(
                    id: id,
                    request: request,
                    correlationId: httpRequest.HttpContext.TraceIdentifier,
                    performedByUserId: httpRequest.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown",
                    performedByUserName: httpRequest.HttpContext.User.FindFirstValue(ClaimTypes.Name));
                var updated = await commandHandler.HandleAsync(command, cancellationToken);

                return updated is null ? Results.NotFound() : Results.Ok(updated);
            });

        var dynamicPluginGroup = app.MapGroup("/api/app/{slug}").RequireAuthorization("AdminOnly");
        dynamicPluginGroup.MapMethods("/{**pluginPath}",
            ["GET", "POST", "PUT", "PATCH", "DELETE"],
            async (
                string slug,
                string? pluginPath,
                HttpContext httpContext,
                ICSharpTemplatePluginRuntime pluginRuntime,
                IPythonTemplateRuntime pythonRuntime,
                CancellationToken cancellationToken) =>
            {
                if (string.Equals(slug, "projects", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "tasks", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "auth", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(slug, "security", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.NotFound();
                }

                var dispatchPath = "/" + (pluginPath ?? string.Empty);
                var dispatchResult = await pluginRuntime.DispatchAsync(
                    slug,
                    dispatchPath,
                    httpContext.Request.Method,
                    httpContext,
                    cancellationToken);

                if (dispatchResult is not null)
                {
                    return dispatchResult;
                }

                var pythonResult = await pythonRuntime.DispatchAsync(
                    slug,
                    dispatchPath,
                    httpContext.Request.Method,
                    httpContext,
                    cancellationToken);

                return pythonResult ?? Results.NotFound();
            });

        privateGroup.MapDelete("/{id}", async (
            string id,
            IProjectPostRepository repository,
            ICSharpTemplatePluginRuntime pluginRuntime,
            IPythonTemplateRuntime pythonRuntime,
            CancellationToken cancellationToken) =>
        {
            await pluginRuntime.UnloadForSlugAsync(id, cancellationToken);
            await pythonRuntime.UnloadForSlugAsync(id, cancellationToken);
            var deleted = await repository.DeleteAsync(id, cancellationToken);

            if (deleted)
            {
                ProjectTemplateStorage.ResetProjectFolder(id);
            }

            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }

    private static ProjectPostDto ToPublicProjectPostDto(ProjectPostDto item) => item with { FrontendPath = null, BackendPath = null };

    private static string BuildSitemapXml(HttpContext context, IReadOnlyList<ProjectPostDto> items)
    {
        var baseUrl = $"{context.Request.Scheme}://{context.Request.Host.Value}".TrimEnd('/');
        var urls = new List<(string Path, DateTimeOffset? LastModified)>
        {
            ("/", null),
            ("/posts", null),
            ("/projects", null)
        };

        urls.AddRange(items.Select(item => (
            Path: item.Kind == ProjectEntryKind.Post ? $"/posts/{item.Id}" : $"/projects/{item.Id}",
            LastModified: item.PublishedAt)));

        var document = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement(
                SitemapNamespace + "urlset",
                urls
                    .DistinctBy(entry => entry.Path, StringComparer.OrdinalIgnoreCase)
                    .Select(entry =>
                    {
                        var urlElement = new XElement(
                            SitemapNamespace + "url",
                            new XElement(SitemapNamespace + "loc", $"{baseUrl}{entry.Path}"));

                        if (entry.LastModified is not null)
                        {
                            urlElement.Add(new XElement(
                                SitemapNamespace + "lastmod",
                                entry.LastModified.Value.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ")));
                        }

                        return urlElement;
                    })));

        return document.ToString();
    }

    private static bool TryResolveProjectViewerFile(string rootDirectory, string? assetPath, out string? fullPath)
    {
        fullPath = null;
        var rootFullPath = Path.GetFullPath(rootDirectory);
        var normalizedPath = string.IsNullOrWhiteSpace(assetPath)
            ? "index.html"
            : assetPath.Replace('\\', '/').Trim('/');

        var segments = normalizedPath
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(segment => segment != ".")
            .ToArray();

        if (segments.Any(segment => segment == ".."))
        {
            return false;
        }

        var candidatePath = Path.GetFullPath(Path.Combine([rootFullPath, .. segments]));
        if (!candidatePath.StartsWith(rootFullPath, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (File.Exists(candidatePath))
        {
            fullPath = candidatePath;
            return true;
        }

        if (Path.HasExtension(candidatePath))
        {
            return false;
        }

        var indexPath = Path.Combine(rootFullPath, "index.html");
        if (!File.Exists(indexPath))
        {
            return false;
        }

        fullPath = indexPath;
        return true;
    }

    private static string GetViewerContentType(string filePath)
    {
        return ViewerContentTypeProvider.TryGetContentType(filePath, out var contentType)
            ? contentType
            : "application/octet-stream";
    }
}