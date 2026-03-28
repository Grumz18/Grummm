#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/fullchain.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"

mkdir -p "${CERT_DIR}" /var/www/certbot

if [ ! -f "${CERT_FILE}" ] || [ ! -f "${KEY_FILE}" ]; then
  echo "No TLS certificate found. Generating self-signed certificate..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/CN=localhost"
fi

nginx -t
exec nginx -g "daemon off;"
