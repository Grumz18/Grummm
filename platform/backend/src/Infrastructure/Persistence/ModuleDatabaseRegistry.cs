using Platform.Core.Contracts.Persistence;

namespace Platform.Infrastructure.Persistence;

public sealed class ModuleDatabaseRegistry(IEnumerable<ModuleDatabaseRegistration> registrations) : IModuleDatabaseRegistry
{
    private readonly Dictionary<string, ModuleDatabaseRegistration> _registrations =
        registrations.ToDictionary(r => r.ModuleName, StringComparer.OrdinalIgnoreCase);

    public void Register(ModuleDatabaseRegistration registration)
    {
        if (string.IsNullOrWhiteSpace(registration.ModuleName))
        {
            throw new ArgumentException("ModuleName is required.", nameof(registration));
        }

        if (string.IsNullOrWhiteSpace(registration.Schema))
        {
            throw new ArgumentException("Schema is required.", nameof(registration));
        }

        _registrations[registration.ModuleName] = registration;
    }

    public bool TryGet(string moduleName, out ModuleDatabaseRegistration? registration)
    {
        if (_registrations.TryGetValue(moduleName, out var value))
        {
            registration = value;
            return true;
        }

        registration = null;
        return false;
    }

    public IReadOnlyCollection<ModuleDatabaseRegistration> GetAll()
    {
        return _registrations.Values.ToArray();
    }
}
