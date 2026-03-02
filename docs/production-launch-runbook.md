# Production Launch Runbook (Phase 9.5)

## 1. Preconditions

- Latest backend/frontend/infra files are uploaded to `/opt/platform` (FileZilla flow).
- Compose root is `/opt`.
- `postgres`, `backend`, `nginx` services exist in `/opt/docker-compose.yml`.
- TLS certs are already mounted for nginx.

## 2. Launch Sequence

```bash
cd /opt
docker compose build --no-cache backend nginx
docker compose up -d --force-recreate postgres backend nginx
```

Wait for readiness:

```bash
for i in {1..30}; do
  body="$(curl -ks https://grummm.ru/ready || true)"
  echo "$body"
  echo "$body" | grep -q '"status":"ready"' && break
  sleep 2
done
```

## 3. Mandatory Post-Launch Verification

```bash
BASE_URL=https://grummm.ru ROOT_DIR=/opt APP_DIR=/opt/platform ./platform/infra/server/phase9-smoke.sh
```

Expected:

- `Smoke summary: PASS=10 FAIL=0`

If failed, collect state:

```bash
ROOT_DIR=/opt ./platform/infra/server/collect-platform-state.sh
```

## 4. Rollback

If launch fails and must be rolled back:

1. Restore previous uploaded artifacts (manual FileZilla fallback).
2. Rebuild/restart:

```bash
cd /opt
docker compose build --no-cache backend nginx
docker compose up -d --force-recreate postgres backend nginx
```

3. Re-run smoke script and confirm green status.

## 5. Backup Controls

Local backup:

```bash
ROOT_DIR=/opt BACKUP_DIR=/opt/platform/backups/postgres ./platform/infra/server/postgres-backup.sh
```

Restore drill:

```bash
ROOT_DIR=/opt COMPOSE_FILE=/opt/docker-compose.yml BACKUP_DIR=/opt/platform/backups/postgres ./platform/infra/server/postgres-restore-drill.sh
```

Offsite sync (optional until remote target is ready):

```bash
BACKUP_DIR=/opt/platform/backups/postgres OFFSITE_TARGET='backup@<host>:/srv/backups/platform-postgres' ./platform/infra/server/postgres-backup-offsite.sh
```
