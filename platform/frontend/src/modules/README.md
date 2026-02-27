# Frontend Modules

Frontend modules live here and are auto-discovered by plugin registry.

- Add module metadata file: `*.module.ts` or `*.module.tsx`
- Export default `module` object conforming to `FrontendModuleContract`
- Do not manually register modules in routing or registry code
- Public description pages should stay in public zone (for example `/projects/:id`).
