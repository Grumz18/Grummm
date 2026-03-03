using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Platform.Modules.ProjectPosts;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Application.Plugins;
using Platform.Modules.ProjectPosts.Application.Security;
using Platform.Modules.ProjectPosts.Contracts;
using Platform.Modules.ProjectPosts.Domain.Entities;
using Platform.WebAPI.Middleware;
using Xunit;

namespace ProjectPosts.Tests;

public sealed class UploadWithTemplateEndpointTests
{
    [Fact]
    public async Task PostUploadWithTemplate_VirusDetected_Returns400()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(false, "EICAR-Test-Signature", "virus.txt")),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedProjectAsync(app.Services, "upload-virus");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("JavaScript"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("{\"name\":\"demo\"}")), "backendFiles", "package.json" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("virus-content")), "backendFiles", "virus.txt" }
        };

        var response = await client.PostAsync("/api/app/projects/upload-virus/upload-with-template", content);
        var problem = await response.Content.ReadFromJsonAsync<ProblemResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    [Fact]
    public async Task PostUploadWithTemplate_ValidPythonFiles_UpdatesEntity()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedProjectAsync(app.Services, "upload-python-valid");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("Python"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("fastapi==0.110.0")), "backendFiles", "requirements.txt" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("print('ok')")), "backendFiles", "app/main.py" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html></html>")), "frontendFiles", "dist/index.html" }
        };

        var response = await client.PostAsync("/api/app/projects/upload-python-valid/upload-with-template", content);
        var updated = await response.Content.ReadFromJsonAsync<ProjectPostDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(updated);
        Assert.Equal(TemplateType.Python, updated!.Template);
        Assert.Equal("/var/projects/upload-python-valid/frontend", updated.FrontendPath);
        Assert.Equal("/var/projects/upload-python-valid/backend", updated.BackendPath);
    }

    [Fact]
    public async Task PostUploadWithTemplate_ValidCSharpPlugin_LoadsAndServesEndpoint()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedProjectAsync(app.Services, "plugin-sample");
        var client = app.GetTestClient();

        var testAssemblyPath = Assembly.GetExecutingAssembly().Location;
        var dllBytes = await File.ReadAllBytesAsync(testAssemblyPath);
        var depsPath = Path.ChangeExtension(testAssemblyPath, ".deps.json");
        var depsBytes = File.Exists(depsPath)
            ? await File.ReadAllBytesAsync(depsPath)
            : Encoding.UTF8.GetBytes("{}");

        var uploadContent = new MultipartFormDataContent
        {
            { new StringContent("CSharp"), "templateType" },
            { new ByteArrayContent(dllBytes), "backendFiles", "plugin-sample.dll" },
            { new ByteArrayContent(depsBytes), "backendFiles", "plugin-sample.deps.json" }
        };

        var uploadResponse = await client.PostAsync("/api/app/projects/plugin-sample/upload-with-template", uploadContent);
        Assert.Equal(HttpStatusCode.OK, uploadResponse.StatusCode);

        var pluginResponse = await client.GetAsync("/api/app/plugin-sample/ping");
        var payload = await pluginResponse.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.OK, pluginResponse.StatusCode);
        Assert.Contains("plugin-pong", payload, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PostUploadWithTemplate_FlaskStylePythonApp_DispatchesEndpoint()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedProjectAsync(app.Services, "python-flask-sample");
        var client = app.GetTestClient();

        var uploadContent = new MultipartFormDataContent
        {
            { new StringContent("Python"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("flask==3.0.0")), "backendFiles", "requirements.txt" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("def main(method,path,body): return {'status':200,'body':'flask-ok'}")), "backendFiles", "app.py" }
        };

        var uploadResponse = await client.PostAsync("/api/app/projects/python-flask-sample/upload-with-template", uploadContent);
        Assert.Equal(HttpStatusCode.OK, uploadResponse.StatusCode);

        var pluginResponse = await client.GetAsync("/api/app/python-flask-sample/ping");
        var payload = await pluginResponse.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.OK, pluginResponse.StatusCode);
        Assert.Contains("python-pong", payload, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<WebApplication> CreateAppAsync(
        IProjectFileMalwareScanner scanner,
        ICSharpTemplatePluginRuntime csharpRuntime,
        IPythonTemplateRuntime pythonRuntime)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddLogging();
        builder.Services.AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole("Admin");
            });
        });

        var module = new ProjectPostsModule();
        module.RegisterServices(builder.Services);
        builder.Services.RemoveAll<IProjectFileMalwareScanner>();
        builder.Services.RemoveAll<ICSharpTemplatePluginRuntime>();
        builder.Services.RemoveAll<IPythonTemplateRuntime>();
        builder.Services.AddSingleton<IProjectFileMalwareScanner>(scanner);
        builder.Services.AddSingleton<ICSharpTemplatePluginRuntime>(csharpRuntime);
        builder.Services.AddSingleton<IPythonTemplateRuntime>(pythonRuntime);

        var app = builder.Build();
        app.UseMiddleware<GlobalExceptionMiddleware>();
        app.UseAuthentication();
        app.UseAuthorization();
        module.MapEndpoints(app);
        await app.StartAsync();

        var client = app.GetTestClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        return app;
    }

    private static async Task SeedProjectAsync(IServiceProvider services, string id)
    {
        using var scope = services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IProjectPostRepository>();

        await repository.UpsertAsync(
            new ProjectPostDto(
                Id: id,
                Title: new LocalizedTextDto("Demo", "Demo RU"),
                Summary: new LocalizedTextDto("Summary", "Summary RU"),
                Description: new LocalizedTextDto("Description", "Description RU"),
                Tags: ["demo"],
                HeroImage: new ThemedAssetDto("light", "dark"),
                Screenshots: [new ThemedAssetDto("s1", "s1")],
                VideoUrl: null,
                Template: TemplateType.None,
                FrontendPath: null,
                BackendPath: null),
            CancellationToken.None);
    }

    private sealed class TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "test-admin"),
                new Claim(ClaimTypes.Name, "test-admin"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    private sealed record ProblemResponse(string Type, string Title, int Status, string TraceId);

    private sealed class FakeScanner(ProjectFileScanResult result) : IProjectFileMalwareScanner
    {
        public Task<ProjectFileScanResult> ScanAsync(IEnumerable<IFormFile> files, CancellationToken cancellationToken)
        {
            return Task.FromResult(result);
        }
    }

    public sealed class SamplePluginPingEndpoint : ICSharpTemplateEndpoint
    {
        public string Method => "GET";
        public string Path => "/ping";

        public Task<IResult> HandleAsync(HttpContext context, CancellationToken cancellationToken)
        {
            return Task.FromResult(Results.Ok(new { message = "plugin-pong" }));
        }
    }

    private sealed class FakeCSharpRuntime : ICSharpTemplatePluginRuntime
    {
        private readonly HashSet<string> _loaded = new(StringComparer.OrdinalIgnoreCase);

        public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
        {
            _loaded.Add(slug);
            return Task.CompletedTask;
        }

        public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
        {
            _loaded.Remove(slug);
            return Task.CompletedTask;
        }

        public Task<IResult?> DispatchAsync(string slug, string path, string method, HttpContext context, CancellationToken cancellationToken)
        {
            if (!_loaded.Contains(slug) || !string.Equals(path, "/ping", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult<IResult?>(null);
            }

            return Task.FromResult<IResult?>(Results.Ok(new { message = "plugin-pong" }));
        }
    }

    private sealed class FakePythonRuntime : IPythonTemplateRuntime
    {
        private readonly HashSet<string> _loaded = new(StringComparer.OrdinalIgnoreCase);

        public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
        {
            _loaded.Add(slug);
            return Task.CompletedTask;
        }

        public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
        {
            _loaded.Remove(slug);
            return Task.CompletedTask;
        }

        public Task<IResult?> DispatchAsync(string slug, string path, string method, HttpContext context, CancellationToken cancellationToken)
        {
            if (!_loaded.Contains(slug) || !string.Equals(path, "/ping", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult<IResult?>(null);
            }

            return Task.FromResult<IResult?>(Results.Ok(new { message = "python-pong" }));
        }
    }
}
