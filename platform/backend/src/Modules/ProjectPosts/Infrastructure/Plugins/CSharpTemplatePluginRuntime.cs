using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using McMaster.NETCore.Plugins;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Platform.Modules.ProjectPosts.Application.Plugins;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class CSharpTemplatePluginRuntime(
    ILogger<CSharpTemplatePluginRuntime> logger) : ICSharpTemplatePluginRuntime
{
    private readonly ConcurrentDictionary<string, LoadedPlugin> _plugins = new(StringComparer.OrdinalIgnoreCase);

    public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new ValidationException("Slug is required for C# template plugin load.");
        }

        if (string.IsNullOrWhiteSpace(backendPath))
        {
            throw new ValidationException("BackendPath is required for C# template plugin load.");
        }

        var backendDirectory = ToAbsoluteDirectory(backendPath);
        if (!Directory.Exists(backendDirectory))
        {
            throw new ValidationException($"Backend plugin directory not found: {backendDirectory}");
        }

        var mainAssemblyPath = ResolveMainAssemblyPath(backendDirectory);
        if (string.IsNullOrWhiteSpace(mainAssemblyPath))
        {
            throw new ValidationException("C# template plugin assembly (.dll) was not found.");
        }

        var loader = PluginLoader.CreateFromAssemblyFile(
            mainAssemblyPath,
            isUnloadable: true,
            sharedTypes: [typeof(ICSharpTemplateEndpoint)]);

        var mainAssembly = loader.LoadDefaultAssembly();
        var endpoints = AddEndpointsFromAssembly(mainAssembly);
        if (endpoints.Count == 0)
        {
            loader.Dispose();
            throw new ValidationException("No ICSharpTemplateEndpoint implementations found in plugin assembly.");
        }

        var loadedPlugin = new LoadedPlugin(slug, loader, endpoints);
        if (_plugins.TryGetValue(slug, out var previous))
        {
            _plugins[slug] = loadedPlugin;
            DisposePlugin(previous);
        }
        else
        {
            _plugins.TryAdd(slug, loadedPlugin);
        }

        logger.LogInformation(
            "Loaded C# template plugin for slug {Slug}. Endpoints: {Count}",
            slug,
            endpoints.Count);

        return Task.CompletedTask;
    }

    public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
    {
        if (_plugins.TryRemove(slug, out var plugin))
        {
            DisposePlugin(plugin);
            logger.LogInformation("Unloaded C# template plugin for slug {Slug}", slug);
        }

        return Task.CompletedTask;
    }

    public async Task<IResult?> DispatchAsync(
        string slug,
        string path,
        string method,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        if (!_plugins.TryGetValue(slug, out var plugin))
        {
            return null;
        }

        var normalizedPath = NormalizePath(path);
        var endpoint = plugin.Endpoints.FirstOrDefault(e =>
            string.Equals(e.Method, method, StringComparison.OrdinalIgnoreCase)
            && string.Equals(e.Path, normalizedPath, StringComparison.OrdinalIgnoreCase));

        if (endpoint is null)
        {
            return Results.NotFound();
        }

        return await endpoint.HandleAsync(context, cancellationToken);
    }

    private static List<ICSharpTemplateEndpoint> AddEndpointsFromAssembly(Assembly assembly)
    {
        return assembly
            .GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false } && typeof(ICSharpTemplateEndpoint).IsAssignableFrom(t))
            .Where(t => t.GetConstructor(Type.EmptyTypes) is not null)
            .Select(t => Activator.CreateInstance(t))
            .OfType<ICSharpTemplateEndpoint>()
            .Select(e => new WrappedEndpoint(e.Method, NormalizePath(e.Path), e))
            .Cast<ICSharpTemplateEndpoint>()
            .ToList();
    }

    private static string ResolveMainAssemblyPath(string backendDirectory)
    {
        var deps = Directory.EnumerateFiles(backendDirectory, "*.deps.json", SearchOption.AllDirectories)
            .FirstOrDefault();

        if (deps is not null)
        {
            var depsFileName = Path.GetFileName(deps);
            var baseName = depsFileName.EndsWith(".deps.json", StringComparison.OrdinalIgnoreCase)
                ? depsFileName[..^".deps.json".Length]
                : Path.GetFileNameWithoutExtension(deps);
            var candidate = Path.Combine(Path.GetDirectoryName(deps) ?? backendDirectory, $"{baseName}.dll");
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return Directory.EnumerateFiles(backendDirectory, "*.dll", SearchOption.AllDirectories).FirstOrDefault() ?? string.Empty;
    }

    private static string ToAbsoluteDirectory(string backendPath)
    {
        if (Path.IsPathRooted(backendPath))
        {
            return backendPath;
        }

        return Path.GetFullPath(backendPath);
    }

    private static void DisposePlugin(LoadedPlugin plugin)
    {
        try
        {
            plugin.Loader.Dispose();
            GC.Collect();
            GC.WaitForPendingFinalizers();
        }
        catch
        {
            // no-op
        }
    }

    private static string NormalizePath(string rawPath)
    {
        if (string.IsNullOrWhiteSpace(rawPath) || rawPath == "/")
        {
            return "/";
        }

        var normalized = rawPath.Trim();
        if (!normalized.StartsWith('/'))
        {
            normalized = "/" + normalized;
        }

        return normalized.TrimEnd('/');
    }

    private sealed record LoadedPlugin(string Slug, PluginLoader Loader, IReadOnlyList<ICSharpTemplateEndpoint> Endpoints);

    private sealed class WrappedEndpoint(string method, string path, ICSharpTemplateEndpoint inner) : ICSharpTemplateEndpoint
    {
        public string Method { get; } = method;
        public string Path { get; } = path;

        public Task<IResult> HandleAsync(HttpContext context, CancellationToken cancellationToken)
        {
            return inner.HandleAsync(context, cancellationToken);
        }
    }
}
