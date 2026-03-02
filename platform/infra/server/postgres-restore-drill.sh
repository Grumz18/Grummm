#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt}"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-/opt/platform/backups/postgres}"
BACKUP_FILE="${BACKUP_FILE:-}"
DRILL_DB="${DRILL_DB:-platform_restore_drill_$(date -u +%Y%m%d%H%M%S)}"
DROP_AFTER_CHECK="${DROP_AFTER_CHECK:-true}"

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "[restore-drill] compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

if [ -z "${BACKUP_FILE}" ]; then
  BACKUP_FILE="$(ls -1t "${BACKUP_DIR}"/platform_*.sql.gz 2>/dev/null | head -n 1 || true)"
fi

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "[restore-drill] backup file not found. Set BACKUP_FILE or place dumps in ${BACKUP_DIR}"
  exit 1
fi

echo "[restore-drill] using backup: ${BACKUP_FILE}"
echo "[restore-drill] creating drill database: ${DRILL_DB}"
docker compose -f "${COMPOSE_FILE}" exec -T postgres sh -lc \
  "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d postgres -c \"CREATE DATABASE \\\"${DRILL_DB}\\\";\""

echo "[restore-drill] restoring backup into ${DRILL_DB}"
gunzip -c "${BACKUP_FILE}" | docker compose -f "${COMPOSE_FILE}" exec -T postgres sh -lc \
  "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"${DRILL_DB}\""

echo "[restore-drill] running sanity checks"
docker compose -f "${COMPOSE_FILE}" exec -T postgres sh -lc \
  "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"${DRILL_DB}\" -x -c \"SELECT count(*) AS audit_table_exists FROM information_schema.tables WHERE table_schema='audit' AND table_name='admin_action_audit_logs';\""

if [ "${DROP_AFTER_CHECK}" = "true" ]; then
  echo "[restore-drill] dropping drill database: ${DRILL_DB}"
  docker compose -f "${COMPOSE_FILE}" exec -T postgres sh -lc \
    "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d postgres -c \"DROP DATABASE \\\"${DRILL_DB}\\\";\""
else
  echo "[restore-drill] keeping drill database: ${DRILL_DB}"
fi

echo "[restore-drill] done"
