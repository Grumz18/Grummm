using Platform.WebAPI.Middleware;
using Platform.Core.Contracts.Auth;
using Platform.Infrastructure.Security;
using Platform.WebAPI.Contracts;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddProblemDetails();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IRefreshTokenStore, InMemoryRefreshTokenStore>();
builder.Services.AddSingleton<IRefreshTokenService, RefreshTokenService>();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<JwtAuthenticationMiddleware>();

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

var publicAuth = app.MapGroup("/api/public/auth");
var privateAuth = app.MapGroup("/api/app/auth");

publicAuth.MapPost("/login", async (LoginRequest request, IRefreshTokenService refreshTokenService) =>
{
    if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { error = "username_and_password_required" });
    }

    var user = new AuthUser(
        UserId: Guid.NewGuid().ToString("N"),
        UserName: request.UserName,
        Role: "Admin");

    var tokens = await refreshTokenService.IssueAsync(user);
    return Results.Ok(tokens);
});

publicAuth.MapPost("/refresh", async (RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    var result = await refreshTokenService.RotateAsync(request.RefreshToken);
    if (!result.Success || result.Tokens is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(result.Tokens);
});

privateAuth.MapPost("/logout", async (HttpContext context, RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }

    var revoked = await refreshTokenService.RevokeAsync(request.RefreshToken);
    return revoked ? Results.NoContent() : Results.NotFound();
});

app.Run();
