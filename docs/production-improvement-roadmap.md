# Production Improvement And Optimization Roadmap

Last updated: 2026-05-25

## Goal

Move the platform to a predictable production state: reliable deploys, correct public content, safe admin operations, managed media, stable static demos, and enough CI/smoke coverage to catch regressions before users see them.

## Current Production Baseline

- Backend: ASP.NET Core 9 modular monolith.
- Frontend: React 18 + TypeScript + Vite.
- Database: PostgreSQL.
- Proxy/static: Nginx image built in CI.
- Deploy: GitHub Actions builds GHCR images and deploys with Docker Compose overlays.
- Auth: JWT access tokens plus PostgreSQL-backed refresh token rotation.
- Content: `ProjectPosts` owns projects, posts, topics, relations, landing content API, media video upload, and static demo viewer.
- Static demos: supported on `demo.grummm.ru/{slug}/viewer/`.
- Runtime backend templates: disabled for production.

## Key Current Limitations

### Landing content

Backend landing content exists, but the public frontend reads static bundle content. There is no admin landing editor route.

### Publish/draft

Posts are always public after backend normalization. A real draft/private model must be implemented before test posts can safely live in production.

### Public fallback

The frontend can fall back to `localStorage` content. This is convenient for local development but unsafe as a production public data source.

### Media

Post block videos use managed media storage through `/api/app/content/media/video`, but project-level videos still use `data:` URLs in `project_posts.video_url`.

### Static demo upload

Static bundles are supported, but upload is not fully transactional: failed uploads can leave metadata and filesystem state out of sync.

### CI/CD

CI does not yet run unit tests/typecheck as required gates, and post-deploy smoke is non-blocking.

## Roadmap

### 1. CI/CD hardening

Work:

- add frontend typecheck to CI;
- add frontend unit tests to CI;
- add backend tests to CI;
- make production basic smoke blocking;
- keep extended smoke optional;
- check for extra frontend containers after deploy.

Checks:

```bash
npm run typecheck --workspace @platform/frontend
npm run test --workspace @platform/frontend
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj
```

Done when: a PR or deploy cannot pass with broken build/test/basic smoke.

### 2. Publish/draft and production data cleanup

Work:

- choose `visibility=private` for posts or add `status=draft/published`;
- update backend filters for list/detail/sitemap/related;
- update frontend visibility helpers;
- add admin publication controls for posts;
- clean existing test records through a controlled DB/admin workflow.

Done when: draft/private posts are invisible on `/`, `/posts`, detail routes, sitemap, and related entries, while still visible in admin.

### 3. Landing content source

Work:

- either connect frontend landing content to `/api/public/content/landing`;
- or document and enforce static-only landing content;
- decide whether to restore `/app/landing`;
- choose static asset or managed media for about photo.

Done when: frontend, backend, admin UI, and docs all describe the same landing content source.

### 4. Public fallback cleanup

Work:

- prevent public production pages from trusting stale `localStorage`;
- separate admin editing cache from public reads;
- show controlled empty/error states when API is unavailable.

Done when: API failure cannot surface local test content to public visitors.

### 5. Analytics semantics

Work:

- update analytics post view query from `template = 0` to `kind = 'post'`;
- apply visibility rules;
- add tests for post/project analytics behavior.

Done when: admin analytics reflects the current content model.

### 6. Unified media service

Work:

- move project videos to managed media endpoints;
- avoid base64 media in JSON/DB for large files;
- add media metadata where needed;
- extend cleanup to post blocks, project video, and future landing media;
- decide and document ClamAV production mode.

Done when: large media is file-backed, streamable, and cleaned safely.

### 7. Static demo upload stabilization

Work:

- prefer zip upload or preserve folder paths reliably;
- upload into a temp folder;
- validate `index.html`;
- atomically swap active frontend folder;
- keep previous version for rollback;
- add deployment status fields before showing public demo CTA.

Done when: failed upload does not break a previously working demo.

### 8. Backend runtime decision

Work:

- keep in-process arbitrary runtime disabled;
- define a future isolated runner contract before enabling backend demos;
- document supported template types exactly.

Recommended future model:

- deployment artifact;
- background build/start worker;
- isolated container per runtime;
- health/log/status/rollback;
- resource and network limits;
- no platform secrets in demo runtime.

Done when: docs and UI do not promise backend runtime support before the runner exists.

### 9. Demo domain and CSP split

Work:

- keep main domain for content/admin;
- keep `demo.grummm.ru` for uploaded demos;
- keep main-domain viewer paths blocked;
- maintain separate CSP risk profile for demo domain.

Done when: uploaded demo code executes only on the demo surface.

### 10. Operations and observability

Work:

- expand `/ready` beyond database if needed;
- expose storage/media/demo health where useful;
- add audit events for media upload and demo upload;
- include restore drills in backup docs.

Done when: a production incident can be diagnosed from health checks, logs, and runbooks without guessing.

## Recommended PR Order

1. CI/CD hardening and blocking smoke.
2. Publish/draft model and production data cleanup.
3. Landing content source cleanup.
4. Public fallback cleanup.
5. Analytics semantics fix.
6. Unified media service.
7. Static demo upload transaction/rollback.
8. Runtime runner design doc before implementation.
9. Operations/readiness/backup refresh.

## Definition Of Good Production State

- Public site never shows local/test/stale content.
- Admin save/upload failures are visible and reversible.
- Media is stored as files with metadata, not base64 in DB.
- Static demos have status and rollback.
- Backend demos are isolated from the main backend before being enabled.
- CI blocks broken code.
- Smoke blocks broken production deploy.
- `/ready` reflects critical dependencies.
- Docs match actual behavior.
