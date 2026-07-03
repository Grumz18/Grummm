# LLM System State Guide

Last updated: 2026-05-25

Purpose: load an LLM or developer into the current state of `Grummm` without rediscovering the repository.

Read in this order:

1. `docs/current-audit-and-completion-pipeline.md`
2. this file
3. `docs/LLM_PROJECT_MAP.md`
4. `docs/cicd.md`
5. `llm-rules.md`, `architecture-lock.md`, `module-contract.md`

## 1. What this project is

`Grummm` is a modular monolith platform for public projects/posts, admin content management, static public demos, analytics, and production deployment through Docker Compose.

| Layer | Tech | Location |
|---|---|---|
| Backend | ASP.NET Core 9 / .NET 9, raw Npgsql in modules | `platform/backend/` |
| Frontend | React 18 + TypeScript + Vite | `platform/frontend/` |
| Database | PostgreSQL | Docker Compose |
| Proxy/static | Nginx | `platform/infra/nginx/` |
| Deploy | GHCR images + Compose base/deploy overlay | `.github/workflows/pipeline.yml`, `docker-compose*.yml` |
| Auth | JWT access token + PostgreSQL refresh token rotation | `Infrastructure/Security` |

## 2. Current architecture

```text
Browser
  -> Nginx container
       -> static SPA from /usr/share/nginx/html
       -> /api/*, /health, /ready proxy to backend:8080
       -> demo.grummm.ru/{id}/viewer/* proxies uploaded static demos
  -> Backend container
       -> modules discovered at startup
       -> raw Npgsql repositories
  -> PostgreSQL container
```

The nginx image is built in CI. `platform/infra/nginx/Dockerfile` copies `platform/infra/nginx/static/` first, then copies fresh `platform/frontend/dist/` over it. The remote server does not build the frontend during production deploy.

Uploaded static demos are intentionally split onto `demo.grummm.ru`. Main-domain viewer paths such as `/{slug}/viewer/` and `/api/public/projects/{id}/viewer/*` are blocked by Nginx.

## 3. Route and API boundaries

| Zone | Routes | Guard | Layout |
|---|---|---|---|
| Public web | `/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`, `/login`, `/404` | none | `PublicLayout` |
| Private web | `/app`, `/app/*` | `ProtectedRoute` + AdminOnly | `PrivateAppLayout` |
| Public API | `/api/public/*`, `/health`, `/ready`, `/sitemap.xml` | none | backend |
| Private API | `/api/app/*` | JWT + AdminOnly | backend |

Do not blur these zones. Public pages stay in `PublicLayout`; private pages stay in `PrivateAppLayout`.

## 4. Backend modules

Entrypoint: `platform/backend/src/WebAPI/Program.cs`

| Module | Purpose |
|---|---|
| `ProjectPosts` | projects, posts, topics, relations, landing content, static demo upload/viewer |
| `Analytics` | public visit/post/like endpoints and admin analytics |
| `PlatformOps` | readiness, backup, ops endpoints |
| `TaskTracker` | demo/private module |

### ProjectPosts state

Core table: `project_posts`.

Other tables:

- `topics`
- `project_topics`
- `project_relations`
- `landing_content`

Current important behavior:

- `kind` is `post` or `project`;
- `visibility` is `public`, `private`, or `demo`;
- backend currently forces every `kind=post` upsert to `visibility=public`;
- private visibility is meaningful for projects, but not yet for posts;
- `ProjectPosts:IncludeLocalTestSeeds` controls local test seed insertion and should remain false in production;
- runtime C#/Python/JS templates are disabled;
- static project demos are still supported through `demo.grummm.ru/{id}/viewer/`;
- post block videos use managed content media endpoints, while project-level videos can still be stored as `data:` URLs.

### Landing content state

Backend has:

- `GET /api/public/content/landing`
- `PUT /api/app/content/landing`
- table `landing_content`

Frontend currently does not consume it. `platform/frontend/src/public/data/landing-content-store.ts` returns static content only and throws on server save. Treat landing editor/content sync as unfinished.

### Public visibility state

Public project/post list and detail endpoints filter by `item.Visibility != Private`, but because posts are normalized to public, posts do not currently have a real draft/private state.

## 5. Auth system

| Component | Location |
|---|---|
| JWT generation/validation | `Infrastructure/Security/JwtTokenService.cs` |
| Refresh token service | `Infrastructure/Security/RefreshTokenService.cs` |
| Persistent refresh tokens | `Infrastructure/Security/PostgresRefreshTokenStore.cs` |
| Fallback refresh tokens | `Infrastructure/Security/InMemoryRefreshTokenStore.cs` |
| Cookie handling | `WebAPI/Extensions/AuthCookieExtensions.cs` |

Token flow:

1. Login validates admin credentials and email code.
2. Backend returns access token and sets refresh token in HttpOnly cookie.
3. Frontend stores access token in memory only.
4. On browser reload, frontend calls `/api/public/auth/refresh`.
5. Refresh token is rotated and persisted in PostgreSQL.

Do not revert refresh tokens to memory-only for production.

## 6. Frontend state

Entrypoint: `platform/frontend/src/main.tsx`

Router: `platform/frontend/src/core/routing/AppRouter.tsx`

Main areas:

| Area | Purpose |
|---|---|
| `src/core` | auth, router, layouts, admin pages/components |
| `src/public` | public pages, public data stores, public components |
| `src/shared` | i18n, SEO, shared UI hooks |
| `src/modules` | auto-discovered plugin modules |

Important files:

- `core/routing/AppRouter.tsx` - route tree.
- `core/auth/auth-session.tsx` - auth context and bootstrap.
- `core/pages/AdminProjectsWorkspace.tsx` - project/post editor.
- `public/data/project-store.ts` - API-first store with localStorage fallback.
- `public/data/landing-content-store.ts` - static-only landing content today.
- `public/pages/LandingPage.tsx` - public landing.
- `public/pages/ProjectsPage.tsx`, `PostsPage.tsx`, `ProjectDetailPage.tsx` - catalogs and detail pages.

Known frontend caveat: `project-store.ts` can fall back to localStorage key `platform.projects.posts.v3`. That fallback is useful for local/offline flows, but it can show stale/test content if public API fails. This must be tightened before calling production content fully reliable.

## 7. Environment separation

| File | Purpose | Secrets |
|---|---|---|
| `docker-compose.yml` | base service graph | no |
| `docker-compose.deploy.yml` | production images/env overlay | references `.env.backend.local` |
| `docker-compose.dev.yml` | local dev overlay with Vite/dev DB | safe dev values |
| `.env.dev` | local dev values | safe to commit |
| `.env.prod.example` | production template | no real secrets |
| `.env.backend.local` | production backend secrets | gitignored, server only |

Production deploy relies on SSH user being able to:

- read `/opt/platform/.env.backend.local`;
- run `docker info`;
- use Docker Compose against the existing project name.

## 8. CI/CD state

Workflow: `.github/workflows/pipeline.yml`

Current CI:

- builds backend;
- installs npm dependencies;
- runs encoding/mojibake check;
- builds frontend.

Current CD:

- builds and pushes backend, frontend/nginx, postgres images to GHCR;
- deploys `develop` to staging and `main` to production;
- sends compose files over SSH as base64;
- detects existing compose project name from `platform-backend`;
- checks running nginx image and live asset hash;
- prunes old images with age filter.

Known CI/CD gaps:

- frontend tests are not run in CI;
- backend tests are not run in CI;
- smoke jobs are `continue-on-error: true`;
- production smoke is therefore informative, not blocking.

## 9. Known sharp edges

1. `platform/infra/nginx/default.conf` must stay UTF-8 without BOM.
2. SQL in repository auto-migrations must remain PostgreSQL-compatible.
3. `dotnet watch` is not used in Docker dev because it is unstable on Windows volume watching.
4. Landing content backend exists, but frontend currently uses static-only content.
5. Posts currently cannot be private/draft through backend normalization.
6. Frontend localStorage fallback can show stale content.
7. Runtime C#/Python/JS templates are disabled; static demos are the supported path.
8. Smoke after deploy is not blocking yet.
9. Root `package.json` still uses the historical package name `trash-platform`.
10. A stale one-off nginx test container can remain on production from old asset checks; remove it manually if present.
11. Main-domain demo viewer routes are blocked; public demo smoke should target `https://demo.grummm.ru/{slug}/viewer/`.

## 10. Where to change things

| Task | Files |
|---|---|
| Public route/layout | `core/routing/AppRouter.tsx`, `core/layouts/PublicLayout.tsx`, public pages |
| Admin editor | `core/pages/AdminProjectsWorkspace.tsx`, `core/components/Admin*.tsx` |
| Content model | `ProjectPostDtos.cs`, `ProjectPostsModule.cs`, `project-store.ts`, `types.ts` |
| Publish/draft behavior | `ProjectPostsModule.NormalizeVisibility`, public filters, sitemap, related SQL, frontend visibility helpers |
| Landing content | `landing-content-store.ts`, `LandingPage.tsx`, `ProjectPosts.Endpoints.cs`, `PostgresProjectPostRepository.cs` |
| Topics/relations | `AdminTopicsManager.tsx`, `AdminRelationsSelector.tsx`, `PostgresProjectPostRepository.cs` |
| Analytics | `Analytics.Endpoints.cs`, `PostgresAnalyticsRepository.cs`, frontend post action hooks |
| Static demos/media | `ProjectTemplateStorage.cs`, `ProjectPosts.Endpoints.cs`, `AdminProjectsWorkspace.tsx`, `PostgresProjectPostRepository.cs`, `platform/infra/nginx/default.conf` |
| Deploy | `.github/workflows/pipeline.yml`, `docker-compose*.yml`, `platform/infra/nginx/*` |
| Docs | `docs/current-audit-and-completion-pipeline.md`, this file, `docs/LLM_PROJECT_MAP.md` |

## 11. Common commands

```bash
# Frontend
npm run build --workspace @platform/frontend
npm run typecheck --workspace @platform/frontend
npm run test --workspace @platform/frontend

# Backend
dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj

# Dev Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production-style compose
docker compose -f docker-compose.yml -f docker-compose.deploy.yml up -d

# Docs/basic hygiene
npm run check:encoding
git diff --check
```
