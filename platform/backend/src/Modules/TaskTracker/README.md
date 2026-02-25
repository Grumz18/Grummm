# TaskTracker Module (Skeleton)

Minimal backend module scaffold without business logic.

- Implements `IModule`
- Registers no services yet
- Maps placeholder endpoints:
  - `GET /api/public/tasks/`
  - `GET /api/app/tasks/` (`AdminOnly`)
  - `GET /api/app/tasks/{ownerUserId}/items` (owner/admin check)
  - `POST /api/app/tasks/{ownerUserId}/items` (owner/admin check, DTO -> command mapping)
