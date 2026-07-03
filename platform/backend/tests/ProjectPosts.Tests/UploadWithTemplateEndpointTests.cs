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
using Platform.Core.Contracts.Audit;
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
    public async Task PostVisibility_DraftPublish_MakesPostPubliclyAvailable()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedPostAsync(app.Services, "draft-publish", ProjectVisibility.Draft);
        var client = app.GetTestClient();

        var beforePublish = await client.GetAsync("/api/public/posts/draft-publish");
        Assert.Equal(HttpStatusCode.NotFound, beforePublish.StatusCode);

        var publishResponse = await client.PostAsync("/api/app/posts/draft-publish/publish", content: null);
        var published = await publishResponse.Content.ReadFromJsonAsync<ProjectPostDto>();
        Assert.Equal(HttpStatusCode.OK, publishResponse.StatusCode);
        Assert.NotNull(published);
        Assert.Equal(ProjectVisibility.Public, published!.Visibility);
        Assert.NotNull(published.PublishedAt);

        var afterPublish = await client.GetAsync("/api/public/posts/draft-publish");
        Assert.Equal(HttpStatusCode.OK, afterPublish.StatusCode);
    }

    [Fact]
    public async Task PostVisibility_PublicUnpublish_HidesPostFromPublicApi()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedPostAsync(app.Services, "public-unpublish", ProjectVisibility.Public);
        var client = app.GetTestClient();

        var beforeUnpublish = await client.GetAsync("/api/public/posts/public-unpublish");
        Assert.Equal(HttpStatusCode.OK, beforeUnpublish.StatusCode);

        var unpublishResponse = await client.PostAsync("/api/app/posts/public-unpublish/unpublish", content: null);
        var unpublished = await unpublishResponse.Content.ReadFromJsonAsync<ProjectPostDto>();
        Assert.Equal(HttpStatusCode.OK, unpublishResponse.StatusCode);
        Assert.NotNull(unpublished);
        Assert.Equal(ProjectVisibility.Draft, unpublished!.Visibility);
        Assert.Null(unpublished.PublishedAt);

        var afterUnpublish = await client.GetAsync("/api/public/posts/public-unpublish");
        Assert.Equal(HttpStatusCode.NotFound, afterUnpublish.StatusCode);
    }

    [Fact]
    public async Task PostVisibility_PrivatePost_RequiresAuthenticatedPreview()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime(),
            authToken: null);
        await SeedPostAsync(app.Services, "private-preview", ProjectVisibility.Private);
        var client = app.GetTestClient();

        var anonymousResponse = await client.GetAsync("/api/public/posts/private-preview");
        Assert.Equal(HttpStatusCode.NotFound, anonymousResponse.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        var authenticatedResponse = await client.GetAsync("/api/public/posts/private-preview");
        Assert.Equal(HttpStatusCode.OK, authenticatedResponse.StatusCode);
    }

    [Fact]
    public async Task PostVisibility_Sitemap_ExcludesDraftAndPrivatePosts()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedPostAsync(app.Services, "sitemap-public", ProjectVisibility.Public);
        await SeedPostAsync(app.Services, "sitemap-draft", ProjectVisibility.Draft);
        await SeedPostAsync(app.Services, "sitemap-private", ProjectVisibility.Private);
        var client = app.GetTestClient();

        var response = await client.GetAsync("/sitemap.xml");
        var xml = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("/posts/sitemap-public", xml);
        Assert.DoesNotContain("/posts/sitemap-draft", xml);
        Assert.DoesNotContain("/posts/sitemap-private", xml);
    }

    [Fact]
    public async Task PostVisibility_RelatedEntries_ExcludeDraftAndPrivatePosts()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedPostAsync(app.Services, "related-source", ProjectVisibility.Public);
        await SeedPostAsync(app.Services, "related-public", ProjectVisibility.Public);
        await SeedPostAsync(app.Services, "related-draft", ProjectVisibility.Draft);
        await SeedPostAsync(app.Services, "related-private", ProjectVisibility.Private);

        using (var scope = app.Services.CreateScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<IProjectPostRepository>();
            await repository.SetProjectRelationsAsync(
                "related-source",
                ["related-public", "related-draft", "related-private"],
                CancellationToken.None);
        }

        var client = app.GetTestClient();
        var response = await client.GetAsync("/api/public/projects/related-source/related");
        var payload = await response.Content.ReadFromJsonAsync<RelatedResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Contains(payload!.Items, item => item.Id == "related-public");
        Assert.DoesNotContain(payload.Items, item => item.Id == "related-draft");
        Assert.DoesNotContain(payload.Items, item => item.Id == "related-private");
    }

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
        var csharpRuntime = new FakeCSharpRuntime();
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: csharpRuntime,
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
        Assert.Equal(1, csharpRuntime.LoadCalls);

        var deleteResponse = await client.DeleteAsync("/api/app/projects/plugin-sample");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(1, csharpRuntime.UnloadCalls);
    }

    [Fact]
    public async Task PostUploadWithTemplate_FlaskStylePythonApp_DispatchesEndpoint()
    {
        var pythonRuntime = new FakePythonRuntime();
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: pythonRuntime);
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
        Assert.Equal(1, pythonRuntime.LoadCalls);

        var deleteResponse = await client.DeleteAsync("/api/app/projects/python-flask-sample");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(1, pythonRuntime.UnloadCalls);
    }

    [Fact]
    public async Task PostUploadWithTemplate_JavaScriptTemplate_UpdatesEntityWithoutPluginLoads()
    {
        var csharpRuntime = new FakeCSharpRuntime();
        var pythonRuntime = new FakePythonRuntime();
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: csharpRuntime,
            pythonRuntime: pythonRuntime);
        await SeedProjectAsync(app.Services, "js-sample");
        var client = app.GetTestClient();

        var uploadContent = new MultipartFormDataContent
        {
            { new StringContent("JavaScript"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html><body>ok</body></html>")), "frontendFiles", "index.html" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("{\"name\":\"js-sample\"}")), "backendFiles", "package.json" }
        };

        var uploadResponse = await client.PostAsync("/api/app/projects/js-sample/upload-with-template", uploadContent);
        var updated = await uploadResponse.Content.ReadFromJsonAsync<ProjectPostDto>();

        Assert.Equal(HttpStatusCode.OK, uploadResponse.StatusCode);
        Assert.NotNull(updated);
        Assert.Equal(TemplateType.JavaScript, updated!.Template);
        Assert.Equal("/var/projects/js-sample/frontend", updated.FrontendPath);
        Assert.Equal("/var/projects/js-sample/backend", updated.BackendPath);
        Assert.Equal(0, csharpRuntime.LoadCalls);
        Assert.Equal(0, pythonRuntime.LoadCalls);
    }

    [Fact]
    public async Task PostUploadWithTemplate_StaticTemplate_SavesFrontendOnly()
    {
        var csharpRuntime = new FakeCSharpRuntime();
        var pythonRuntime = new FakePythonRuntime();
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: csharpRuntime,
            pythonRuntime: pythonRuntime);
        await SeedProjectAsync(app.Services, "static-sample");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("Static"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html><body>OK</body></html>")), "frontendFiles", "index.html" }
        };

        var response = await client.PostAsync("/api/app/projects/static-sample/upload-with-template", content);
        var updated = await response.Content.ReadFromJsonAsync<ProjectPostDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(updated);
        Assert.Equal(TemplateType.Static, updated!.Template);
        Assert.Equal("/var/projects/static-sample/frontend", updated.FrontendPath);
        Assert.Null(updated.BackendPath);
        Assert.Equal(0, csharpRuntime.LoadCalls);
        Assert.Equal(0, pythonRuntime.LoadCalls);
    }

    [Fact]
    public async Task PostUploadWithTemplate_StaticTemplate_WithBackendFiles_Returns400()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime());
        await SeedProjectAsync(app.Services, "static-invalid");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("Static"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html><body>OK</body></html>")), "frontendFiles", "index.html" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("not-needed")), "backendFiles", "ignored.txt" }
        };

        var response = await client.PostAsync("/api/app/projects/static-invalid/upload-with-template", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostUploadWithTemplate_WithoutAuth_Returns401()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime(),
            authToken: null);
        await SeedProjectAsync(app.Services, "auth-check");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("Static"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html></html>")), "frontendFiles", "index.html" }
        };

        var response = await client.PostAsync("/api/app/projects/auth-check/upload-with-template", content);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostUploadWithTemplate_NonAdmin_Returns403()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime(),
            authToken: "user-token");
        await SeedProjectAsync(app.Services, "auth-check-user");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("Static"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html></html>")), "frontendFiles", "index.html" }
        };

        var response = await client.PostAsync("/api/app/projects/auth-check-user/upload-with-template", content);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DynamicPluginDispatch_NonAdmin_Returns403()
    {
        await using var app = await CreateAppAsync(
            scanner: new FakeScanner(new ProjectFileScanResult(true)),
            csharpRuntime: new FakeCSharpRuntime(),
            pythonRuntime: new FakePythonRuntime(),
            authToken: "user-token");
        var client = app.GetTestClient();

        var response = await client.GetAsync("/api/app/any-slug/ping");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static async Task<WebApplication> CreateAppAsync(
        IProjectFileMalwareScanner scanner,
        ICSharpTemplatePluginRuntime csharpRuntime,
        IPythonTemplateRuntime pythonRuntime,
        string? authToken = "test-token")
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
        builder.Services.RemoveAll<IAuditLogWriter>();
        builder.Services.AddSingleton<IProjectFileMalwareScanner>(scanner);
        builder.Services.AddSingleton<ICSharpTemplatePluginRuntime>(csharpRuntime);
        builder.Services.AddSingleton<IPythonTemplateRuntime>(pythonRuntime);
        builder.Services.AddSingleton<IAuditLogWriter, FakeAuditLogWriter>();

        var app = builder.Build();
        app.UseMiddleware<GlobalExceptionMiddleware>();
        app.UseAuthentication();
        app.UseAuthorization();
        module.MapEndpoints(app);
        await app.StartAsync();

        var client = app.GetTestClient();
        if (!string.IsNullOrWhiteSpace(authToken))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);
        }
        return app;
    }

    private static async Task SeedProjectAsync(IServiceProvider services, string id)
    {
        await SeedEntryAsync(services, id, ProjectEntryKind.Project, ProjectVisibility.Public);
    }

    private static async Task SeedPostAsync(IServiceProvider services, string id, ProjectVisibility visibility)
    {
        await SeedEntryAsync(services, id, ProjectEntryKind.Post, visibility);
    }

    private static async Task SeedEntryAsync(
        IServiceProvider services,
        string id,
        ProjectEntryKind kind,
        ProjectVisibility visibility)
    {
        using var scope = services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IProjectPostRepository>();
        var publishedAt = visibility == ProjectVisibility.Public ? DateTimeOffset.UtcNow : (DateTimeOffset?)null;

        await repository.UpsertAsync(
            new ProjectPostDto(
                Id: id,
                Kind: kind,
                Visibility: visibility,
                Title: new LocalizedTextDto("Demo", "Demo RU"),
                Summary: new LocalizedTextDto("Summary", "Summary RU"),
                Description: new LocalizedTextDto("Description", "Description RU"),
                PublishedAt: publishedAt,
                ContentBlocks: [],
                Tags: ["demo"],
                PublicDemoEnabled: false,
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
            var authorization = Request.Headers.Authorization.ToString();
            if (string.IsNullOrWhiteSpace(authorization)
                || !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(AuthenticateResult.Fail("Missing bearer token."));
            }

            var token = authorization["Bearer ".Length..].Trim();
            var role = string.Equals(token, "user-token", StringComparison.Ordinal)
                ? "User"
                : "Admin";

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "test-admin"),
                new Claim(ClaimTypes.Name, "test-admin"),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    private sealed record ProblemResponse(string Type, string Title, int Status, string TraceId);
    private sealed record RelatedResponse(RelatedProjectDto[] Items);

    private sealed class FakeAuditLogWriter : IAuditLogWriter
    {
        public Task WriteAdminActionAsync(AdminActionAuditRecord record, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

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
        public int LoadCalls { get; private set; }
        public int UnloadCalls { get; private set; }

        public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
        {
            LoadCalls++;
            _loaded.Add(slug);
            return Task.CompletedTask;
        }

        public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
        {
            UnloadCalls++;
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
        public int LoadCalls { get; private set; }
        public int UnloadCalls { get; private set; }

        public Task LoadForSlugAsync(string slug, string? backendPath, CancellationToken cancellationToken)
        {
            LoadCalls++;
            _loaded.Add(slug);
            return Task.CompletedTask;
        }

        public Task UnloadForSlugAsync(string slug, CancellationToken cancellationToken)
        {
            UnloadCalls++;
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
