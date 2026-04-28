# Frontend Static Deploy

## Scope

Use this flow when only public/admin frontend code changed and backend/nginx config did not change.

## What is deployed

- local frontend build output
- prerendered HTML
- mirrored nginx static snapshot in:
  - `platform/infra/nginx/static`
- nginx image content:
  - `platform/frontend/dist`
  - `platform/infra/nginx/static`

Important: in the current setup nginx serves files copied into the image at build time.
`docker-compose.yml` does not mount `platform/infra/nginx/static` as a runtime volume.

## Local build

Run on the development machine:

```bash
npm run build --workspace @platform/frontend
```

What this does:

- builds Vite output into `platform/frontend/dist`
- runs `scripts/prerender-seo.mjs`
- mirrors the final result into `platform/infra/nginx/static`

## Files to upload

Upload updated frontend sources to the server repository (or pull latest commit), including:

```text
platform/frontend
platform/infra/nginx
```

## Server apply

After upload/pull, rebuild nginx image:

```bash
cd /opt/platform
docker compose up -d --build nginx
```

If backend is unchanged, rebuilding `nginx` is enough for frontend text/layout updates.

If you deploy with `docker-compose.deploy.yml` and prebuilt registry images:
1. Build/push a new nginx image with updated frontend.
2. Update `NGINX_IMAGE` tag.
3. Recreate nginx using deploy compose files.

## Verification

Check:

```bash
curl -I https://grummm.ru/
curl -I https://grummm.ru/posts
curl -I https://grummm.ru/projects
curl -I https://grummm.ru/404
```

Then open the site in browser and hard reload.

## Use this flow when

- styles/components/text changed
- public pages changed
- admin UI changed
- prerendered SEO output changed
- no backend/API contract changed
- no nginx config changed
