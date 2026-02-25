using Microsoft.EntityFrameworkCore;
using Platform.Core.Contracts.Audit;
using Platform.Infrastructure.Audit;

namespace Platform.Infrastructure.Extensions;

public static class AuditLoggingExtensions
{
    public static IServiceCollection AddAuditLogging(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Platform");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddSingleton<IAuditLogWriter, NoopAuditLogWriter>();
            return services;
        }

        services.AddDbContextFactory<AuditLogDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure();
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "audit");
            });

            options.EnableDetailedErrors(false);
            options.EnableSensitiveDataLogging(false);
        });

        services.AddSingleton<IAuditLogWriter, EfCoreAuditLogWriter>();
        services.AddHostedService<AuditLogBootstrapHostedService>();

        return services;
    }
}
