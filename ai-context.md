# AI CONTEXT - PLATFORM STATE

Last Updated: 2026-03-18
Version: 8.0
Phase: 11.x (posts/projects split, public demo hardening, SEO surface sync, header/detail cleanup)

> The repository is Grummm Platform. Older notes about earlier frontend experiments are not authoritative.

---

## 1. System Overview

Architecture: Modular Monolith
Backend: ASP.NET Core 9 / .NET 9
Frontend: React + TypeScript + Vite 5
Database: PostgreSQL
Proxy: Nginx
Deployment: Docker Compose

Project domain:
- Public showcase (`/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`)
- Private admin workspace (`/app/*`)
- Dynamic template runtime host for interactive project entries

## 2. Locked Route Zones

Public web:
- `/`
- `/projects`
- `/projects/:id`
- `/posts`
- `/posts/:id`

Private web:
- `/app`
- `/app/:module`
- `/app/:module/*`

Public API:
- `/api/public/*`

Private API:
- `/api/app/*` (`AdminOnly`)

## 3. Current Functional State

### 3.1 Public frontend

Implemented:
- landing page, separate project catalog, separate posts catalog, split detail pages
- persistent `PublicLayout`
- compact public header with two minimal circular icon buttons for language and theme switching
- layered landing hero with desktop-only decorative scene and `HeroMorphTitle`
- CSP-safe preloader and semantic fallback shell in `index.html`
- runtime metadata sync through `useDocumentMetadata`
- post detail with structured content blocks, footer date and related entries
- project detail with summary, gallery, optional static public demo and CTA to open demo when enabled

### 3.2 Private admin frontend

Implemented:
- persistent `PrivateAppLayout`
- admin overview, posts editor, projects editor, content page, security page
- posts editor is block-based and stores EN/RU text separately
- projects editor keeps template, upload, screenshot and video controls project-only
- custom template picker replaces native browser select
- admin navigation no longer remounts with route reveal animation

### 3.3 Data flow and content model

Current model:
- `PortfolioProject.kind` splits `post` and `project`
- `PortfolioProject.contentBlocks` stores structured post body blocks
- `PortfolioProject.publishedAt` is now normalized for both posts and projects
- frontend store is API-first and falls back to `localStorage`
- older local entries are backfilled with publication dates on read

Template/runtime flow:
- upload endpoint: `POST /api/app/projects/{id}/upload-with-template`
- Nginx serves uploaded frontend bundles under `/app/{slug}/...`
- dynamic backend dispatch stays under `/api/app/{slug}/*`
- public static demo is exposed only through `/api/public/projects/{id}/viewer/` and only when `publicDemoEnabled` is set

### 3.4 Backend modules

Implemented:
- `TaskTracker`
- `ProjectPosts`
- `Analytics`
- `PlatformOps`

`ProjectPosts` now owns:
- `kind`
- `contentBlocks`
- `publishedAt`
- `publicDemoEnabled`
- repository-backed `/sitemap.xml`

### 3.5 SEO and crawl surface

Implemented:
- `index.html` includes title, description, keywords, canonical and semantic fallback HTML
- `public/preload.css` and `public/preload.js` hide fallback content until SPA mount
- frontend build runs `scripts/prerender-seo.mjs`
- production `/sitemap.xml` is expected to be proxied to backend so DB-backed posts/projects are included without frontend rebuild
- `robots.txt` remains part of frontend deploy surface
- public cards and detail flows render publication metadata for both posts and projects when `publishedAt` is available

### 3.6 Current deployment caveats

Important:
- `platform/infra/nginx/default.conf` must stay UTF-8 without BOM; nginx fails on BOM at the first directive
- backend repository bootstrap SQL must not contain literal backtick escape fragments; they break PostgreSQL startup
- frontend deploy is still tied to the mounted `platform/frontend/dist` directory on the server

## 4. Security and operations baseline

Implemented baseline:
- JWT auth and refresh rotation
- `AdminOnly` protection for private routes and APIs
- CSRF strategy for unsafe requests
- correlation-id propagation
- audit logging baseline
- rate limiting and security headers
- health/readiness and backup runbooks
- template upload validation and malware scanning

## 5. Immediate next steps

1. Verify backend build and startup in a full .NET environment after the latest repository changes.
2. Add or refresh tests around publication dates for project entries and public demo visibility.
3. Clean remaining stale CSS layers around detail and admin screens after visual acceptance.
4. Decide whether project publication date should be editable in admin or remain first-save derived.
5. Consider SSR or deeper prerendering if non-JS indexing of detail pages becomes a stronger requirement.
