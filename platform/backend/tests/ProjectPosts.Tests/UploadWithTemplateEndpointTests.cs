using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Platform.Modules.ProjectPosts;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;
using Platform.Modules.ProjectPosts.Domain.Entities;
using Platform.WebAPI.Middleware;
using Xunit;

namespace ProjectPosts.Tests;

public sealed class UploadWithTemplateEndpointTests
{
    [Fact]
    public async Task PostUploadWithTemplate_InvalidFiles_Returns400()
    {
        await using var app = await CreateAppAsync();
        await SeedProjectAsync(app.Services, "upload-invalid");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("JavaScript"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("console.log('x');")), "backendFiles", "index.js" }
        };

        var response = await client.PostAsync("/api/app/projects/upload-invalid/upload-with-template", content);
        var problem = await response.Content.ReadFromJsonAsync<ProblemResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    [Fact]
    public async Task PostUploadWithTemplate_ValidFiles_UpdatesEntity()
    {
        await using var app = await CreateAppAsync();
        await SeedProjectAsync(app.Services, "upload-valid");
        var client = app.GetTestClient();

        var content = new MultipartFormDataContent
        {
            { new StringContent("JavaScript"), "templateType" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("{\"name\":\"demo\"}")), "backendFiles", "package.json" },
            { new ByteArrayContent(Encoding.UTF8.GetBytes("<html></html>")), "frontendFiles", "dist/index.html" }
        };

        var response = await client.PostAsync("/api/app/projects/upload-valid/upload-with-template", content);
        var updated = await response.Content.ReadFromJsonAsync<ProjectPostDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(updated);
        Assert.Equal(TemplateType.JavaScript, updated!.Template);
        Assert.Equal("/var/projects/upload-valid/frontend", updated.FrontendPath);
        Assert.Equal("/var/projects/upload-valid/backend", updated.BackendPath);
    }

    private static async Task<WebApplication> CreateAppAsync()
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
}
