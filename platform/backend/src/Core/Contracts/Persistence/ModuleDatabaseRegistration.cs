namespace Platform.Core.Contracts.Persistence;

public sealed record ModuleDatabaseRegistration(
    string ModuleName,
    string Schema,
    string DbContextType);
