# Correlation ID Propagation (Phase 7.5)

Last Updated: 2026-02-25
Version: 1.0
Status: BASELINE

## Flow

1. `nginx` receives client request.
2. `X-Correlation-ID` is resolved:
   - use incoming `X-Correlation-ID` if provided;
   - otherwise fallback to `nginx` `$request_id`.
3. `nginx` forwards `X-Correlation-ID` to backend.
4. Backend `CorrelationIdMiddleware` sets `HttpContext.TraceIdentifier` and response header.
5. Backend logs include correlation scope (`CorrelationId=...`).
6. `nginx` access log includes `corr_id`.

## Files

- `platform/infra/nginx/default.conf`
- `platform/backend/src/WebAPI/Middleware/CorrelationIdMiddleware.cs`
- `platform/backend/src/WebAPI/Program.cs`
