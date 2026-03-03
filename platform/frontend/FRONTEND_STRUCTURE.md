# Frontend Structure (without dist)

Root: `platform/frontend`

```text
platform/frontend/
|- index.html
|- package.json
|- tsconfig.json
|- vite.config.ts
|- jest.config.cjs
`- src/
   |- main.tsx
   |- styles.css
   |- core/
   |  |- README.md
   |  |- auth/
   |  |  `- auth-session.tsx
   |  |- layouts/
   |  |  |- PublicLayout.tsx
   |  |  |- PrivateAppLayout.tsx
   |  |  `- index.ts
   |  |- plugin-registry/
   |  |  |- module-contract.ts
   |  |  |- registry.ts
   |  |  `- index.ts
   |  `- routing/
   |     |- AppRouter.tsx
   |     |- ProtectedRoute.tsx
   |     `- index.ts
   |- modules/
   |  |- README.md
   |  `- task-tracker/
   |     |- task-tracker.module.tsx
   |     |- TaskTrackerPublicPage.tsx
   |     |- TaskTrackerPrivatePage.tsx
   |     |- TaskTrackerCreatePage.tsx
   |     `- TaskTrackerBoardPage.tsx
   |- public/
   |  |- types.ts
   |  |- preferences.tsx
   |  |- assets/
   |  |  `- alien_planet.glb
   |  |- components/
   |  |  |- RotatingEarth.tsx
   |  |  |- SpaceBackground.tsx
   |  |  |- ProjectCard.tsx
   |  |  |- ProjectPopup.tsx
   |  |  `- ProjectCard.test.tsx
   |  |- data/
   |  |  `- projects.ts
   |  |- hooks/
   |  |  `- useSwipeBack.ts
   |  `- pages/
   |     |- LandingPage.tsx
   |     |- ProjectsPage.tsx
   |     `- ProjectDetailPage.tsx
   `- test/
      `- setupTests.ts
```

## Notes

- `dist/` intentionally excluded from this map.
- `core/` contains app-level infrastructure (routing, auth, layouts, module registry).
- `modules/` stores feature modules discovered by the plugin registry.
- `public/` stores landing/portfolio UI, shared public data and interactions.
