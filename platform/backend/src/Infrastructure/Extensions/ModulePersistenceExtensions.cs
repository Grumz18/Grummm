using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Platform.Core.Contracts.Persistence;
using Platform.Infrastructure.Persistence;

namespace Platform.Infrastructure.Extensions;

public static class ModulePersistenceExtensions
{
    public static IServiceCollection AddModuleDatabaseRegistry(this IServiceCollection services)
    {
        services.TryAddSingleton<IModuleDatabaseRegistry, ModuleDatabaseRegistry>();
        return services;
    }

    public static IServiceCollection AddModuleDbContext<TContext>(
        this IServiceCollection services,
        string moduleName,
        string schema,
        string connectionString)
        where TContext : DbContext
    {
        if (string.IsNullOrWhiteSpace(moduleName))
        {
            throw new ArgumentException("Module name is required.", nameof(moduleName));
        }

        if (string.IsNullOrWhiteSpace(schema))
        {
            throw new ArgumentException("Schema is required.", nameof(schema));
        }

        services.AddModuleDatabaseRegistry();
        services.AddSingleton(new ModuleDatabaseRegistration(moduleName, schema, typeof(TContext).FullName ?? typeof(TContext).Name));

        services.AddDbContext<TContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", schema);
            });
        });

        return services;
    }
}
