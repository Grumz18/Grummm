#!/usr/bin/env bash
set -euo pipefail

# Phase 2.1 Ubuntu baseline hardening:
# - UFW: only 80/443 by default
# - SSH: key-only auth
# - Disable password auth
# - Enable unattended-upgrades

ALLOW_SSH="false"
if [[ "${1:-}" == "--allow-ssh" ]]; then
  ALLOW_SSH="true"
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Installing required packages..."
apt-get update -y
apt-get install -y ufw openssh-server unattended-upgrades apt-listchanges

echo "[2/6] Hardening SSH (key-only)..."
install -d -m 0755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin prohibit-password
UsePAM yes
EOF

sshd -t
systemctl restart ssh

echo "[3/6] Configuring UFW defaults..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

if [[ "${ALLOW_SSH}" == "true" ]]; then
  ufw allow 22/tcp
  echo "SSH port 22 allowed by explicit flag (--allow-ssh)."
fi

ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[4/6] Enabling unattended-upgrades..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades-local <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

systemctl enable unattended-upgrades >/dev/null 2>&1 || true
systemctl restart unattended-upgrades || true

echo "[5/6] Current UFW status:"
ufw status verbose

echo "[6/6] Done."
echo "Server baseline hardening has been applied."
