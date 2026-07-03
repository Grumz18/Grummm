# Documentation Audit

Last updated: 2026-05-25

## Purpose

This file records which docs are current, which need verification, and which are historical phase docs. If this audit conflicts with code, the code wins.

## Reading Order

For new work, read:

1. `docs/current-audit-and-completion-pipeline.md`
2. `docs/LLM_SYSTEM_STATE.md`
3. `docs/LLM_PROJECT_MAP.md`
4. `docs/cicd.md`
5. `llm-rules.md`, `architecture-lock.md`, `module-contract.md`

## Status Meanings

| Status | Meaning |
|---|---|
| Current | Usable as current project context |
| Needs refresh | Useful, but contains stale implementation details |
| Phase-specific | Historical or phase-scoped; do not treat as complete current state |
| Verify before use | Use only after checking code/server state |

## Docs Inventory

| File | Status | Notes |
|---|---|---|
| `docs/README.md` | Current | Documentation index and update policy |
| `docs/current-audit-and-completion-pipeline.md` | Current | Main stabilization pipeline |
| `docs/docs-audit.md` | Current | This audit |
| `docs/LLM_SYSTEM_STATE.md` | Current | Runtime and architecture guide |
| `docs/LLM_PROJECT_MAP.md` | Current | File-level repository map |
| `docs/cicd.md` | Current | Current GitHub Actions and deploy flow |
| `docs/production-improvement-roadmap.md` | Current | Production hardening roadmap |
| `docs/audit-logging.md` | Needs refresh | Verify middleware name and current admin endpoint coverage |
| `docs/backend-infra-deploy.md` | Needs refresh | Older deploy details may conflict with current SSH workflow |
| `docs/correlation-id.md` | Needs refresh | Verify against current Nginx/backend headers |
| `docs/design-spec.md` | Verify before use | Needs UI check against current public pages |
| `docs/frontend-static-deploy.md` | Needs refresh | Historical static deploy notes; current deploy is image-based |
| `docs/handover-checklist.md` | Phase-specific | Useful checklist, not full current state |
| `docs/junior-developer-tasks.md` | Verify before use | Tasks may be stale |
| `docs/landing-portfolio-roadmap.md` | Phase-specific | Historical landing/portfolio plan |
| `docs/module-deploy-smoke.md` | Needs refresh | Should match current GHCR/Compose deploy |
| `docs/module-onboarding.md` | Needs refresh | Module model is valid, examples need verification |
| `docs/new-ip-migration.md` | Verify before use | Check current compose/env names first |
| `docs/phase9-final-verification.md` | Phase-specific | Does not replace current smoke policy |
| `docs/postgres-backup.md` | Needs refresh | Restore drill should be required explicitly |
| `docs/production-launch-runbook.md` | Needs refresh | Needs current GHCR tags and smoke policy |
| `docs/read.md` | Verify before use | Purpose unclear |
| `docs/security-phase7-baseline.md` | Phase-specific | Security baseline is useful, current state must be verified in code |

## Root Context Files

| File | Status | Notes |
|---|---|---|
| `ai-context.md` | Current | Refreshed to current deploy/content state |
| `architecture-lock.md` | Current | Route lists include `/posts` and `/login`/`/404` where relevant |
| `module-contract.md` | Current | Frontend public route contract includes posts |
| `llm-rules.md` | Current | Hard constraints match current route zones |
| `AGENTS.md` | Current | Assistant onboarding instructions |

## Main Docs Vs Code Findings

### Landing editor

Backend landing endpoints exist, but frontend landing content is static-only and no `AdminLandingContentPage.tsx` exists.

### Public post visibility

Docs must not imply draft/private posts are implemented. Backend currently forces `kind=post` to `visibility=public`.

### Runtime templates

Production support is static demos. Runtime C#/Python/JavaScript template code exists but is disabled by backend and UI.

### Deploy model

Current deploy is image-based:

- CI builds frontend;
- Nginx Dockerfile copies fresh `platform/frontend/dist/`;
- remote deploy pulls GHCR images;
- remote server does not build frontend.

### CI/CD maturity

Current CI is build plus encoding check. Target CI should include frontend typecheck, frontend tests, backend tests, and blocking smoke.

## Docs Update Policy

Update docs in the same change when any of these areas change:

- route boundaries;
- Docker Compose overlays;
- GitHub Actions workflow;
- content model and visibility rules;
- admin editor behavior;
- public landing content source;
- smoke/readiness/backup scripts;
- runtime/static demo support.
