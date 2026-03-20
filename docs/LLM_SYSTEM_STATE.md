# LLM System State Guide

Last updated: 2026-03-19

Purpose: this file is the shortest accurate way to load another LLM into the current state of the `Grummm` platform without re-discovering the repository from scratch.

Use this file first, then use:
- `docs/LLM_PROJECT_MAP.md` for the verified file map
- `ai-context.md` for the rolling snapshot
- `platform/frontend/FRONTEND_ARCHITECTURE.md` for frontend ownership and UI flows
- `architecture-lock.md`, `module-contract.md`, `llm-rules.md` for locked constraints

## 1. What this project is

`Grummm` is a modular monolith with:
- public showcase pages for posts and projects
- a private admin workspace under `/app/*`
- a backend module system in ASP.NET Core 9
- a frontend plugin/module system in React + TypeScript + Vite
- Docker Compose deployment with Nginx + PostgreSQL

The current product direction is:
- separate editorial posts from runtime projects
- keep the public site usable as a portfolio/showcase
- keep admin as the control center for content, projects, security and module runtime
- allow safe public demos only for explicitly allowed static projects

## 2. Current status summary

What is already implemented:
- public routes: `/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`
- private routes: `/app`, `/app/projects`, `/app/posts`, `/app/content`, `/app/security`, `/app/:slug`
- backend route zones: `/api/public/*` and `/api/app/*`
- posts and projects are separate entities end-to-end
- posts support structured content blocks: `paragraph`, `subheading`, `image`
- posts and projects both support `publishedAt`
- projects support `visibility`: `public`, `private`, `demo`
- static projects can expose a sandboxed public demo
- frontend has persistent public/private shells and a single global stylesheet
- SEO surface exists through prerendered pages, semantic fallback HTML, metadata sync and backend sitemap

What is important operationally:
- production frontend is served by Nginx from `platform/frontend/dist`
- production `sitemap.xml` is generated dynamically by backend from current DB content
- deploy breaks if `platform/infra/nginx/default.conf` is saved with BOM
- deploy also breaks if bad SQL text is introduced into `PostgresProjectPostRepository.EnsureSchemaAsync`

## 3. Top-level structure

```text
platform/
|- backend/    ASP.NET Core 9 modular monolith
|- frontend/   React + TS + Vite SPA with prerender/SEO shell
`- infra/      nginx, postgres, server scripts

docs/          runbooks, maps, onboarding docs
ai-context.md  rolling architecture/state snapshot
```

## 4. Route and API boundaries

These boundaries are locked and should not be blurred.

### Public web
- `/`
- `/projects`
- `/projects/:id`
- `/posts`
- `/posts/:id`

Rendered inside `PublicLayout`.

### Private web
- `/app`
- `/app/projects`
- `/app/posts`
- `/app/content`
- `/app/security`
- `/app/:slug`

Rendered inside `PrivateAppLayout` and guarded by `ProtectedRoute`.

### Public API
- `/api/public/*`

Used by public site. Must not expose admin-only data, internal paths or private entities.

### Private API
- `/api/app/*`

Admin-only. Used by admin workspace and runtime project management.

## 5. Backend structure

Main entrypoint:
- `platform/backend/src/WebAPI/Program.cs`

Main responsibilities in `Program.cs`:
- request body limits
- forwarded headers
- global rate limiting
- antiforgery and cookie policy
- JWT auth middleware
- CSRF middleware
- admin audit middleware
- `/health` and `/ready`
- route group split into public/private API
- platform module registration through `AddPlatformModules()`

### Backend modules

Current modules under `platform/backend/src/Modules`:
- `Analytics`
- `PlatformOps`
- `ProjectPosts`
- `TaskTracker`

The main content/business module right now is `ProjectPosts`.

### `ProjectPosts` current domain model

Main entity:
- `ProjectPost`

Current fields:
- `Id`
- `Kind`: `Post | Project`
- `Visibility`: `Public | Private | Demo`
- `Title`
- `Summary`
- `Description`
- `PublishedAt`
- `ContentBlocks`
- `Tags`
- `PublicDemoEnabled`
- `HeroImage`
- `Screenshots`
- `VideoUrl`
- `Template`
- `FrontendPath`
- `BackendPath`

Important meaning:
- `Kind = Post` means editorial content page
- `Kind = Project` means runtime/showcase project
- `Visibility = Public` means visible in public catalogs/detail
- `Visibility = Private` means admin-only
- `Visibility = Demo` means public detail may show demo CTA if the template is safe
- `PublicDemoEnabled` is effectively meaningful only for static projects

### Template/runtime reality

Declared template types:
- `None`
- `Static`
- `CSharp`
- `Python`
- `JavaScript`

Current practical state:
- `Static` is the public-safe path for sandboxed demos
- `CSharp` and `Python` exist as runtime/plugin-style flows for admin/runtime scenarios
- `JavaScript` exists in contracts/UI but is not the strongest or most complete runtime path
- database provisioning is not a generic uploaded-project feature

Do not assume that any uploaded fullstack project with arbitrary backend + DB is automatically supported.

## 6. Frontend structure

Main frontend entry:
- `platform/frontend/src/main.tsx`

Main frontend router:
- `platform/frontend/src/core/routing/AppRouter.tsx`

The frontend is organized into four large areas:
- `src/core` - app shell, auth, layouts, router, admin pages
- `src/public` - public pages, public UI, content store, preferences
- `src/shared` - i18n, SEO helpers, GSAP enhancement hook
- `src/modules` - auto-discovered feature modules, currently including `task-tracker`

### Layout model

Public area:
- `PublicLayout`
- `PublicHeader`
- public pages rendered through nested routes

Private area:
- `PrivateAppLayout`
- protected by `ProtectedRoute`
- admin pages and dynamic viewer live here

The shell model is persistent. Header/sidebar should not remount on every route change.

### Frontend data model

Primary shared public type:
- `PortfolioProject` in `platform/frontend/src/public/types.ts`

Important frontend fields:
- `kind?: "post" | "project"`
- `visibility?: "public" | "private" | "demo"`
- `publishedAt?: string`
- `contentBlocks?: PortfolioContentBlock[]`
- `publicDemoEnabled?: boolean`
- `template?: "None" | "Static" | "CSharp" | "Python" | "JavaScript"`

### Frontend store behavior

Main store:
- `platform/frontend/src/public/data/project-store.ts`

Behavior:
- API-first
- falls back to `localStorage` when needed
- normalizes backend DTOs into frontend shape
- backfills missing `publishedAt`
- uses private API for admin session synchronization
- filters private entries out of public selectors

Important selectors:
- `useShowcasePosts()`
- `useRuntimeProjects()`

### Public UI composition

Key components:
- `PublicHeader.tsx`
- `LandingHeroSection.tsx`
- `HeroMorphTitle.tsx`
- `PortfolioSection.tsx`
- `ProjectCard.tsx`
- `ProjectDetailHeader.tsx`
- `ProjectDetailSummary.tsx`
- `PostContentRenderer.tsx`
- `RelatedEntriesSection.tsx`

Current UX intent:
- public home is a brand/showcase landing page
- cards navigate directly, no double-tap expansion
- posts and projects have separate list pages
- project detail can show a demo CTA when allowed
- post detail shows structured content and related entries

### Admin UI composition

Key admin files:
- `platform/frontend/src/core/pages/AdminProjectsWorkspace.tsx`
- `platform/frontend/src/core/components/AdminPostBlocksEditor.tsx`
- `platform/frontend/src/core/pages/AdminOverviewPage.tsx`
- `platform/frontend/src/core/pages/AdminLandingContentPage.tsx`
- `platform/frontend/src/core/pages/AdminSecurityPage.tsx`

Current admin behavior:
- `/app/projects` is project editor/workspace
- `/app/posts` is post editor/workspace
- posts are block-based and bilingual per block where relevant
- project creation/editing includes visibility selection:
  - `Public`
  - `Private`
  - `Demo`
- `Demo` should only be meaningful for safe static projects
- overview page is where existing content/projects are summarized

## 7. How the system lives at runtime

### Public visitor flow
1. User lands on `/`
2. Nginx serves prerendered/static shell from `platform/frontend/dist`
3. React mounts and loads public content through `/api/public/*`
4. Public analytics events are sent for site visit and detail views
5. User can navigate to posts/projects catalogs and detail pages
6. If a project is demo-safe and enabled, public detail may show demo CTA/viewer

### Admin content flow
1. User signs in through public login route
2. Access token + refresh flow establish admin session
3. Admin navigates under `/app/*`
4. `/app/posts` creates/edits editorial posts with content blocks
5. `/app/projects` creates/edits runtime/showcase projects
6. Admin saves through private API
7. Store resyncs from private API so private content is not lost from the editor view

### Public demo flow
1. Admin creates or edits a project
2. Project visibility is set to `Demo`
3. Static frontend bundle is uploaded
4. Backend marks the item as demo-eligible
5. Public project detail shows demo CTA
6. Viewer is served in a sandboxed flow, not as a generic unrestricted fullstack runtime

## 8. SEO and crawl surface

The project is still a SPA, but it has SEO hardening:
- semantic fallback HTML in `platform/frontend/index.html`
- CSP-safe preloader via external `preload.css` and `preload.js`
- runtime metadata sync with `useDocumentMetadata`
- build-time prerender script: `platform/frontend/scripts/prerender-seo.mjs`
- static fallback `public/sitemap.xml`
- production dynamic `/sitemap.xml` generated by backend from DB content

Important limitation:
- this is still not full SSR
- SEO is improved, but deep route indexing quality still depends on prerender coverage and deployment freshness

## 9. Infra and deploy model

Main file:
- `docker-compose.yml`

Current services:
- `nginx`
- `backend`
- `postgres`

### Nginx responsibilities

Main file:
- `platform/infra/nginx/default.conf`

Responsibilities:
- redirect HTTP -> HTTPS
- expose `80` and `443`
- serve frontend `dist`
- proxy `/api/*` to backend
- proxy `/health`, `/ready`
- proxy `/sitemap.xml` to backend
- serve uploaded static project bundles from `/var/projects/...`
- enforce CSP and response headers

### Important deploy fact

Frontend is mounted into nginx from:
- `./platform/frontend/dist:/usr/share/nginx/html:ro`

That means:
- rebuilding containers alone is not enough if `dist` is stale
- the server must receive the current `platform/frontend/dist`

### Known deploy sharp edges

1. `platform/infra/nginx/default.conf` must be saved as UTF-8 without BOM
   - BOM breaks nginx with `unknown directive "﻿limit_req_zone"`

2. SQL bootstrap in `PostgresProjectPostRepository` must not contain accidental literal backticks/newline fragments
   - otherwise backend can fail at startup with PostgreSQL syntax errors

3. Browser cache can easily hide frontend fixes
   - hard reload is often required after deploy

## 10. Current known limitations

- Full arbitrary uploaded projects with backend + DB are not a generic public runtime feature
- Public demos are intentionally restricted to safe static scenarios
- `JavaScript` template exists in contracts/UI but should be treated carefully as a runtime capability
- LocalStorage fallback means some legacy content can survive in the browser longer than expected
- Some docs and code still contain legacy naming from the earlier “projects only” model
- Backend build cannot be verified in this local environment if `dotnet` is unavailable

## 11. Where to start if you need to change something

### Add or change public route behavior
- `platform/frontend/src/core/routing/AppRouter.tsx`
- `platform/frontend/src/core/layouts/PublicLayout.tsx`
- `platform/frontend/src/public/pages/*`

### Change admin editor logic
- `platform/frontend/src/core/pages/AdminProjectsWorkspace.tsx`
- `platform/frontend/src/core/components/AdminPostBlocksEditor.tsx`

### Change content persistence or normalization
- `platform/frontend/src/public/data/project-store.ts`
- `platform/backend/src/Modules/ProjectPosts/*`

### Change project/post contracts
- `platform/frontend/src/public/types.ts`
- `platform/backend/src/Modules/ProjectPosts/Contracts/ProjectPostDtos.cs`
- `platform/backend/src/Modules/ProjectPosts/Domain/Entities/ProjectPost.cs`

### Change public demo behavior
- `platform/frontend/src/public/pages/ProjectDetailPage.tsx`
- `platform/frontend/src/public/components/ProjectDetailHeader.tsx`
- `platform/backend/src/Modules/ProjectPosts/ProjectPosts.Endpoints.cs`
- `platform/backend/src/Modules/ProjectPosts/ProjectPostsModule.cs`

### Change SEO behavior
- `platform/frontend/index.html`
- `platform/frontend/public/preload.css`
- `platform/frontend/public/preload.js`
- `platform/frontend/scripts/prerender-seo.mjs`
- `platform/frontend/src/shared/seo/useDocumentMetadata.ts`
- `platform/backend/src/Modules/ProjectPosts/ProjectPosts.Endpoints.cs`

### Change infra delivery
- `docker-compose.yml`
- `platform/infra/nginx/default.conf`

## 12. Commands worth knowing

### Frontend
- `npm run build --workspace @platform/frontend`
- `npm run typecheck --workspace @platform/frontend`
- `npm run test --workspace @platform/frontend`

### Backend
- `dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release`
- `dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj`

### Infra
- `docker compose up -d --build`
- `docker compose ps`
- `docker logs platform-nginx --tail 100`
- `docker logs platform-backend --tail 100`

## 13. Short operational truth for another LLM

If you need the most accurate mental model, assume this:

- The repo is a modular monolith, not microservices.
- `ProjectPosts` is currently the core content module.
- Posts and projects are separate entities now.
- Public/private route and API boundaries are strict and should stay strict.
- Admin is the source of truth for content changes.
- Frontend is an SPA with prerender and SEO hardening, not full SSR.
- Public demos are allowed only in a constrained safe path.
- Deployment quality depends on fresh `dist`, correct nginx config encoding, and a clean backend startup.

If a future change conflicts with these assumptions, verify it against:
- `architecture-lock.md`
- `module-contract.md`
- `llm-rules.md`
