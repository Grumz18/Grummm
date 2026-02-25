using System.Reflection;
using Microsoft.Extensions.DependencyModel;
using Platform.Core.Contracts.Modules;

namespace Platform.WebAPI.Extensions;

public static class ModuleRegistrationExtensions
{
    public static IServiceCollection AddPlatformModules(this IServiceCollection services)
    {
        var moduleAssemblies = ResolveModuleAssemblies();
        return services.AddModules(moduleAssemblies.ToArray());
    }

    public static IServiceCollection AddModules(this IServiceCollection services, params Assembly[] assemblies)
    {
        var scanAssemblies = (assemblies is { Length: > 0 } ? assemblies : AppDomain.CurrentDomain.GetAssemblies())
            .Where(a => !a.IsDynamic)
            .Distinct()
            .ToArray();

        var moduleTypes = scanAssemblies
            .SelectMany(GetLoadableTypes)
            .Where(t => t is { IsClass: true, IsAbstract: false } && typeof(IModule).IsAssignableFrom(t))
            .Distinct()
            .ToArray();

        foreach (var moduleType in moduleTypes)
        {
            if (Activator.CreateInstance(moduleType) is not IModule module)
            {
                throw new InvalidOperationException(
                    $"Failed to create module instance for type '{moduleType.FullName}'. " +
                    "Module must have a public parameterless constructor.");
            }

            module.RegisterServices(services);
            services.AddSingleton(typeof(IModule), module);
        }

        return services;
    }

    public static IEndpointRouteBuilder MapModules(this IEndpointRouteBuilder app)
    {
        var modules = app.ServiceProvider.GetServices<IModule>();
        foreach (var module in modules)
        {
            module.MapEndpoints(app);
        }

        return app;
    }

    private static IEnumerable<Type> GetLoadableTypes(Assembly assembly)
    {
        try
        {
            return assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException ex)
        {
            return ex.Types.Where(t => t is not null)!;
        }
    }

    private static IEnumerable<Assembly> ResolveModuleAssemblies()
    {
        var loaded = AppDomain.CurrentDomain.GetAssemblies()
            .Where(a => !a.IsDynamic)
            .ToDictionary(a => a.GetName().Name ?? string.Empty, StringComparer.OrdinalIgnoreCase);

        var moduleNames = DependencyContext.Default?.RuntimeLibraries
            .Select(l => l.Name)
            .Where(IsPlatformModuleAssemblyName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? Array.Empty<string>();

        foreach (var moduleName in moduleNames)
        {
            if (loaded.TryGetValue(moduleName, out var assembly))
            {
                yield return assembly;
                continue;
            }

            Assembly? loadedAssembly = null;
            try
            {
                loadedAssembly = Assembly.Load(new AssemblyName(moduleName));
            }
            catch
            {
                // Module assembly cannot be loaded into current runtime context.
                // Skip it and continue scanning other modules.
            }

            if (loadedAssembly is not null && !loadedAssembly.IsDynamic)
            {
                yield return loadedAssembly;
            }
        }
    }

    private static bool IsPlatformModuleAssemblyName(string? name)
    {
        return !string.IsNullOrWhiteSpace(name)
               && name.StartsWith("Platform.Modules.", StringComparison.OrdinalIgnoreCase);
    }
}
