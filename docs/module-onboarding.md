# Module Onboarding Guide (Backend + Frontend)

Last Updated: 2026-02-25
Version: 1.0
Status: BASELINE

## 1. Goal

This guide defines the exact baseline flow for adding a new module to the platform without breaking locked architecture rules.

## 2. Naming Rules

- Module name in backend namespace: `PascalCase` (example: `FinanceTracker`).
- Frontend module id: `kebab-case` (example: `finance-tracker`).
- Backend API route segment SHOULD be module-oriented (example: `/api/public/finance-tracker/*`, `/api/app/finance-tracker/*`).
- Cross-module dependencies are prohibited.

## 3. Backend Onboarding Steps

1. Create module folder and project:
`platform/backend/src/Modules/{ModuleName}/`.
2. Add module project file:
`platform/backend/src/Modules/{ModuleName}/{ModuleName}.Module.csproj`.
3. Add module class implementing `IModule` from:
`platform/backend/src/Core/Contracts/Modules/IModule.cs`.
4. Implement `RegisterServices(IServiceCollection)`:
register only services owned by this module.
5. Implement `MapEndpoints(IEndpointRouteBuilder)`:
map routes only under `/api/public/*` and `/api/app/*`.
6. Apply authorization to private routes:
`/api/app/*` endpoints must require `AdminOnly`.
7. Add placeholder DTO/contracts for module endpoints.
Expose DTO only, never domain/entity types.
8. Optional persistence registration:
if module needs DB context, register via
`AddModuleDbContext<TContext>(moduleName, schema, connectionString)`.
9. Ensure module assembly is included in scanning inputs for:
`AddModules(IServiceCollection, params Assembly[])`.
10. Verify no direct references to other module assemblies.

## 4. Frontend Onboarding Steps

1. Create module folder:
`platform/frontend/src/modules/{module-name}/`.
2. Add module entry file with suffix `.module.ts` or `.module.tsx`.
3. Export default object `module` matching `FrontendModuleContract` from:
`platform/frontend/src/core/plugin-registry/module-contract.ts`.
4. Set unique `id` in kebab-case.
5. Declare route ownership in metadata:
use `publicPage`, `privateApp`, `routes`, `permissions`.
6. Respect locked zones:
public routes must not start with `/app`,
private routes must start with `/app`.
7. Do not import other modules directly.
Use only `src/core` and `src/shared` cross-cutting dependencies.
8. Ensure private app routes are inside `/app*` so they are guarded by
`ProtectedRoute` and rendered in `PrivateAppLayout`.
9. Ensure public routes are rendered inside `PublicLayout`.
10. Run local contract checks by loading registry:
`moduleRegistry` from `platform/frontend/src/core/plugin-registry/registry.ts`.

## 5. Definition of Done (Baseline)

1. Module compiles in solution/workspace.
2. Backend module implements `IModule` and maps only allowed API prefixes.
3. Frontend module exports valid metadata and is auto-discovered by `import.meta.glob`.
4. No cross-module dependency introduced.
5. Private routes are under `/app*` and therefore protected by `AdminOnly`.
6. Context files updated:
`dev-state.md`, `ai-context.md`, and if constraints changed `architecture-lock.md`.

## 6. Minimal Skeleton Checklist

1. Backend: module project + `IModule` class + placeholder public/private endpoints.
2. Frontend: `.module.tsx` file with `id`, one placeholder route metadata entry.
3. No business logic beyond scaffold level.
