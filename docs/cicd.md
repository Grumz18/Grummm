# CI/CD Pipeline (Phase 9.1)

## Scope

- Build backend (`platform/backend/src/WebAPI/WebAPI.csproj`)
- Build frontend (`@platform/frontend`)
- Build and push images (nginx, backend, postgres) to GHCR
- Deploy by branch:
  - `develop` -> `staging`
  - `main` -> `production`

## Workflow

- File: `.github/workflows/pipeline.yml`
- Triggers:
  - `push` to `develop`/`main`
  - `pull_request` to `develop`/`main` (CI build only)
  - `workflow_dispatch`

## Environment separation

- GitHub Environments:
  - `staging`
  - `production`
- Deploy path variables (optional, default `/opt/platform`):
  - `STAGING_DEPLOY_PATH`
  - `PRODUCTION_DEPLOY_PATH`
- Image tags:
  - immutable: short commit SHA
  - mutable env tag: `staging` or `production`

## Required secrets

- Registry:
  - `GHCR_USERNAME`
  - `GHCR_TOKEN`
- Staging SSH:
  - `STAGING_SSH_HOST`
  - `STAGING_SSH_USER`
  - `STAGING_SSH_KEY`
- Production SSH:
  - `PRODUCTION_SSH_HOST`
  - `PRODUCTION_SSH_USER`
  - `PRODUCTION_SSH_KEY`

## Deploy compose mode

- Base file: `docker-compose.yml`
- Deploy override: `docker-compose.deploy.yml`
- Required runtime env vars on remote deployment step:
  - `NGINX_IMAGE`
  - `BACKEND_IMAGE`
  - `POSTGRES_IMAGE`

The workflow exports these variables before `docker compose pull` and `docker compose up -d`.
