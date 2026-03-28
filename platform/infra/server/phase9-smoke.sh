#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://grummm.ru}"
ROOT_DIR="${ROOT_DIR:-/opt}"
APP_DIR="${APP_DIR:-/opt/platform}"
WINDOW_MINUTES="${WINDOW_MINUTES:-30}"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

PASS=0
FAIL=0

ok() {
  PASS=$((PASS + 1))
  echo "[OK] $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "[FAIL] $1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

require_cmd curl
require_cmd docker

echo "Running smoke check against ${BASE_URL}"

HEALTH_BODY="${WORK_DIR}/health.json"
READY_BODY="${WORK_DIR}/ready.json"
HEADERS_FILE="${WORK_DIR}/headers.txt"

# /health
curl -ksS -o "${HEALTH_BODY}" "${BASE_URL}/health" || true
if grep -q '"status":"healthy"' "${HEALTH_BODY}"; then
  ok "/health returns healthy"
else
  fail "/health did not return healthy"
fi

# /ready
curl -ksS -o "${READY_BODY}" "${BASE_URL}/ready" || true
if grep -q '"status":"ready"' "${READY_BODY}"; then
  ok "/ready returns ready"
else
  fail "/ready did not return ready"
fi

# correlation-id propagation
REQUEST_CORR_ID="smoke-corr-$(date +%s)"
curl -ksSI -H "X-Correlation-ID: ${REQUEST_CORR_ID}" "${BASE_URL}/health" > "${HEADERS_FILE}" || true
if grep -iq "^x-correlation-id: ${REQUEST_CORR_ID}" "${HEADERS_FILE}"; then
  ok "correlation-id is echoed in response headers"
else
  fail "correlation-id was not propagated"
fi

# Public pages
HOME_STATUS="$(curl -ksS -o /dev/null -w "%{http_code}" "${BASE_URL}/" || true)"
if [ "${HOME_STATUS}" = "200" ]; then
  ok "homepage returns 200"
else
  fail "homepage returned ${HOME_STATUS}"
fi

POSTS_STATUS="$(curl -ksS -o /dev/null -w "%{http_code}" "${BASE_URL}/posts" || true)"
if [ "${POSTS_STATUS}" = "200" ]; then
  ok "/posts returns 200"
else
  fail "/posts returned ${POSTS_STATUS}"
fi

PROJECTS_STATUS="$(curl -ksS -o /dev/null -w "%{http_code}" "${BASE_URL}/projects" || true)"
if [ "${PROJECTS_STATUS}" = "200" ]; then
  ok "/projects returns 200"
else
  fail "/projects returned ${PROJECTS_STATUS}"
fi

LOGIN_STATUS="$(curl -ksS -o /dev/null -w "%{http_code}" "${BASE_URL}/login" || true)"
if [ "${LOGIN_STATUS}" = "200" ]; then
  ok "/login page returns 200"
else
  fail "/login page returned ${LOGIN_STATUS}"
fi

# CSRF endpoint
CSRF_STATUS="$(curl -ksS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/public/security/csrf" || true)"
if [ "${CSRF_STATUS}" = "200" ] || [ "${CSRF_STATUS}" = "204" ]; then
  ok "CSRF endpoint reachable"
else
  fail "CSRF endpoint returned ${CSRF_STATUS}"
fi

# Postgres backup artifacts
if ls "${APP_DIR}/backups/postgres/"*.sql.gz >/dev/null 2>&1; then
  ok "postgres backup artifacts exist"
else
  fail "postgres backup artifacts missing in ${APP_DIR}/backups/postgres"
fi

echo "Smoke summary: PASS=${PASS} FAIL=${FAIL}"
if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
