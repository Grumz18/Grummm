# Nginx Baseline (Phase 2.3)

## Implemented

- HTTPS enabled on `443` (self-signed fallback by default)
- HTTP (`80`) redirect to HTTPS
- HSTS enabled
- Security headers enabled (CSP, frame/options, sniffing, referrer, permissions, cross-origin)
- Rate limiting enabled (`10r/s`, burst `30`)
- Auth brute-force limiter enabled for `POST /api/public/auth/login` (`5r/m`)
- `proxy_pass` for `/api/*` to backend (`http://backend:8080`)
- Static frontend serving from `/usr/share/nginx/html` with SPA fallback

## TLS Modes

- Default mode: self-signed certificate is generated on first container start.
- Let's Encrypt-ready path: `/.well-known/acme-challenge/` served from `/var/www/certbot`.

## Files

- `platform/infra/nginx/default.conf`
- `platform/infra/nginx/docker-entrypoint.sh`
- `platform/infra/nginx/static/index.html`

## CSP Baseline (Phase 7.1)

- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`
