using Microsoft.AspNetCore.Antiforgery;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Platform.WebAPI.Middleware;
using Platform.Core.Contracts.Auth;
using Platform.Infrastructure.Extensions;
using Platform.Infrastructure.Security;
using Platform.WebAPI.Contracts;
using Platform.WebAPI.Extensions;
using Platform.WebAPI.Validation;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddProblemDetails();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
                QueueLimit = 0
            }));

    options.AddPolicy("auth-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
                QueueLimit = 0
            }));

    options.AddPolicy("auth-refresh", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
                QueueLimit = 0
            }));
});
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "__Host-platform-csrf";
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Strict;
    options.HttpOnly = HttpOnlyPolicy.Always;
    options.Secure = CookieSecurePolicy.Always;
});
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IRefreshTokenStore, InMemoryRefreshTokenStore>();
builder.Services.AddSingleton<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddModuleDatabaseRegistry();
builder.Services.AddPlatformModules();
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
app.UseCookiePolicy();
app.UseRateLimiter();
app.UseMiddleware<JwtAuthenticationMiddleware>();
app.UseMiddleware<CsrfProtectionMiddleware>();
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
var publicSecurity = publicApi.MapGroup("/security");

publicSecurity.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new
    {
        csrfHeaderName = "X-CSRF-TOKEN",
        requestToken = tokens.RequestToken
    });
});

publicAuth.MapPost("/login", async (LoginRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);
    var command = AuthMappings.ToCommand(request);

    var user = new AuthUser(
        UserId: Guid.NewGuid().ToString("N"),
        UserName: command.UserName,
        Role: "Admin");

    var tokens = await refreshTokenService.IssueAsync(user);
    return Results.Ok(tokens);
}).RequireRateLimiting("auth-login");

publicAuth.MapPost("/refresh", async (RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);

    var result = await refreshTokenService.RotateAsync(request.RefreshToken);
    if (!result.Success || result.Tokens is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(result.Tokens);
}).RequireRateLimiting("auth-refresh");

privateAuth.MapPost("/logout", async (HttpContext context, RefreshRequest request, IRefreshTokenService refreshTokenService) =>
{
    RequestValidator.Validate(request);

    var revoked = await refreshTokenService.RevokeAsync(request.RefreshToken);
    return revoked ? Results.NoContent() : Results.NotFound();
});

app.MapModules();

app.Run();
