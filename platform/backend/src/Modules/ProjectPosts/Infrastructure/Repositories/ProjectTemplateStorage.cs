using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Infrastructure.Repositories;

internal static class ProjectTemplateStorage
{
    private const string StorageRootPath = "/var/projects";

    public static string GetProjectRoot(string id) => Path.Combine(StorageRootPath, id);
    public static string GetFrontendFolder(string id) => Path.Combine(GetProjectRoot(id), "frontend");
    public static string GetBackendFolder(string id) => Path.Combine(GetProjectRoot(id), "backend");
    public static string GetFrontendPath(string id) => $"/var/projects/{id}/frontend";
    public static string? GetBackendPath(string id, TemplateType templateType) =>
        templateType == TemplateType.Static ? null : $"/var/projects/{id}/backend";

    public static void ResetProjectFolder(string id)
    {
        var projectRoot = GetProjectRoot(id);
        if (Directory.Exists(projectRoot))
        {
            Directory.Delete(projectRoot, recursive: true);
        }
    }

    public static async Task SaveTemplateFilesAsync(
        string id,
        IEnumerable<IFormFile> frontendFiles,
        IEnumerable<IFormFile> backendFiles,
        TemplateType templateType,
        CancellationToken cancellationToken)
    {
        await SaveFilesAsync(GetFrontendFolder(id), frontendFiles, cancellationToken);
        if (templateType != TemplateType.Static)
        {
            await SaveFilesAsync(GetBackendFolder(id), backendFiles, cancellationToken);
        }
    }

    private static async Task SaveFilesAsync(string baseFolder, IEnumerable<IFormFile> files, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(baseFolder);

        foreach (var file in files)
        {
            var relativePath = SanitizeRelativePath(file.FileName);
            var fullPath = Path.Combine(baseFolder, relativePath);
            var directory = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrWhiteSpace(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await using var stream = File.Create(fullPath);
            await file.CopyToAsync(stream, cancellationToken);
        }
    }

    private static string SanitizeRelativePath(string rawFileName)
    {
        var normalized = rawFileName.Replace('\\', '/');
        var parts = normalized
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part => part != ".");

        if (parts.Any(part => part == ".."))
        {
            throw new ValidationException("Invalid relative file path.");
        }

        var segments = parts.ToArray();
        if (segments.Length == 0)
        {
            throw new ValidationException("File path is empty.");
        }

        return Path.Combine(segments);
    }
}

