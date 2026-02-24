using Platform.WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();

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

app.Run();
