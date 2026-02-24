#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)."
  exit 1
fi

echo "=== UFW ==="
ufw status verbose

echo
echo "=== SSH hardening fragment ==="
if [[ -f /etc/ssh/sshd_config.d/99-hardening.conf ]]; then
  cat /etc/ssh/sshd_config.d/99-hardening.conf
else
  echo "Missing: /etc/ssh/sshd_config.d/99-hardening.conf"
fi

echo
echo "=== unattended-upgrades ==="
systemctl is-enabled unattended-upgrades || true
systemctl is-active unattended-upgrades || true

if [[ -f /etc/apt/apt.conf.d/20auto-upgrades ]]; then
  echo
  echo "20auto-upgrades:"
  cat /etc/apt/apt.conf.d/20auto-upgrades
fi
