# Frontend Structure

Root: `platform/frontend`

Companion docs:
- `FRONTEND_ARCHITECTURE.md` - routing, layouts, stores, motion layer, SEO shell and UI ownership
- `../docs/LLM_PROJECT_MAP.md` - cross-project map for backend/frontend/infra
- `../ai-context.md` - current platform state snapshot

## Tree

```text
platform/frontend/
|- FRONTEND_ARCHITECTURE.md
|- FRONTEND_STRUCTURE.md
|- index.html
|- jest.config.cjs
|- package.json
|- scripts/
|  `- prerender-seo.mjs
|- tsconfig.json
|- vite.config.ts
|- public/
|  |- preload.css
|  |- preload.js
|  |- robots.txt
|  `- sitemap.xml
`- src/
   |- main.tsx
   |- styles.css
   |- images/
   |  |- grummmLogo.png
   |  |- grummmLogo.svg
   |  |- logo_dark.png
   |  `- logo_white.png
   |- core/
   |  |- README.md
   |  |- auth/
   |  |  |- auth-api.ts
   |  |  `- auth-session.tsx
   |  |- components/
   |  |  `- AdminPostBlocksEditor.tsx
   |  |- layouts/
   |  |  |- index.ts
   |  |  |- PrivateAppLayout.tsx
   |  |  `- PublicLayout.tsx
   |  |- pages/
   |  |  |- AdminLandingContentPage.tsx
   |  |  |- AdminLoginPage.tsx
   |  |  |- AdminOverviewPage.tsx
   |  |  |- AdminProjectsWorkspace.test.tsx
   |  |  |- AdminProjectsWorkspace.tsx
   |  |  |- AdminSecurityPage.tsx
   |  |  `- DynamicProjectViewer.tsx
   |  |- plugin-registry/
   |  |  |- index.ts
   |  |  |- module-contract.ts
   |  |  `- registry.ts
   |  `- routing/
   |     |- AppRouter.dynamic-viewer.test.tsx
   |     |- AppRouter.tsx
   |     |- index.ts
   |     `- ProtectedRoute.tsx
   |- modules/
   |  |- README.md
   |  `- task-tracker/
   |     |- task-tracker.module.tsx
   |     |- TaskTrackerBoardPage.tsx
   |     |- TaskTrackerCreatePage.tsx
   |     |- TaskTrackerPrivatePage.tsx
   |     `- TaskTrackerPublicPage.tsx
   |- public/
   |  |- formatPublishedDate.ts
   |  |- preferences.tsx
   |  |- types.ts
   |  |- assets/
   |  |  |- alien_planet.glb
   |  |  `- logo.png
   |  |- components/
   |  |  |- HeroActions.tsx
   |  |  |- HeroHighlights.tsx
   |  |  |- HeroMorphTitle.tsx
   |  |  |- LandingAboutSection.tsx
   |  |  |- LandingHeroSection.tsx
   |  |  |- LiquidGlass.tsx
   |  |  |- ParagraphText.tsx
   |  |  |- PortfolioSection.tsx
   |  |  |- PostContentRenderer.tsx
   |  |  |- ProjectCard.test.tsx
   |  |  |- ProjectCard.tsx
   |  |  |- ProjectCardGrid.tsx
   |  |  |- ProjectCardPlaceholder.tsx
   |  |  |- ProjectDetailHeader.tsx
   |  |  |- ProjectDetailSummary.tsx
   |  |  |- ProjectLightbox.tsx
   |  |  |- ProjectNotFoundCard.tsx
   |  |  |- ProjectPopup.tsx
   |  |  |- ProjectPreviewCard.tsx
   |  |  |- ProjectsCatalogHeader.tsx
   |  |  |- ProjectScreensGallery.tsx
   |  |  |- PublicHeader.tsx
   |  |  |- RelatedEntriesSection.tsx
   |  |  `- SectionHeading.tsx
   |  |- data/
   |  |  |- landing-content-store.ts
   |  |  |- project-store.ts
   |  |  `- projects.ts
   |  |- hooks/
   |  |  `- useSwipeBack.ts
   |  `- pages/
   |     |- LandingPage.tsx
   |     |- PostsPage.tsx
   |     |- ProjectDetailPage.tsx
   |     `- ProjectsPage.tsx
   |- shared/
   |  |- i18n/
   |  |  |- en.ts
   |  |  |- get-current-language.ts
   |  |  |- index.ts
   |  |  |- ru.ts
   |  |  `- t.ts
   |  |- seo/
   |  |  `- useDocumentMetadata.ts
   |  `- ui/
   |     `- useGsapEnhancements.ts
   `- test/
      `- setupTests.ts
```

## Ownership map

### `index.html`
Static crawl-facing shell. Owns:
- base metadata
- semantic fallback content
- anchor links for non-JS crawlers
- preloader mount point

### `public/preload.css` / `public/preload.js`
CSP-safe external preload assets. They hide the semantic shell behind a neutral preloader until the SPA mounts.

### `public/robots.txt` / `public/sitemap.xml`
Static crawl assets shipped with the SPA build. `robots.txt` stays authoritative; `public/sitemap.xml` is a build-time fallback for seed routes and is superseded in production by the backend-driven `/sitemap.xml`.

### `scripts/prerender-seo.mjs`
Build-time SEO pass that creates prerendered HTML for repo-backed posts/projects and rewrites the fallback sitemap during `npm run build`.

### `src/main.tsx`
Bootstraps React, restores the auth session, mounts `AppRouter`, and removes the preloader after first paint.

### `src/styles.css`
Global frontend design system and responsive behavior. It owns theme tokens, shell geometry, cards, forms, hero layout, post/project detail layout, admin post block editor layout, and cross-page spacing.

### `src/images`
Branding and theme-aware hero artwork used by the public header, favicon and landing hero.

### `src/core`
Application shell layer:
- auth session
- route guards
- public/private layouts
- router tree
- private admin pages
- plugin registry
- admin-only post block editor component

### `src/public`
Public showcase layer:
- landing page
- separate projects catalog and posts catalog
- split detail flow for posts vs projects
- public UI components
- preferences
- landing and project stores
- publication-date formatting helper

### `src/public/types.ts`
Defines the frontend portfolio contract, including:
- `PortfolioEntryKind`
- `PortfolioContentBlockType`
- `PortfolioContentBlock`
- `PortfolioProject`

### `src/core/pages/AdminProjectsWorkspace.tsx`
Owns creation/editing workflows for:
- runtime projects
- editorial posts
- custom template picker UI
- block-based post authoring
- publication-date readout
- public demo toggle for safe static project demos

### `src/public/data/project-store.ts`
Owns API-first project/post CRUD and normalization for:
- `kind`
- `contentBlocks`
- `publishedAt`
- `template`
- `publicDemoEnabled`
- template-path defaults
- localStorage fallback
- normalization of backend block-type casing so post images survive API reloads
- local backfill of missing publication dates

### `src/core/components/AdminPostBlocksEditor.tsx`
Dedicated editor used only for posts mode in admin. It owns add/reorder/remove logic for paragraph/subheading/image blocks.

### `src/public/components/PostContentRenderer.tsx`
Renders structured public post bodies from `contentBlocks` and appends publication metadata at the bottom of article text.

### `src/public/components/ProjectDetailHeader.tsx`
Renders title, summary, publication meta, full-width back button, and optional public-demo CTA.

### `src/shared/seo/useDocumentMetadata.ts`
Synchronizes runtime metadata (`title`, `description`, `keywords`, canonical, OG/Twitter tags) with route changes.

## Current public composition

- `PublicHeader.tsx` - persistent navigation and two compact icon controls for language and theme
- `LandingHeroSection.tsx` - text-first layered hero with a desktop-only decorative scene
- `HeroMorphTitle.tsx` - desktop-only morph title that keeps `Grummm` static and morphs the suffix phrase
- `PortfolioSection.tsx` - reusable wrapper for curated posts and modules
- `ProjectCard.tsx` - unified card with direct navigation and publication date support
- `ProjectDetailHeader.tsx` - title, summary, publication meta, optional public-demo CTA and back action
- `ProjectDetailSummary.tsx` - project-only editorial summary
- `PostContentRenderer.tsx` - post-only structured article body with footer publication date
- `RelatedEntriesSection.tsx` - post-only recommendations footer

## Current frontend direction

The frontend is intentionally organized around:
- persistent shells
- composable sections
- centralized stores
- centralized theme and language
- a thin GSAP enhancement layer
- explicit split between showcase posts and runtime projects
- block-based editorial post content
- crawl-friendly fallback HTML plus runtime metadata sync

If the visual layer changes again, these boundaries should remain intact.
