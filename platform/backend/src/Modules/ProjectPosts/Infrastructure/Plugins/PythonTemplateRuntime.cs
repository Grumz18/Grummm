using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Platform.Modules.ProjectPosts.Application.Plugins;

namespace Platform.Modules.ProjectPosts.Infrastructure.Plugins;

public sealed class PythonTemplateRuntime(
    IOptions<PythonTemplateRuntimeOptions> optionsAccessor,
    ILogger<PythonTemplateRuntime> logger) : IPythonTemplateRuntime
{
    private readonly ConcurrentDictionary<string, LoadedPythonTemplate> _templates = new(StringComparer.OrdinalIgnoreCase);
    private readonly PythonTemplateRuntimeOptions _options = optionsAccessor.Value;

    public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            logger.LogInformation("Python runtime is disabled by config.");
            return Task.CompletedTask;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new ValidationException("Slug is required for Python template load.");
        }

        if (string.IsNullOrWhiteSpace(backendPath))
        {
            throw new ValidationException("BackendPath is required for Python template load.");
        }

        var backendDirectory = ToAbsoluteDirectory(backendPath);
        if (!Directory.Exists(backendDirectory))
        {
            throw new ValidationException($"Python backend directory not found: {backendDirectory}");
        }

        var requirementsPath = Path.Combine(backendDirectory, "requirements.txt");
        var appModulePath = Path.Combine(backendDirectory, "app.py");
        if (!File.Exists(requirementsPath) || !File.Exists(appModulePath))
        {
            throw new ValidationException("Python template requires requirements.txt and app.py.");
        }

        ValidateRestrictedImports(backendDirectory, _options.RestrictedImports);
        InstallRequirements(requirementsPath, cancellationToken);
        ValidatePythonEntrypoint(appModulePath, cancellationToken);

        _templates[slug] = new LoadedPythonTemplate(slug, backendDirectory);
        logger.LogInformation("Loaded Python template runtime for slug {Slug}", slug);
        return Task.CompletedTask;
    }

    public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
    {
        if (_templates.TryRemove(slug, out var template))
        {
            logger.LogInformation("Unloaded Python template runtime for slug {Slug}", template.Slug);
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
        if (!_templates.TryGetValue(slug, out var template))
        {
            return null;
        }

        var body = await ReadBodyAsync(context.Request, cancellationToken);
        var normalizedPath = NormalizePath(path);
        return await ExecutePythonMainAsync(template.BackendPath, method, normalizedPath, body, cancellationToken);
    }

    private void ValidatePythonEntrypoint(string appModulePath, CancellationToken cancellationToken)
    {
        var script = """
import importlib.util
import pathlib
import sys

app_path = pathlib.Path(sys.argv[1]).resolve()
spec = importlib.util.spec_from_file_location("app", str(app_path))
if spec is None or spec.loader is None:
    raise RuntimeError("Cannot load app module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
if not hasattr(module, "main"):
    raise RuntimeError("Python app.py must export 'main'.")
""";
        var process = StartPythonProcess(script, appModulePath);
        process.WaitForExitAsync(cancellationToken).GetAwaiter().GetResult();
        if (process.ExitCode != 0)
        {
            var error = process.StandardError.ReadToEnd();
            throw new ValidationException(string.IsNullOrWhiteSpace(error)
                ? "Python app.py must export 'main'."
                : $"Invalid Python app module: {error}");
        }
    }

    private async Task<IResult> ExecutePythonMainAsync(
        string backendPath,
        string method,
        string normalizedPath,
        string body,
        CancellationToken cancellationToken)
    {
        var script = """
import importlib.util
import json
import pathlib
import sys

backend = pathlib.Path(sys.argv[1]).resolve()
method = sys.argv[2]
path = sys.argv[3]
body = sys.stdin.read()
app_path = backend / "app.py"

spec = importlib.util.spec_from_file_location("app", str(app_path))
if spec is None or spec.loader is None:
    raise RuntimeError("Cannot load app module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
if not hasattr(module, "main"):
    raise RuntimeError("app.main is missing")

main = getattr(module, "main")
try:
    result = main(method, path, body)
except TypeError:
    result = main()

if result is None:
    payload = {"status": 204, "body": "", "contentType": "text/plain"}
elif isinstance(result, dict):
    payload = {
        "status": int(result.get("status", 200)),
        "body": str(result.get("body", "{}")),
        "contentType": str(result.get("contentType", "application/json"))
    }
else:
    payload = {"status": 200, "body": str(result), "contentType": "text/plain"}

print(json.dumps(payload))
""";

        using var process = StartPythonProcess(script, backendPath, method, normalizedPath);
        await process.StandardInput.WriteAsync(body);
        process.StandardInput.Close();

        var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);

        var output = await outputTask;
        var error = await errorTask;

        if (process.ExitCode != 0)
        {
            logger.LogWarning(
                "Python runtime execution failed for path {Path}. Error: {Error}",
                normalizedPath,
                error);
            return Results.Problem(
                title: "Python template execution error",
                detail: string.IsNullOrWhiteSpace(error) ? "Execution failed." : error,
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var parsed = TryParseDispatchResult(output);
        if (parsed is null)
        {
            return Results.Text(output, "text/plain");
        }

        return Results.Text(parsed.Body ?? string.Empty, parsed.ContentType ?? "application/json", Encoding.UTF8, parsed.Status <= 0 ? 200 : parsed.Status);
    }

    private static PythonDispatchResponse? TryParseDispatchResult(string output)
    {
        try
        {
            return JsonSerializer.Deserialize<PythonDispatchResponse>(output);
        }
        catch
        {
            return null;
        }
    }

    private static async Task<string> ReadBodyAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        if (request.ContentLength is null or <= 0)
        {
            return string.Empty;
        }

        request.EnableBuffering();
        request.Body.Position = 0;
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var content = await reader.ReadToEndAsync();
        request.Body.Position = 0;
        return content;
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

    private void InstallRequirements(string requirementsPath, CancellationToken cancellationToken)
    {
        using var process = StartPythonProcess(
            "-m pip install -r \"" + requirementsPath + "\" --disable-pip-version-check",
            useInlineScript: false);

        process.WaitForExitAsync(cancellationToken).GetAwaiter().GetResult();
        if (process.ExitCode != 0)
        {
            var error = process.StandardError.ReadToEnd();
            throw new ValidationException($"pip install failed: {error}");
        }
    }

    private Process StartPythonProcess(string scriptOrArgs, params string[] args)
    {
        return StartPythonProcess(scriptOrArgs, useInlineScript: true, args);
    }

    private Process StartPythonProcess(string scriptOrArgs, bool useInlineScript, params string[] args)
    {
        var quotedArgs = string.Join(" ", args.Select(QuoteArg));
        var arguments = useInlineScript
            ? $"-c {QuoteArg(scriptOrArgs)} {quotedArgs}".Trim()
            : $"{scriptOrArgs} {quotedArgs}".Trim();

        var startInfo = new ProcessStartInfo
        {
            FileName = _options.PythonExecutable,
            Arguments = arguments,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        return Process.Start(startInfo)
               ?? throw new ValidationException("Failed to start Python process.");
    }

    private static string QuoteArg(string arg)
    {
        return "\"" + arg.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }

    private static void ValidateRestrictedImports(string backendDirectory, IEnumerable<string> restrictedImports)
    {
        var restricted = restrictedImports.Select(s => s.Trim()).Where(s => s.Length > 0).ToArray();
        if (restricted.Length == 0)
        {
            return;
        }

        foreach (var file in Directory.EnumerateFiles(backendDirectory, "*.py", SearchOption.AllDirectories))
        {
            var content = File.ReadAllText(file);
            foreach (var banned in restricted)
            {
                if (content.Contains($"import {banned}", StringComparison.Ordinal)
                    || content.Contains($"from {banned} import", StringComparison.Ordinal))
                {
                    throw new ValidationException($"Python module '{banned}' is restricted in sandbox policy.");
                }
            }
        }
    }

    private static string ToAbsoluteDirectory(string backendPath)
    {
        if (Path.IsPathRooted(backendPath))
        {
            return backendPath;
        }

        return Path.GetFullPath(backendPath);
    }

    private sealed record LoadedPythonTemplate(string Slug, string BackendPath);
    private sealed record PythonDispatchResponse(int Status, string? Body, string? ContentType);
}
