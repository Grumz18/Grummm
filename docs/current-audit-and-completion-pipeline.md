# Current Audit And Completion Pipeline

Last updated: 2026-05-25

## Purpose

This document records the current project state after reviewing the repository files. It is the working pipeline for stabilizing and finishing the platform. It should be read before older phase-specific docs.

## Current State Summary

The platform is a modular monolith with ASP.NET Core 9 backend, React/Vite frontend, PostgreSQL, Nginx, Docker Compose overlays, and GitHub Actions publishing GHCR images.

Current important facts:

- production deploy uses GHCR images and `docker compose` with `docker-compose.yml` plus `docker-compose.deploy.yml`;
- the frontend/nginx image is built in CI after `npm run build --workspace @platform/frontend`;
- the remote server does not need Node/npm during deploy;
- public web routes are `/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`, `/login`, `/404`;
- private admin routes live under `/app/*`;
- public static demos are served from `demo.grummm.ru/{slug}/viewer/`;
- main-domain viewer paths are blocked by Nginx;
- backend landing content API and table exist, but the frontend landing store is static-only;
- posts are always normalized to `visibility=public`;
- runtime C#/Python/JavaScript templates are disabled; static demos remain supported;
- frontend public content still has a `localStorage` fallback at key `platform.projects.posts.v3`;
- CI builds backend/frontend and runs encoding checks, but does not yet run unit tests or frontend typecheck as gates;
- deploy smoke jobs are non-blocking because they use `continue-on-error: true`.

## Confirmed Gaps

### P0. Landing content is not connected to the backend

Backend exists:

- `GET /api/public/content/landing`
- `PUT /api/app/content/landing`
- `landing_content` table

Frontend state:

- `platform/frontend/src/public/data/landing-content-store.ts` returns static content;
- `fetchLandingContentFromApi()` does not call the backend;
- `saveLandingContentToServer()` throws `Landing content editing is disabled.`;
- `AdminLandingContentPage.tsx` is absent and `/app/landing` is not routed.

Effect: public landing text and the about photo are tied to the frontend bundle, not to backend-managed content.

### P0. Posts cannot be draft/private

`ProjectPostsModule.NormalizeVisibility()` forces every `kind=post` to public:

```csharp
if (kind == ProjectEntryKind.Post)
{
    return ProjectVisibility.Public;
}
```

Frontend fallback mirrors this assumption through `isPortfolioPubliclyVisible()`.

Effect: a post saved in production is public by contract. A true draft/private post model requires a contract change, not CSS hiding.

### P0. Public frontend can show stale local content

`project-store.ts` writes public/admin content to `localStorage` and falls back to it when API calls fail.

Effect: after API failure or deploy churn, public pages can show stale local/test content.

### P1. CI does not run tests yet

Current CI commands:

```bash
dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release
npm ci
npm run check:encoding
npm run build --workspace @platform/frontend
```

Missing gates:

- `npm run typecheck --workspace @platform/frontend`
- `npm run test --workspace @platform/frontend`
- `dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj`

### P1. Deploy smoke is non-blocking

Both smoke jobs in `.github/workflows/pipeline.yml` use `continue-on-error: true`.

Effect: deploy can appear green even if `/ready`, public route, or CSRF smoke fails.

### P1. Analytics post views use legacy semantics

`PostgresAnalyticsRepository.GetPostViewsAsync()` filters with:

```sql
where p.template = 0
```

Current content model has `kind`, so analytics should use `kind = 'post'` plus visibility rules.

### P1. Runtime templates are disabled but still visible in code/docs

Backend registers disabled runtime services, and `AdminProjectsWorkspace.tsx` sets `RUNTIME_TEMPLATE_OPTIONS_ENABLED = false`.

Effect: C#/Python/JavaScript runtime paths exist as code history, but production support is static demos only.

## Completion Pipeline

### Step 0. Documentation baseline

Status: in progress.

Work:

- update `docs/README.md`;
- update `docs/LLM_SYSTEM_STATE.md`;
- update `docs/LLM_PROJECT_MAP.md`;
- update `docs/cicd.md`;
- update this audit;
- update root context docs where route/deploy constraints drifted.

Checks:

```bash
npm run check:encoding
git diff --check
```

### Step 1. Landing content source

Goal: make landing content source explicit and reliable.

Work:

- either connect `landing-content-store.ts` to `GET /api/public/content/landing`;
- or remove stale admin/editor promises and document static-only landing mode;
- decide whether `/app/landing` should be restored;
- keep about media source explicit: static asset or managed media API.

Checks:

```bash
npm run build --workspace @platform/frontend
curl -ksS https://grummm.ru/api/public/content/landing
```

Done when: docs, frontend, backend, and admin UI all describe the same landing editing model.

### Step 2. Publish/draft model for posts

Goal: test/local posts must not appear publicly unless intentionally published.

Work:

- choose `visibility=private` for posts or add explicit `status=draft/published`;
- remove forced public normalization for posts;
- update backend public list/detail/sitemap/related filters;
- update frontend visibility helpers and local fallback;
- add admin UI for post publication state;
- clean production DB entries through migration/admin action.

Checks:

```bash
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj
npm run test --workspace @platform/frontend -- project-store
```

### Step 3. Public frontend fallback cleanup

Goal: public visitors should not see stale local data on API failure.

Work:

- separate admin/local draft storage from public production reads;
- make public fetch failures render controlled empty/error state or safe build-time seed;
- avoid overwriting server truth from local cache.

Checks:

```bash
npm run test --workspace @platform/frontend
npm run build --workspace @platform/frontend
```

### Step 4. Analytics semantics

Goal: analytics must match the current content model.

Work:

- replace `where p.template = 0` with `p.kind = 'post'`;
- apply visibility rules for public/admin reporting as intended;
- add backend tests around post/project analytics rows.

Checks:

```bash
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj
```

### Step 5. CI/CD hardening

Goal: regressions should be blocked before production.

Work:

- add frontend typecheck and unit tests to CI;
- add backend tests to CI;
- split smoke into blocking basic smoke and optional extended smoke;
- remove `continue-on-error: true` for blocking production smoke;
- keep asset hash check using `docker run --rm --entrypoint sh`.

Checks:

```bash
gh run list --workflow "Platform CI/CD"
```

### Step 6. Media and static demo hardening

Goal: upload paths should be production-grade.

Work:

- move project video away from `data:` URL storage;
- use managed media endpoints for large media;
- make static bundle upload transactional or rollback-capable;
- show deployment/upload status in admin;
- keep runtime backend templates disabled until a separate isolated runner exists.

Checks:

```bash
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj --filter UploadWithTemplate
npm run test --workspace @platform/frontend -- AdminProjectsWorkspace
```

## Recommended PR Order

1. Documentation baseline and encoding cleanup.
2. Landing content source decision.
3. Publish/draft model and data cleanup.
4. Public fallback cleanup.
5. Analytics semantics fix.
6. CI/CD hardening.
7. Media/static demo hardening.
8. Legacy docs archive/refresh pass.

## Do Not

- Do not merge secrets into `docker-compose.yml`.
- Do not move business logic into controllers or layout wrappers.
- Do not revert refresh tokens to memory-only storage.
- Do not enable runtime C#/Python/JavaScript templates without a separate threat model and isolated runner.
- Do not solve public test content by CSS hiding only.
- Do not require interactive sudo in GitHub Actions deploy.
