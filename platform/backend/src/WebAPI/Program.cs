using Platform.WebAPI.Middleware;
using Platform.Core.Contracts.Auth;
using Platform.Infrastructure.Extensions;
using Platform.Infrastructure.Security;
using Platform.Modules.TaskTracker;
using Platform.WebAPI.Contracts;
using Platform.WebAPI.Extensions;
using Platform.WebAPI.Validation;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddProblemDetails();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IRefreshTokenStore, InMemoryRefreshTokenStore>();
builder.Services.AddSingleton<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddModuleDatabaseRegistry();
builder.Services.AddModules(typeof(Program).Assembly, typeof(TaskTrackerModule).Assembly);
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("Admin");
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<JwtAuthenticationMiddleware>();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/", (HttpContext context) =>
{
    return Results.Ok(new
    {
        service = "Platform.WebAPI",
        message = "Backend core skeleton is running",
        correlationId = context.TraceIdentifier
    });
});

var publicApi = app.MapGroup("/api/public");
var privateApi = app.MapGroup("/api/app").RequireAuthorization("AdminOnly");

var publicAuth = publicApi.MapGroup("/auth");
var privateAuth = privateApi.MapGroup("/auth");

publicAuth.MapPost("/login", async (LoginRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);

    var user = new AuthUser(
        UserId: Guid.NewGuid().ToString("N"),
        UserName: request.UserName,
        Role: "Admin");

    var tokens = await refreshTokenService.IssueAsync(user);
    return Results.Ok(tokens);
});

publicAuth.MapPost("/refresh", async (RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);

    var result = await refreshTokenService.RotateAsync(request.RefreshToken);
    if (!result.Success || result.Tokens is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(result.Tokens);
});

privateAuth.MapPost("/logout", async (HttpContext context, RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);

    var revoked = await refreshTokenService.RevokeAsync(request.RefreshToken);
    return revoked ? Results.NoContent() : Results.NotFound();
});

app.MapModules();

app.Run();
