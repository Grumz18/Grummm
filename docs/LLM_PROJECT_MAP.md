# LLM Project Map

Last updated: 2026-05-25

Use this with `docs/LLM_SYSTEM_STATE.md` and `docs/current-audit-and-completion-pipeline.md`.

## 1. Top-level layout

```text
.
|- .github/workflows/
|  `- pipeline.yml              GitHub Actions CI/CD
|- docs/                        Current docs, audits, runbooks
|- platform/
|  |- backend/                  ASP.NET Core 9 modular monolith
|  |- frontend/                 React + TypeScript + Vite SPA
|  `- infra/                    Nginx, Postgres image, server scripts
|- scripts/                     Dev/docs utilities
|- docker-compose.yml           Base compose, no secrets
|- docker-compose.deploy.yml    Production overlay, GHCR images
|- docker-compose.dev.yml       Development overlay
|- .env.dev                     Safe dev env values
|- .env.prod.example            Production env template
|- Grummm.sln                   .NET solution
|- package.json                 npm workspace scripts
|- ai-context.md                Current rolling snapshot
|- architecture-lock.md         Architecture constraints
|- module-contract.md           Module contracts
`- llm-rules.md                 Current hard constraints
```

## 2. Backend map

```text
platform/backend/
|- Dockerfile
|- Dockerfile.dev
`- src/
   |- WebAPI/
   |- Core/
   |- Infrastructure/
   `- Modules/
      |- Analytics/
      |- PlatformOps/
      |- ProjectPosts/
      `- TaskTracker/
```

### `src/WebAPI`

| File | Purpose |
|---|---|
| `Program.cs` | startup, middleware, endpoint mapping, module registration |
| `appsettings.json` | base config |
| `appsettings.Development.json` | dev config |
| `appsettings.Production.json` | production config |
| `Middleware/JwtAuthenticationMiddleware.cs` | bearer token validation |
| `Middleware/CsrfProtectionMiddleware.cs` | CSRF protection |
| `Middleware/AdminAuditMiddleware.cs` | admin audit logging |
| `Middleware/CorrelationIdMiddleware.cs` | correlation ID |
| `Middleware/GlobalExceptionMiddleware.cs` | global error handling |
| `Extensions/AuthCookieExtensions.cs` | refresh cookie options |
| `Extensions/ModuleRegistrationExtensions.cs` | module discovery |

### `src/Infrastructure/Security`

| File | Purpose |
|---|---|
| `JwtTokenService.cs` | JWT creation/validation |
| `RefreshTokenService.cs` | refresh token family rotation |
| `PostgresRefreshTokenStore.cs` | persistent refresh token store |
| `InMemoryRefreshTokenStore.cs` | fallback store when no DB connection exists |
| `AdminSecurityService.cs` | credentials, password hashing, email codes |
| `JwtOptions.cs` | JWT settings |

### `src/Modules/ProjectPosts`

| File | Purpose |
|---|---|
| `ProjectPostsModule.cs` | DI registration and request normalization |
| `ProjectPosts.Endpoints.cs` | public/private project, post, content, media, topics, relations, sitemap endpoints |
| `Contracts/ProjectPostDtos.cs` | project/post DTOs |
| `Contracts/LandingContentDtos.cs` | landing content DTOs |
| `Domain/Entities/ProjectPost.cs` | domain entity/enum definitions |
| `Application/Repositories/IProjectPostRepository.cs` | repository contract |
| `Infrastructure/Repositories/PostgresProjectPostRepository.cs` | PostgreSQL implementation and schema migration |
| `Infrastructure/Repositories/InMemoryProjectPostRepository.cs` | in-memory fallback |
| `Infrastructure/Plugins/*` | template/static demo support |
| `Infrastructure/Persistence/Migrations/*` | historical SQL migrations |

Current caveats:

- posts are normalized to public visibility;
- landing content backend exists;
- runtime C#/Python/JS templates are disabled;
- static demo upload/viewer remains supported on `demo.grummm.ru`;
- post block video media is managed, but project-level video still needs production cleanup.

### `src/Modules/Analytics`

| File | Purpose |
|---|---|
| `Analytics.Endpoints.cs` | public tracking and admin analytics endpoints |
| `Infrastructure/Repositories/PostgresAnalyticsRepository.cs` | analytics persistence and queries |
| `Contracts/AnalyticsDtos.cs` | analytics DTOs |

Known caveat: post views currently filter by `template = 0`; this should be updated to `kind = 'post'` semantics.

## 3. Frontend map

```text
platform/frontend/
|- index.html
|- vite.config.ts
|- jest.config.cjs
|- package.json
|- public/
|  |- assets/
|  |- __error_404.html
|  |- robots.txt
|  `- sitemap.xml
`- src/
   |- main.tsx
   |- styles.css
   |- core/
   |- public/
   |- shared/
   `- modules/
```

### `src/core`

| File | Purpose |
|---|---|
| `auth/auth-session.tsx` | auth context, in-memory access token, bootstrap |
| `auth/auth-api.ts` | login/refresh/session/logout API calls |
| `routing/AppRouter.tsx` | route tree and auth bootstrap effect |
| `routing/ProtectedRoute.tsx` | private route guard |
| `layouts/PublicLayout.tsx` | public shell |
| `layouts/PrivateAppLayout.tsx` | private shell |
| `pages/AdminLoginPage.tsx` | admin login |
| `pages/AdminOverviewPage.tsx` | admin dashboard |
| `pages/AdminProjectsWorkspace.tsx` | project/post editor |
| `pages/AdminSecurityPage.tsx` | security/password page |
| `pages/DynamicProjectViewer.tsx` | viewer route for demos |
| `components/AdminTopicsManager.tsx` | topics CRUD |
| `components/AdminRelationsSelector.tsx` | relation/topic picker |
| `components/AdminPostBlocksEditor.tsx` | structured post blocks editor |

Important absence: `AdminLandingContentPage.tsx` is not present in the current tree, although older docs and i18n keys mention a landing editor.

### `src/public`

| File | Purpose |
|---|---|
| `pages/LandingPage.tsx` | public landing |
| `pages/ProjectsPage.tsx` | project catalog |
| `pages/PostsPage.tsx` | post catalog |
| `pages/ProjectDetailPage.tsx` | project/post detail |
| `pages/NotFoundPage.tsx` | 404 page |
| `data/project-store.ts` | API-first project/post store with localStorage fallback |
| `data/landing-content-store.ts` | static-only landing content store today |
| `types.ts` | public frontend types |
| `preferences.tsx` | language/theme preferences |
| `components/ContentCard.tsx` | landing/catalog content card |
| `components/RelatedEntriesSection.tsx` | related cards |
| `components/PostContentRenderer.tsx` | structured post body renderer |
| `components/ProjectScreensGallery.tsx` | screenshots/gallery |
| `components/PostActions.tsx` | like/share UI |

### `src/shared`

| File | Purpose |
|---|---|
| `i18n/en.ts`, `i18n/ru.ts` | translations |
| `seo/useDocumentMetadata.ts` | runtime metadata/structured data |
| `ui/useGsapEnhancements.ts` | GSAP enhancements |

### Static assets

| Path | Purpose |
|---|---|
| `platform/frontend/public/assets/about/profile-main.jpeg` | current about photo |
| `platform/frontend/public/assets/404-*.png` | 404 image |
| `platform/frontend/public/preload.*` | static preload helpers/styles |

## 4. Infra map

```text
platform/infra/
|- nginx/
|  |- Dockerfile
|  |- default.conf
|  |- dev.conf
|  |- docker-entrypoint.sh
|  `- static/
|- postgres/
|  `- Dockerfile
`- server/
   |- bootstrap-platform-stack.sh
   |- phase9-smoke.sh
   |- postgres-backup.sh
   |- postgres-backup-offsite.sh
   |- postgres-restore-drill.sh
   |- readiness-check.sh
   `- collect-platform-state.sh
```

Current nginx image behavior:

1. copy nginx config and entrypoint;
2. copy `platform/infra/nginx/static/`;
3. copy fresh `platform/frontend/dist/` on top;
4. copy fallback static index into `/opt/nginx-fallback/__fallback_index.html`.

Current routing behavior:

- main domain serves public/admin SPA and proxies `/api/*`, `/health`, `/ready`, `/sitemap.xml`;
- detail routes `/posts/:id` and `/projects/:id` are validated through `/api/public/routes/resolve`;
- main-domain viewer routes are blocked;
- `demo.grummm.ru/{slug}/viewer/` proxies static demo files through the backend viewer endpoint and internal Nginx file serving.

## 5. Compose files

| File | Purpose |
|---|---|
| `docker-compose.yml` | base service graph, no secrets |
| `docker-compose.deploy.yml` | GHCR image overlay and production env references |
| `docker-compose.dev.yml` | local dev overlay with Vite and dev DB |

## 6. GitHub Actions

| Job | Purpose | Notes |
|---|---|---|
| `ci` | backend build, npm install, encoding check, frontend build | does not run tests yet |
| `docker` | build/push backend, frontend/nginx, postgres images | push only |
| `deploy-staging` | SSH deploy for `develop` | image/asset checks included |
| `deploy-production` | SSH deploy for `main` | image/asset checks included |
| `smoke-staging` | smoke after staging deploy | currently non-blocking |
| `smoke-production` | smoke after production deploy | currently non-blocking |

## 7. Docs map

| File | Purpose |
|---|---|
| `docs/current-audit-and-completion-pipeline.md` | current audit and completion pipeline |
| `docs/docs-audit.md` | status of docs files |
| `docs/README.md` | docs index |
| `docs/LLM_SYSTEM_STATE.md` | current system guide |
| `docs/LLM_PROJECT_MAP.md` | this file |
| `docs/cicd.md` | current CI/CD guide |
| `docs/*` phase/runbook files | useful but status varies; see `docs/docs-audit.md` |

## 8. High-risk change points

| Area | Risk |
|---|---|
| `ProjectPostsModule.NormalizeVisibility` | controls whether posts can ever be draft/private |
| `project-store.ts` fallback | can expose stale local content |
| `landing-content-store.ts` | currently bypasses backend landing API |
| `PostgresAnalyticsRepository` | analytics semantics may not match `kind` |
| `.github/workflows/pipeline.yml` | deploy safety, smoke blocking, image checks |
| `platform/infra/nginx/default.conf` | route resolution, SPA fallback, headers |
| `ProjectTemplateStorage.cs` | static demo upload, zip/folder extraction, rollback risk |

## 9. Quick commands

```bash
npm run check:encoding
npm run build --workspace @platform/frontend
npm run typecheck --workspace @platform/frontend
npm run test --workspace @platform/frontend
dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
