using System.Reflection;
using Platform.Core.Contracts.Modules;

namespace Platform.WebAPI.Extensions;

public static class ModuleRegistrationExtensions
{
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
}
