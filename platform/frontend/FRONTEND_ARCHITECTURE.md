# Frontend Architecture Guide

This document describes the current frontend architecture after the public/private shell reset and the split between editorial posts and runtime projects.

## Stable boundaries

The following contracts are fixed and must be preserved:
- Public routes: `/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`
- Private routes: `/app/*`
- Frontend module discovery through the plugin registry
- Centralized theme and language preferences
- API-first stores with controlled local fallback
- Auth guard through `ProtectedRoute`
- Persistent shells through `PublicLayout` and `PrivateAppLayout`

Business logic, store contracts, API usage and route ownership stay stable. Visual composition may change.

## Entry point

File: `src/main.tsx`

Startup flow:
1. Resolve `#root`
2. Restore auth session from `localStorage`
3. Mount the app with global styles from `src/styles.css`
4. Remove the external preloader overlay after the first paint cycle

## Static shell and SEO surface

Files:
- `index.html`
- `public/preload.css`
- `public/preload.js`
- `public/robots.txt`
- `public/sitemap.xml`
- `scripts/prerender-seo.mjs`

Responsibilities:
- hold the semantic fallback HTML used by non-JS crawlers
- expose stable title, description, keywords, canonical and social metadata
- provide anchor links and readable paragraphs before the React app hydrates
- show a CSP-safe external preloader instead of flashing raw fallback text

Important consequence:
- runtime metadata from React must stay aligned with static metadata in `index.html`
- `robots.txt` stays a frontend deploy asset
- build-time `public/sitemap.xml` is only a fallback; production freshness comes from backend `/sitemap.xml`

## Provider and router tree

Primary file: `src/core/routing/AppRouter.tsx`

Current tree:
1. `AuthSessionProvider`
2. `PreferencesProvider`
3. `BrowserRouter`
4. Public analytics tracker
5. Nested route tree
6. Reauth dialog overlay

Important consequence:
- public and private shells stay mounted between route transitions
- page content changes through nested routes and `Outlet`
- layout remount flicker is intentionally avoided

## Routing model

### Public zone
Rendered inside `PublicLayout`:
- `/`
- `/login`
- `/projects`
- `/projects/:id`
- `/posts`
- `/posts/:id`
- public routes from frontend modules

### Private zone
Rendered inside `ProtectedRoute` + `PrivateAppLayout`:
- `/app`
- `/app/projects`
- `/app/posts`
- `/app/content`
- `/app/security`
- `/app/:slug`
- private routes from frontend modules

## Layout shells

### `PublicLayout`
Responsibilities:
- persistent public header
- shared shell width and spacing
- public content outlet
- GSAP enhancement hookup for public screens

### `PrivateAppLayout`
Responsibilities:
- private top bar and aside navigation
- session state and logout
- theme control in admin zone
- mobile private navigation state
- shared outlet for `/app/*`
- persistent shell chrome without reveal/stagger animations on mounted admin navigation

## Preferences and i18n

### Preferences
File: `src/public/preferences.tsx`

Stores:
- `theme`
- `language`

Sync targets:
- `localStorage`
- `document.documentElement.dataset.theme`
- `document.documentElement.lang`

### Translation layer
Files:
- `src/shared/i18n/ru.ts`
- `src/shared/i18n/en.ts`
- `src/shared/i18n/t.ts`
- `src/shared/i18n/get-current-language.ts`

Principle:
- translations are local dictionaries in the repo
- no external i18n library is used
- UI must consume the centralized `t(...)` layer

## Frontend plugin model

Files:
- `src/core/plugin-registry/module-contract.ts`
- `src/core/plugin-registry/registry.ts`
- `src/modules/*/*.module.tsx`

Rules:
- modules declare their own public and private pages
- registry discovers modules automatically
- core router must not manually wire module pages

## Data layer

### `project-store.ts`
Responsibilities:
- public portfolio fetch
- admin CRUD
- upload/template related project flows
- local fallback when API/token is unavailable
- normalization of `kind`, `contentBlocks`, `publishedAt`, `template`, and `publicDemoEnabled`
- backend enum-case normalization for post blocks (`Image` / `Paragraph` / `Subheading`)
- local backfill of missing publication dates

Important contract:
- `PortfolioProject.kind` splits editorial `post` entries from runtime `project` entries
- `PortfolioProject.contentBlocks` stores structured post content blocks
- `PortfolioProject.publishedAt` is available for both posts and projects and is rendered in cards and detail views

### `landing-content-store.ts`
Responsibilities:
- landing hero copy
- about block copy
- portfolio intro copy
- about photo

## Public UI composition

### `PublicHeader.tsx`
Contains:
- brand block
- primary nav
- two minimal circular icon buttons for language and theme switching
- posts link instead of admin login

Important:
- header lives in `PublicLayout`
- admin entry remains only inside landing hero CTA
- old segmented preference control is removed

### `LandingHeroSection.tsx`
Current model:
- text-first layered hero
- desktop scene is a decorative right-side layer
- mobile hides the scene completely
- content order is fixed: eyebrow -> title -> description -> CTA actions
- `HeroMorphTitle.tsx` keeps `Grummm` static and morphs only the suffix phrase on desktop

### `ProjectCard.tsx`
Current card behavior:
- unified media/text shell
- direct navigation on click/tap
- tags are shown only on cards
- publication date is rendered for both posts and projects when available, including public cards and detail headers
- card eyebrow changes by entry kind

### `ProjectDetailPage.tsx`
Two detail flows:
- `mode="project"`
  - detail header with publication meta
  - optional video
  - optional static public demo and CTA if `publicDemoEnabled`
  - text-first summary with cover image
  - screenshots gallery and lightbox
- `mode="post"`
  - detail header with publication meta
  - optional video
  - block-based article renderer
  - publication date in header and article footer
  - related links to other posts and projects

### `PostContentRenderer.tsx`
Renders structured post blocks:
- paragraph blocks through `ParagraphText`
- subheading blocks as section headings
- image blocks as article figures
- plain description fallback when no blocks exist
- publication date footer for posts

### `RelatedEntriesSection.tsx`
Rendered at the bottom of public post detail pages and links to other posts and runtime projects.

## Private/admin UI composition

Core files:
- `src/core/layouts/PrivateAppLayout.tsx`
- `src/core/pages/AdminOverviewPage.tsx`
- `src/core/pages/AdminProjectsWorkspace.tsx`
- `src/core/pages/AdminLandingContentPage.tsx`
- `src/core/pages/AdminSecurityPage.tsx`
- `src/core/pages/DynamicProjectViewer.tsx`

### `AdminProjectsWorkspace.tsx`
Single page component with two modes:
- `mode="projects"`
  - runtime project editor
  - template selection
  - frontend/backend upload bundles
  - screenshots and optional video
  - public demo toggle for safe static projects
- `mode="posts"`
  - title, summary, cover, tags
  - block-based post editor
  - publication date preview/readout
  - no runtime template controls
  - no screenshot/video bundle workflow

### `AdminPostBlocksEditor.tsx`
Block-based editor used only in posts mode.

Capabilities:
- add blocks through `+` picker
- supported block types: paragraph, subheading, image
- text blocks store EN/RU content separately
- image blocks upload and preview a single image
- blocks can be moved up/down or removed

## Motion layer

File: `src/shared/ui/useGsapEnhancements.ts`

Current contract:
- `[data-gsap='reveal']` for container reveal
- `[data-gsap='stagger']` for child stagger
- `[data-gsap-button]` for hover/press interaction
- `[data-gsap-hero-parallax]` for landing hero cube/glow motion only
- persistent admin shell elements must not use reveal/stagger data attributes
- respects `prefers-reduced-motion`

Rule:
- GSAP enhances motion only
- it must not own layout, route state or business behavior
- pointer-follow surface glow is removed from the system

## SEO runtime metadata layer

File: `src/shared/seo/useDocumentMetadata.ts`

Responsibilities:
- sync document title
- sync description, keywords, robots
- sync OpenGraph and Twitter fields
- keep canonical URLs aligned with route changes

Rule:
- page-level metadata should be set here, not ad hoc inside components
- static fallback metadata in `index.html` must stay consistent with runtime metadata on public pages

## CSS architecture

File: `src/styles.css`

Single design-system layer for the SPA.

It currently contains:
- theme tokens
- base typography and spacing
- public/private shells
- buttons, chips, cards, forms
- landing hero layout
- project detail layout
- post article layout
- admin post blocks editor layout
- responsive overrides
- mobile tap-highlight suppression for header controls

## Asset ownership

Current frontend image assets relevant to hero and branding:
- `src/images/grummmLogo.png`
- `src/images/grummmLogo.svg`
- `src/images/logo_white.png`
- `src/images/logo_dark.png`

Used for:
- public header branding and favicon
- theme-aware hero artwork

## Where to change what

Change navigation or shell:
- `src/public/components/PublicHeader.tsx`
- `src/core/layouts/PublicLayout.tsx`
- `src/styles.css`

Change hero content or behavior:
- `src/public/components/LandingHeroSection.tsx`
- `src/public/components/HeroMorphTitle.tsx`
- `src/public/pages/LandingPage.tsx`
- `src/styles.css`
- `src/images/logo_white.png`
- `src/images/logo_dark.png`

Change static preload or crawl-facing fallback:
- `index.html`
- `public/preload.css`
- `public/preload.js`
- `public/robots.txt`
- `public/sitemap.xml`
- `scripts/prerender-seo.mjs`
- `src/shared/seo/useDocumentMetadata.ts`

Change post/project storage contract:
- `src/public/types.ts`
- `src/public/data/project-store.ts`
- `src/public/data/projects.ts`
- `src/public/formatPublishedDate.ts`

Change admin post editor:
- `src/core/components/AdminPostBlocksEditor.tsx`
- `src/core/pages/AdminProjectsWorkspace.tsx`
- `src/styles.css`

Change public detail flows:
- `src/public/components/PostContentRenderer.tsx`
- `src/public/components/RelatedEntriesSection.tsx`
- `src/public/components/ProjectDetailHeader.tsx`
- `src/public/components/ProjectDetailSummary.tsx`
- `src/public/pages/ProjectDetailPage.tsx`
- `src/styles.css`
