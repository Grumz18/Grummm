# Audit Logging Baseline (Phase 7.4)

Last Updated: 2026-02-25
Version: 1.0
Status: BASELINE

## 1. Scope

Audit logging is applied to admin actions in private API zone:

- path prefix: `/api/app/*`
- methods: non-safe (`POST`, `PUT`, `PATCH`, `DELETE`, etc.)
- role: `Admin`

## 2. Storage Table

Table: `audit.admin_action_audit_logs`

Columns:

- `id` (BIGINT, identity, PK)
- `occurred_at_utc` (TIMESTAMPTZ, NOT NULL)
- `user_id` (VARCHAR(128), NOT NULL)
- `user_name` (VARCHAR(256), NULL)
- `role` (VARCHAR(64), NOT NULL)
- `action` (VARCHAR(256), NOT NULL)
- `http_method` (VARCHAR(16), NOT NULL)
- `request_path` (VARCHAR(512), NOT NULL)
- `query_string` (VARCHAR(1024), NULL)
- `response_status_code` (INTEGER, NOT NULL)
- `correlation_id` (VARCHAR(128), NULL)
- `ip_address` (VARCHAR(128), NULL)
- `user_agent` (VARCHAR(1024), NULL)

## 3. Bootstrap

On startup, backend runs bootstrap SQL (`CREATE SCHEMA/TABLE/INDEX IF NOT EXISTS`)
through hosted service:

- `AuditLogBootstrapHostedService`
- explicit `Database.MigrateAsync()`
- startup logs via `ILogger` (`LogInformation`, `LogError`)

If DB migration/bootstrap fails, startup fails with explicit error log.

## 4. Middleware

Admin audit middleware:

- file: `platform/backend/src/WebAPI/Middleware/AdminAuditLoggingMiddleware.cs`
- writes records via `IAuditLogWriter`
- implementation: `EfCoreAuditLogWriter`
