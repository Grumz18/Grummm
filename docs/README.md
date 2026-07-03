# Docs Index

Last updated: 2026-05-25

## Start here

- `docs/current-audit-and-completion-pipeline.md` - current audit, known broken/unfinished areas, and the pipeline for completing the project.
- `docs/production-improvement-roadmap.md` - step-by-step production improvement plan for services, uploads, media, demos, runtime, CI/CD and operations.
- `docs/docs-audit.md` - status of every docs file and known docs-vs-code drift.
- `docs/LLM_SYSTEM_STATE.md` - current system behavior, architecture, deploy model, and sharp edges.
- `docs/LLM_PROJECT_MAP.md` - current file-level map of the repository.
- `docs/cicd.md` - current GitHub Actions, GHCR image build, deploy, and target CI/CD improvements.

If docs conflict, prefer files dated `2026-05-25`, then verify against the code.

## Current work pipeline

The active improvement plan lives in:

- `docs/current-audit-and-completion-pipeline.md`

Recommended PR order:

1. Docs audit and LLM docs refresh.
2. Landing content API integration and admin editing decision.
3. Publish/draft model for posts and production data cleanup.
4. Public UX responsive/tags/card cleanup.
5. Analytics semantics fix.
6. CI/CD hardening.
7. Media/static demo hardening.
8. Legacy docs archive pass.

## LLM / developer onboarding

- `docs/LLM_SYSTEM_STATE.md` - fastest system overview.
- `docs/LLM_PROJECT_MAP.md` - verified map of important files.
- `ai-context.md` - rolling snapshot.
- `architecture-lock.md` - locked architecture decisions.
- `module-contract.md` - module boundary rules.
- `llm-rules.md` - hard constraints for routing, layouts, modules, and security.
- `AGENTS.md` - assistant onboarding rules.

## Operations and deployment

- `docs/cicd.md` - current GitHub Actions and deploy flow.
- `docs/backend-infra-deploy.md` - backend/infra deploy runbook, needs refresh against current SSH script.
- `docs/frontend-static-deploy.md` - historical/static deploy notes, needs refresh for image-based deploy.
- `docs/module-deploy-smoke.md` - module deploy smoke, needs refresh.
- `docs/phase9-final-verification.md` - phase-specific final verification.
- `docs/postgres-backup.md` - backup/retention/restore, needs restore drill update.
- `docs/new-ip-migration.md` - migration guide, verify before use.
- `docs/handover-checklist.md` and `docs/production-launch-runbook.md` - launch handover docs, refresh before production use.

## Architecture and feature docs

- `docs/module-onboarding.md` - adding modules.
- `docs/security-phase7-baseline.md` - phase 7 security baseline.
- `docs/audit-logging.md` - audit logging baseline.
- `docs/correlation-id.md` - correlation-id flow.
- `docs/design-spec.md` - visual/product design notes, verify against current UI.
- `docs/production-improvement-roadmap.md` - production hardening and optimization roadmap.
- `docs/landing-portfolio-roadmap.md` - historical landing/portfolio roadmap.
- `docs/junior-developer-tasks.md` - task list, verify before assigning.
- `docs/read.md` - legacy/unclear purpose, verify before use.

## Server scripts reference

- `platform/infra/server/deploy-module-smoke.sh`
- `platform/infra/server/bootstrap-platform-stack.sh`
- `platform/infra/server/phase9-smoke.sh`
- `platform/infra/server/postgres-backup.sh`
- `platform/infra/server/postgres-backup-offsite.sh`
- `platform/infra/server/postgres-restore-drill.sh`
- `platform/infra/server/readiness-check.sh`
- `platform/infra/server/collect-platform-state.sh`

## Required docs updates by change type

| Change | Docs to update |
|---|---|
| Route/layout changes | `LLM_SYSTEM_STATE.md`, `LLM_PROJECT_MAP.md`, `llm-rules.md` if needed |
| Content model or visibility | `current-audit-and-completion-pipeline.md`, `LLM_SYSTEM_STATE.md` |
| Deploy/CI workflow | `cicd.md`, `LLM_SYSTEM_STATE.md`, relevant runbook |
| Admin editor behavior | `LLM_PROJECT_MAP.md`, relevant feature docs |
| Public landing content source | `current-audit-and-completion-pipeline.md`, `LLM_SYSTEM_STATE.md` |
| Backup/readiness/smoke | `cicd.md`, `postgres-backup.md`, operational runbooks |
| Static demo routing/media | `LLM_SYSTEM_STATE.md`, `LLM_PROJECT_MAP.md`, `production-improvement-roadmap.md`, `cicd.md` |
