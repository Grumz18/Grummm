# Security Baseline (Phase 7.1)

Last Updated: 2026-02-25
Version: 1.0
Status: BASELINE

## 1. SQL Injection (SQLi)

- Use EF Core query APIs and LINQ by default.
- Avoid dynamic raw SQL string concatenation.
- If raw SQL is required, use parameterized/interpolated EF APIs only.
- EF Core diagnostics must not leak sensitive SQL parameter values:
  - `EnableSensitiveDataLogging(false)`
  - `EnableDetailedErrors(false)`

## 2. XSS

- CSP is enforced at Nginx with restrictive defaults:
  - `default-src 'self'`
  - `script-src 'self'`
  - `style-src 'self'`
  - `object-src 'none'`
  - `frame-ancestors 'none'`
  - `form-action 'self'`
- Security headers are enabled:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`

## 3. CSRF

- Baseline auth model is JWT Bearer in `Authorization` header.
- CSRF risk is lower for pure bearer-token flow, but protection is enabled
  for cookie-based state-changing API requests:
  - antiforgery token endpoint: `GET /api/public/security/csrf`
  - validation middleware on unsafe `/api/*` requests with cookies and without bearer header.
- Cookie security baseline:
  - `SameSite=Strict`
  - `Secure`
  - `HttpOnly`

## 4. Brute-force

- Edge rate limiting is enabled in Nginx.
- Additional app-level rate limiting is enabled in WebAPI:
  - global per-IP limiter
  - stricter policy for `/api/public/auth/login`
  - stricter policy for `/api/public/auth/refresh`

## 5. IDOR

- Private resource endpoints must enforce ownership checks.
- Access is allowed only for:
  - resource owner
  - `Admin` role

## 6. Mass Assignment

- API request DTOs are validated before processing.
- DTOs are mapped to explicit command models.
- Server-owned fields (for example, `OwnerUserId`) must not be accepted from body DTO.

## 7. Token Lifetime and Refresh Cookie

- JWT lifetime is controlled by configuration (`Jwt` section):
  - `AccessTokenLifetimeMinutes`
  - `RefreshTokenLifetimeDays`
  - `ClockSkewSeconds` (set to `0` for strict expiry baseline)
- Refresh token rotation is mandatory:
  every successful refresh revokes old refresh token and issues a new one.
- Refresh token transport baseline:
  - do not return refresh token in JSON response body;
  - store refresh token in cookie only (`HttpOnly`, `Secure`, `SameSite=Strict`).
- Cookie lifecycle:
  - `/api/public/auth/login` sets refresh cookie;
  - `/api/public/auth/refresh` rotates and rewrites refresh cookie;
  - `/api/app/auth/logout` revokes and deletes refresh cookie.

## 8. Audit Logging

- Admin actions in `/api/app/*` must be written to audit log.
- Audit storage table: `audit.admin_action_audit_logs`.
- See: `docs/audit-logging.md`.

## 9. Correlation ID

- Correlation ID must propagate end-to-end:
  - `nginx` -> backend request header
  - backend middleware -> `HttpContext.TraceIdentifier`
  - backend logs with scope
  - response header + `nginx` access log
- See: `docs/correlation-id.md`.
