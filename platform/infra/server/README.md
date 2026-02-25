# Ubuntu Server Baseline (Phase 2.1)

## Goal

Apply baseline server hardening:

- UFW open ports: `80/tcp`, `443/tcp`
- SSH only by key
- Password authentication disabled
- `unattended-upgrades` enabled

## Files

- `platform/infra/server/bootstrap-ubuntu.sh`
- `platform/infra/server/verify-ubuntu-hardening.sh`
- `platform/infra/server/deploy-module-smoke.sh`

## Apply

```bash
chmod +x platform/infra/server/bootstrap-ubuntu.sh platform/infra/server/verify-ubuntu-hardening.sh
sudo ./platform/infra/server/bootstrap-ubuntu.sh
```

Temporary option (if you must keep SSH on UFW during rollout):

```bash
sudo ./platform/infra/server/bootstrap-ubuntu.sh --allow-ssh
```

## Verify

```bash
sudo ./platform/infra/server/verify-ubuntu-hardening.sh
```

## Module Deploy Smoke

```bash
chmod +x platform/infra/server/deploy-module-smoke.sh
./platform/infra/server/deploy-module-smoke.sh
```
