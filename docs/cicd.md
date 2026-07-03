# CI/CD Pipeline

Last updated: 2026-05-25

## Scope

This document describes the current GitHub Actions pipeline and the target improvements needed to make deploy safer.

Workflow file:

- `.github/workflows/pipeline.yml`

## Current triggers

- `push` to `main`
- `push` to `develop`
- `pull_request` to `main`
- `pull_request` to `develop`
- `workflow_dispatch`

Concurrency:

- `platform-cicd-${{ github.ref }}`
- `cancel-in-progress: true`

## Current jobs

| Job | Runs when | Purpose |
|---|---|---|
| `ci` | PR and push | build backend, install npm, encoding check, build frontend |
| `docker` | push only | build/push backend, frontend/nginx, postgres images to GHCR |
| `deploy-staging` | push to `develop` | deploy to staging over SSH |
| `deploy-production` | push to `main` | deploy to production over SSH |
| `smoke-staging` | after staging deploy | smoke checks, non-blocking |
| `smoke-production` | after production deploy | smoke checks, non-blocking |

## Current CI commands

```bash
dotnet build platform/backend/src/WebAPI/WebAPI.csproj --configuration Release
npm ci
npm run check:encoding
npm run build --workspace @platform/frontend
```

Current gap: CI does not run backend tests, frontend tests, or frontend typecheck as independent gates.

## Current image build

Images:

- `ghcr.io/<owner>/platform-backend:<short-sha>`
- `ghcr.io/<owner>/platform-frontend:<short-sha>`
- `ghcr.io/<owner>/platform-postgres:<short-sha>`
- mutable env tags: `staging` or `production`

Frontend/nginx image flow:

1. CI runs `npm run build --workspace @platform/frontend`.
2. Docker builds `platform/infra/nginx/Dockerfile`.
3. Dockerfile copies `platform/infra/nginx/static/`.
4. Dockerfile copies fresh `platform/frontend/dist/` over it.
5. Remote server pulls the final GHCR image.

Production server does not run Node/npm during deploy.

## Compose model

| File | Role |
|---|---|
| `docker-compose.yml` | base service graph, no secrets |
| `docker-compose.deploy.yml` | GHCR image overlay and production env references |
| `docker-compose.dev.yml` | local dev overlay |

Production-style command:

```bash
docker compose -f docker-compose.yml -f docker-compose.deploy.yml up -d
```

Deploy workflow sends `docker-compose.yml` and `docker-compose.deploy.yml` over SSH as base64 temp files. It does not require the remote repo checkout to be updated before compose up.

## Remote deploy behavior

Current SSH script:

- enters `/opt/platform`;
- writes temp compose files;
- checks direct Docker access;
- falls back to `sudo -n docker` only if passwordless sudo works;
- reuses existing compose project name from `platform-backend` label;
- logs into GHCR with GitHub token;
- exports image env vars;
- runs `compose pull`;
- runs `compose up -d --force-recreate --remove-orphans`;
- checks nginx container id;
- checks running nginx image matches expected image;
- checks expected frontend asset hash against live `/`;
- prunes old images with `docker image prune -af --filter "until=168h"`.

This project-name detection is important because older production containers may have been created with compose project `opt` instead of `platform`.

## Required remote permissions

The SSH deploy user must be able to:

```bash
id
docker info >/dev/null
test -r /opt/platform/.env.backend.local
```

Expected production state from previous server inspection:

- user: `grum`
- groups include `docker`
- `.env.backend.local` readable
- Docker accessible without sudo

Do not require interactive sudo in Actions. `appleboy/ssh-action` does not allocate a password prompt by default, and `sudo` without NOPASSWD will fail.

## Current smoke checks

Smoke checks currently hit:

- `/health`
- `/ready`
- `/`
- `/posts`
- `/projects`
- `/login`
- `/api/public/security/csrf`

Known gaps:

- both smoke jobs use `continue-on-error: true`, so they are informative, not blocking;
- current smoke does not verify `demo.grummm.ru/{slug}/viewer/` static demo routing.

## Target CI/CD hardening

Add these commands to `ci`:

```bash
npm run typecheck --workspace @platform/frontend
npm run test --workspace @platform/frontend
dotnet test platform/backend/tests/ProjectPosts.Tests/ProjectPosts.Tests.csproj
```

Then split smoke into:

- blocking smoke: health, ready, public shell routes, CSRF, asset hash;
- optional extended smoke: content fixtures, admin flows, backup, e2e/browser checks.

Recommended blocking production smoke:

```bash
curl -ksS "$BASE_URL/health" | grep -q '"status":"healthy"'
curl -ksS "$BASE_URL/ready" | grep -q '"status":"ready"'
for path in / /posts /projects /login; do
  code=$(curl -ksS -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  test "$code" = "200"
done
csrf=$(curl -ksS -o /dev/null -w "%{http_code}" "$BASE_URL/api/public/security/csrf")
test "$csrf" = "200" -o "$csrf" = "204"
```

Recommended extended demo smoke when a known public static demo exists:

```bash
curl -kI --connect-timeout 5 --max-time 15 "https://demo.grummm.ru/<slug>/viewer/"
curl -kI --connect-timeout 5 --max-time 15 "https://grummm.ru/<slug>/viewer/" | grep -q "404"
```

Recommended server cleanup check:

```bash
docker ps --format '{{.Names}} {{.Image}} {{.Label "com.docker.compose.project"}}'
```

There should not be extra long-running frontend containers outside the compose project, for example old random names created by a previous asset check.

## Known deploy incidents and fixes

### `.env.backend.local: permission denied`

Cause: deploy user could run Docker but Compose tried to read backend env file without sufficient read permission.

Correct fix:

- ensure SSH user can read `/opt/platform/.env.backend.local`;
- avoid interactive sudo in Actions.

### `sudo: a terminal is required`

Cause: workflow attempted sudo without passwordless sudo.

Correct fix:

- use direct Docker group access for deploy user;
- only use `sudo -n docker` if it works non-interactively.

### container name conflict for `platform-backend`

Cause: compose project name changed between old and new deploy commands.

Correct fix:

- detect existing compose project label from `platform-backend`;
- pass `--project-name "$COMPOSE_PROJECT_NAME"`.

### old asset-check frontend container

Cause: old check ran the nginx image without overriding entrypoint.

Correct fix in workflow:

```bash
docker run --rm --entrypoint sh "$NGINX_IMAGE" -lc "grep ..."
```

One-time server cleanup if still present:

```bash
docker rm -f adoring_cannon
```

## Release checklist

Before merging to `main`:

- CI build is green.
- Encoding check is green.
- Tests are green after the target hardening is implemented.
- Branch diff does not modify secrets.
- Deploy script still uses compose overlays.
- Smoke is either blocking or explicitly acknowledged as non-blocking.
- Static demo smoke targets `demo.grummm.ru`, not the main domain.
- Docs are updated when route/deploy/content behavior changes.
