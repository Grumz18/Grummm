#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/platform/backups/postgres}"
OFFSITE_TARGET="${OFFSITE_TARGET:-}"
OFFSITE_RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-30}"

if [ -z "${OFFSITE_TARGET}" ]; then
  echo "[offsite] OFFSITE_TARGET is required (example: backup@host:/srv/backups/platform-postgres)"
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "[offsite] rsync is required"
  exit 1
fi

if [ ! -d "${BACKUP_DIR}" ]; then
  echo "[offsite] backup directory does not exist: ${BACKUP_DIR}"
  exit 1
fi

if ! ls "${BACKUP_DIR}"/*.sql.gz >/dev/null 2>&1; then
  echo "[offsite] no backup files found in ${BACKUP_DIR}"
  exit 1
fi

echo "[offsite] syncing backups from ${BACKUP_DIR} to ${OFFSITE_TARGET}"
rsync -az --delete --include="*.sql.gz" --exclude="*" "${BACKUP_DIR}/" "${OFFSITE_TARGET}/"
echo "[offsite] sync completed"

if [[ "${OFFSITE_TARGET}" == *:* ]]; then
  remote_host="${OFFSITE_TARGET%%:*}"
  remote_path="${OFFSITE_TARGET#*:}"
  echo "[offsite] applying remote retention (${OFFSITE_RETENTION_DAYS} days)"
  ssh "${remote_host}" "find '${remote_path}' -type f -name '*.sql.gz' -mtime +${OFFSITE_RETENTION_DAYS} -delete"
  echo "[offsite] remote retention completed"
fi

echo "[offsite] done"
