namespace Platform.Core.Contracts.Persistence;

public interface IModuleDatabaseRegistry
{
    void Register(ModuleDatabaseRegistration registration);
    bool TryGet(string moduleName, out ModuleDatabaseRegistration? registration);
    IReadOnlyCollection<ModuleDatabaseRegistration> GetAll();
}
