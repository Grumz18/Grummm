# AGENTS.md
 
This file provides guidance to WARP (warp.dev) when working with code in this repository.
 
## Key context docs
- `README.md` and `README.txt`: current platform capabilities and routes.
- `ai-context.md`: architecture/state snapshot.
- `architecture-lock.md`: locked architectural constraints.
- `module-contract.md`: backend/frontend module contract rules.
- `llm-rules.md`: hard constraints for routes, layout split, module isolation, and security baselines.
- `docs/LLM_PROJECT_MAP.md`: map of backend/frontend/infra structure and key files.
 
## Common commands
### Frontend (workspace `@platform/frontend`)
- Dev server: `npm run dev --workspace @platform/frontend`
- Build: `npm run build --workspace @platform/frontend`
- Typecheck: `npm run typecheck --workspace @platform/frontend`
- Unit tests (Jest): `npm run test --workspace @platform/frontend`
- Watch tests: `npm run test:watch --workspace @platform/frontend`
- Run a single test (Jest supports extra args): `npm run test --workspace @platform/frontend -- AdminProjectsWorkspace.test.tsx`
- E2E (Cypress): `npm run e2e --workspace @platform/frontend`
- Open Cypress UI: `npm run e2e:open --workspace @platform/frontend`
 
### Backend
- CI build command: `dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release`
- Backend tests are xUnit projects under `platform/backend/tests` (e.g. `ProjectPosts.Tests.csproj`); run with the standard `dotnet test <path-to-csproj>` when needed.
 
### Infra / ops scripts (server-side)
- Module deploy smoke: `chmod +x platform/infra/server/deploy-module-smoke.sh && ./platform/infra/server/deploy-module-smoke.sh`
- Phase 9 smoke: `chmod +x platform/infra/server/phase9-smoke.sh && BASE_URL=https://grummm.ru ROOT_DIR=/opt APP_DIR=/opt/platform ./platform/infra/server/phase9-smoke.sh`
- Readiness report: `chmod +x platform/infra/server/readiness-check.sh && ROOT_DIR=/opt APP_DIR=/opt/platform ./platform/infra/server/readiness-check.sh`
- Postgres backup: `chmod +x platform/infra/server/postgres-backup.sh && ./platform/infra/server/postgres-backup.sh`
 
## Architecture overview (big picture)
- **Modular monolith**: backend is ASP.NET Core 9 with Clean Architecture and strict module isolation; frontend is React + TS + Vite; infra uses Nginx + Docker Compose + PostgreSQL.
- **Route zones are locked**: public web (`/`, `/projects`, `/projects/:id`), private web (`/app/*`), public API (`/api/public/*`), private API (`/api/app/*` with `AdminOnly`).
- **Backend module system**: modules implement `IModule` and are auto-registered (no manual registration). Each module owns its Infrastructure and persistence; cross‑module references are prohibited.
- **Frontend plugin system**: modules live under `platform/frontend/src/modules`, auto-discovered via `import.meta.glob` with `*.module.ts(x)` entries. Public pages render in `PublicLayout`; private pages render in `PrivateAppLayout` with `ProtectedRoute` guard.
- **ProjectPosts template runtime**: admin uploads template bundles via `POST /api/app/projects/{id}/upload-with-template`. Nginx serves uploaded frontend assets from `/var/projects/{slug}/frontend` under `/app/{slug}/...`. Backend dispatches dynamic routes under `/api/app/{slug}/*` with C# plugin and Python runtime support.
 
## Hard constraints to preserve
- Keep module isolation; no cross-module business imports. Shared contracts only via SharedKernel/core boundaries.
- Do not move business logic into controllers or layout wrappers.
- Keep DTO boundaries explicit; never expose persistence/domain entities directly in API contracts.
- Preserve security baseline (CSRF/XSS/IDOR/mass-assignment protection, audit logging, correlation-id flow, rate limits).
- Preserve plugin auto-registration on both frontend and backend.
- Any UX change that affects deploy checks must be reflected in docs smoke steps.
