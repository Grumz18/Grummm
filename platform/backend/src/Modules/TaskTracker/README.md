# TaskTracker Module

Backend implementation baseline with:

- domain model: `TaskItem`
- CQRS:
  - commands: create/complete task
  - query: list tasks by owner
- validation:
  - request DTO data annotations
  - command validators
- repository:
  - `ITaskItemRepository`
  - `InMemoryTaskItemRepository` (module-local baseline)
- DTO and strict mappings:
  - request DTO -> command
  - domain -> response DTO

Endpoints:

- `GET /api/public/tasks/` (public summary)
- `GET /api/app/tasks/` (`AdminOnly`)
- `GET /api/app/tasks/{ownerUserId}` (`AdminOnly` + owner/admin check)
- `GET /api/app/tasks/{ownerUserId}/{taskId}` (`AdminOnly` + owner/admin check)
- `POST /api/app/tasks/{ownerUserId}` (`AdminOnly` + owner/admin check)
- `PATCH /api/app/tasks/{ownerUserId}/{taskId}/complete` (`AdminOnly` + owner/admin check)
