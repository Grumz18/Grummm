# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key context docs
- `README.md` and `README.txt`: current platform capabilities, routes, and stack.
- `docs/LLM_PROJECT_MAP.md`: verified map of backend/frontend/infra structure and key entry points.
- `ai-context.md`: architecture/state snapshot and current phase.
- `architecture-lock.md`: locked architectural constraints.
- `module-contract.md`: backend/frontend module contract rules.
- `llm-rules.md`: hard constraints for routing, layouts, module isolation, and security baselines.
- `docs/README.md`: runbook index and phase docs.

## Common commands
### Frontend (workspace `@platform/frontend`)
- Dev server: `npm run dev --workspace @platform/frontend`
- Build: `npm run build --workspace @platform/frontend`
- Typecheck (acts as lint equivalent): `npm run typecheck --workspace @platform/frontend`
- Unit tests (Jest): `npm run test --workspace @platform/frontend`
- Watch tests: `npm run test:watch --workspace @platform/frontend`
- Run a single test file (Jest args passthrough): `npm run test --workspace @platform/frontend -- AdminProjectsWorkspace.test.tsx`
- E2E (Cypress): `npm run e2e --workspace @platform/frontend`
- Open Cypress UI: `npm run e2e:open --workspace @platform/frontend`

### Backend
- Build WebAPI (CI baseline): `dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release`
- Run a single test project (xUnit): `dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj`

### Infra / ops scripts (server-side)
- Module deploy smoke: `chmod +x platform/infra/server/deploy-module-smoke.sh && ./platform/infra/server/deploy-module-smoke.sh`
- Phase 9 smoke: `chmod +x platform/infra/server/phase9-smoke.sh && BASE_URL=https://grummm.ru ROOT_DIR=/opt APP_DIR=/opt/platform ./platform/infra/server/phase9-smoke.sh`
- Readiness report: `chmod +x platform/infra/server/readiness-check.sh && ROOT_DIR=/opt APP_DIR=/opt/platform ./platform/infra/server/readiness-check.sh`
- Postgres backup: `chmod +x platform/infra/server/postgres-backup.sh && ./platform/infra/server/postgres-backup.sh`

## Architecture overview (big picture)
- **Modular monolith**: ASP.NET Core 9 backend + React/TS/Vite frontend; infra is Docker Compose + Nginx + PostgreSQL.
- **Route zones are locked**: public web (`/`, `/projects`, `/projects/:id`), private web (`/app/*`), public API (`/api/public/*`), private API (`/api/app/*`, `AdminOnly`).
- **Backend module system**: modules implement `IModule`, auto-registered via platform discovery; each module owns its Infrastructure/DbContext; cross-module references are prohibited.
- **Frontend plugin system**: modules live under `platform/frontend/src/modules` and are auto-discovered via `import.meta.glob` on `*.module.ts(x)` entries. Public pages render in `PublicLayout`, private pages in `PrivateAppLayout` guarded by `ProtectedRoute`.
- **Dynamic templates runtime**: admin uploads bundles via `POST /api/app/projects/{id}/upload-with-template`. Nginx serves `/app/{slug}/...` from `/var/projects/{slug}/frontend`, and backend dispatches dynamic routes under `/api/app/{slug}/*` for C# and Python runtimes.
- **Data flow fallback**: frontend store uses API first and falls back to `localStorage` when API/token is unavailable (see `platform/frontend/src/public/data/project-store.ts` in `docs/LLM_PROJECT_MAP.md`).

## Hard constraints to preserve (from `llm-rules.md`, `architecture-lock.md`, `module-contract.md`)
- Keep module isolation; no cross-module business imports. Shared contracts only via SharedKernel/core boundaries.
- Do not move business logic into controllers or layout wrappers.
- Keep DTO boundaries explicit; never expose persistence/domain entities directly in API contracts.
- Preserve security baseline (CSRF/XSS/IDOR/mass-assignment protections, audit logging, correlation-id flow, rate limits).
- Preserve plugin auto-registration on both frontend and backend (no manual module registration).
- Public pages must render in `PublicLayout`; private `/app/*` pages in `PrivateAppLayout` with auth guard.
- Any UX change that affects deploy checks must be reflected in docs smoke steps.
