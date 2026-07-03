# AI Context - Platform State

Last updated: 2026-05-25
Version: 10.0
Phase: production stabilization after GHCR/Compose deploy fixes

This repository is the Grummm Platform. Older phase notes are useful history, but this file reflects the current reviewed code state.

## 1. System Overview

Architecture: modular monolith.

Stack:

- Backend: ASP.NET Core 9 / .NET 9.
- Frontend: React 18 + TypeScript + Vite.
- Database: PostgreSQL.
- Proxy/static: Nginx.
- Deployment: Docker Compose base + environment overlay.
- CI/CD: GitHub Actions builds GHCR images and deploys by SSH.
- Auth: JWT access tokens plus PostgreSQL-backed refresh token rotation.

Core domain:

- public landing, projects, posts, detail pages;
- private admin workspace under `/app/*`;
- static public demos under `demo.grummm.ru/{slug}/viewer/`;
- topics, relations, and server-computed related entries;
- analytics for visits, post views, and likes.

## 2. Locked Route Zones

Public web:

- `/`
- `/projects`
- `/projects/:id`
- `/posts`
- `/posts/:id`
- `/login`
- `/404`

Private web:

- `/app`
- `/app/*`

Public API:

- `/api/public/*`
- `/health`
- `/ready`
- `/sitemap.xml`

Private API:

- `/api/app/*` protected by `AdminOnly`.

## 3. Current Frontend State

Implemented:

- `PublicLayout` for public routes;
- `PrivateAppLayout` for `/app/*`;
- `ProtectedRoute` with admin guard;
- public landing, project catalog, post catalog, detail page, 404 page;
- admin overview, projects editor, posts editor, security page;
- module auto-discovery via `import.meta.glob("../../modules/**/*.module.{ts,tsx}")`;
- public related entries through `/api/public/projects/{id}/related`;
- public analytics tracking in `AppRouter`;
- `project-store.ts` API-first store with localStorage fallback.

Important current gaps:

- `landing-content-store.ts` is static-only and does not call the backend landing API;
- no `AdminLandingContentPage.tsx` and no `/app/landing` route;
- public frontend can fall back to stale `localStorage` content;
- runtime template options are disabled in UI with `RUNTIME_TEMPLATE_OPTIONS_ENABLED = false`;
- project-level video can still be stored as a `data:` URL.

## 4. Current Backend State

Modules:

- `ProjectPosts`;
- `Analytics`;
- `PlatformOps`;
- `TaskTracker`.

`ProjectPosts` owns:

- `project_posts`;
- `topics`;
- `project_topics`;
- `project_relations`;
- `landing_content`;
- public list/detail/related/sitemap endpoints;
- private content CRUD;
- topics and relations endpoints;
- content video upload endpoint;
- static demo upload/viewer support.

Important behavior:

- `kind` is `post` or `project`;
- `visibility` is `public`, `private`, or `demo`;
- backend forces every `kind=post` upsert to `visibility=public`;
- private visibility currently matters for projects, not posts;
- C#/Python/JavaScript runtime templates are disabled;
- static demos are supported.

## 5. Auth And Security

Implemented:

- JWT access tokens;
- refresh token family rotation;
- PostgreSQL refresh token store;
- fallback in-memory refresh store only when no connection string exists;
- environment-aware refresh and CSRF cookies;
- JWT auth middleware;
- CSRF middleware;
- admin audit logging middleware;
- correlation-id middleware;
- global exception middleware;
- rate limiting for global and auth-specific flows.

Do not revert refresh tokens to memory-only for production.

## 6. Deploy State

Current deploy model:

- `.github/workflows/pipeline.yml` builds backend, frontend/nginx, and postgres images;
- images are pushed to GHCR with short SHA and environment tags;
- `develop` deploys to staging;
- `main` deploys to production;
- compose files are sent over SSH as base64 temp files;
- deploy reuses the existing compose project name from the `platform-backend` container label;
- deploy verifies the running nginx image and live frontend asset hash.

Nginx image:

- copies `platform/infra/nginx/static/`;
- copies fresh `platform/frontend/dist/` on top;
- serves the SPA from `/usr/share/nginx/html`;
- proxies `/api/*`, `/health`, `/ready`, `/sitemap.xml`;
- blocks main-domain viewer paths;
- routes `demo.grummm.ru/{slug}/viewer/` to uploaded static demos.

Known CI/CD gaps:

- frontend typecheck is not a separate CI gate;
- frontend tests are not run in CI;
- backend tests are not run in CI;
- smoke jobs are non-blocking.

## 7. High-Risk Areas

- `ProjectPostsModule.NormalizeVisibility`: controls post publish/draft behavior.
- `project-store.ts`: public fallback can expose stale local content.
- `landing-content-store.ts`: bypasses backend landing content.
- `PostgresAnalyticsRepository`: post view query still uses `template = 0`.
- `ProjectTemplateStorage.cs`: static demo upload is not fully transactional.
- `.github/workflows/pipeline.yml`: deploy safety and smoke behavior.
- `platform/infra/nginx/default.conf`: route validation, demo domain, CSP, SPA fallback.

## 8. Current Work Pipeline

Use `docs/current-audit-and-completion-pipeline.md` as the active plan.

Recommended next PRs:

1. Documentation and encoding cleanup.
2. Landing content source decision.
3. Publish/draft model for posts.
4. Public localStorage fallback cleanup.
5. Analytics semantics fix.
6. CI/CD hardening.
7. Media/static demo hardening.
