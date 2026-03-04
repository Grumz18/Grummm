# Grummm Platform Monorepo

## Overview

Grummm is a modular monolith platform for managing and publishing portfolio content.

It has two main zones:
- **Public zone** for visitors:
  - `/`
  - `/projects`
  - `/projects/:id`
- **Private admin zone** for authenticated admins:
  - `/app/*`

The project is designed to keep strict boundaries between public and private routes, APIs, and responsibilities.

## Tech Stack

### Backend
- ASP.NET Core 9 (.NET 9)
- Module-oriented architecture (`IModule`, auto-discovery)
- JWT-based auth
- Audit logging + correlation-id flow
- CSRF protection policy for unsafe cookie-based API requests

### Frontend
- React 18
- TypeScript
- Vite
- Jest + Testing Library
- Cypress (e2e baseline)

### Infrastructure
- Docker Compose
- Nginx (TLS termination, reverse proxy, static serving, security headers, rate limits)
- PostgreSQL

## High-Level Architecture

### 1) Route and API boundaries
- Public web: `/`, `/projects`, `/projects/:id`
- Private web: `/app/*`
- Public API: `/api/public/*`
- Private API: `/api/app/*` (`AdminOnly`)

### 2) Backend model
- Modular monolith with strict module boundaries.
- `WebAPI` hosts middleware pipeline and endpoint groups.
- Modules are auto-registered, not manually hardcoded per module in startup.
- `ProjectPosts` is the main content module for portfolio/project posts.

### 3) Frontend model
- Public and private layouts are separated.
- Plugin-style module registry exists for frontend modules.
- Admin pages manage content through API, with server-first flow for critical mutations.

### 4) Data flow
- Public pages read data from backend public endpoints.
- Admin pages mutate data through private endpoints.
- Landing content is persisted through backend endpoints (not local-only edits).

## Main Features

### Public UI
- Landing page with animated visual section
- Portfolio cards and detail pages
- Language/theme preferences

### Admin UI
- Admin authentication flow
- Project workspace (`/app/projects`) with CRUD and media support
- Posts workspace (`/app/posts`) for post-like content without runtime/template upload flow
- Landing content editor (`/app/content`) with server persistence

### Template/runtime capabilities (ProjectPosts)
- Template metadata for posts (`TemplateType`, paths)
- Upload endpoint:
  - `POST /api/app/projects/{id}/upload-with-template`
- Dynamic routing for uploaded module runtimes under `/api/app/{slug}/*`
- Nginx serving for uploaded frontend bundles under `/app/{slug}/...`

## Key API Endpoints (selected)

### Public
- `GET /api/public/projects`
- `GET /api/public/projects/{id}`
- `GET /api/public/content/landing`
- `POST /api/public/auth/login`

### Private (`AdminOnly`)
- `GET /api/app/projects`
- `POST /api/app/projects`
- `PUT /api/app/projects/{id}`
- `DELETE /api/app/projects/{id}`
- `POST /api/app/projects/{id}/upload-with-template`
- `PUT /api/app/content/landing`
- `POST /api/app/auth/request-email-code`
- `POST /api/app/auth/change-password`

## Repository Structure

- `platform/backend` — backend modules and WebAPI host
- `platform/frontend` — React app (public + admin)
- `platform/infra` — nginx config, postgres image, server scripts
- `docs` — runbooks, onboarding, deployment and verification docs

## Local Development (typical flow)

### Frontend
```bash
npm run dev --workspace @platform/frontend
```

### Frontend checks
```bash
npm run typecheck --workspace @platform/frontend
npm run test --workspace @platform/frontend -- --runInBand
npm run build --workspace @platform/frontend
```

### Docker stack
```bash
docker compose up -d --build
docker compose ps
```

## Deployment Notes

- Containers should run detached (`-d`) and use restart policies in production-like environments.
- Nginx is the only externally exposed service; backend/postgres stay internal in compose networking.
- Keep environment-specific values in env files / deployment configuration; do not hardcode secrets in code or docs.

## Important Project Docs

- `docs/README.md` — docs index
- `docs/LLM_PROJECT_MAP.md` — code map
- `architecture-lock.md` — architecture constraints
- `module-contract.md` — module contracts and boundaries
- `llm-rules.md` — hard implementation rules
