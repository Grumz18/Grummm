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
