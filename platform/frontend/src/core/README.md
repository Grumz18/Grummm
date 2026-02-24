# Frontend Core

Core frontend infrastructure baseline.

- Plugin Registry contract: `src/core/plugin-registry/module-contract.ts`
- Plugin auto-loading: `src/core/plugin-registry/registry.ts` via `import.meta.glob`
- Global routing baseline: `src/core/routing/AppRouter.tsx`
- Private route guard baseline: `src/core/routing/ProtectedRoute.tsx` (`AdminOnly` for `/app/*`)
