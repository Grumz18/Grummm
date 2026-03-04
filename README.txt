GRUMMM - ПОДРОБНОЕ ОПИСАНИЕ ПРОЕКТА
====================================

1) Что это за проект
--------------------

Grummm — платформенный монорепозиторий с архитектурой **Modular Monolith**.

Основная идея:
- публично показывать портфолио;
- управлять контентом через приватную админ-зону;
- сохранять строгие границы между public/private маршрутами и API.

Зоны приложения:
- Публичная:
  - `/`
  - `/projects`
  - `/projects/:id`
- Приватная (только для админа):
  - `/app/*`

2) Технологический стек
-----------------------

Backend:
- ASP.NET Core 9 / .NET 9
- модульная архитектура с авто-регистрацией модулей
- JWT-аутентификация
- аудит админ-действий и correlation-id

Frontend:
- React 18
- TypeScript
- Vite
- Jest + Testing Library
- Cypress (базовые e2e)

Infra:
- Docker Compose
- Nginx (reverse proxy, TLS termination, security headers, rate limiting)
- PostgreSQL

3) Как устроен проект
---------------------

3.1 Структура репозитория
- `platform/backend`   — backend, WebAPI, модули
- `platform/frontend`  — публичный UI + админка
- `platform/infra`     — nginx, postgres image, server scripts
- `docs`               — runbook-и, smoke/checklist-документация

3.2 Архитектурные границы
- Public API: `/api/public/*`
- Private API: `/api/app/*` (с policy `AdminOnly`)
- Бизнес-логика не должна уезжать в контроллеры/лейауты.
- Модульные границы соблюдаются строго.

3.3 Ключевые backend-модули
- `ProjectPosts`:
  - публичное чтение проектов,
  - админский CRUD,
  - upload template bundles,
  - динамический dispatch для runtime-шаблонов.
- `TaskTracker`:
  - модуль трекера задач (как отдельная модульная часть платформы).

4) Ключевой функционал
----------------------

4.1 Публичная часть
- Landing page с визуальным блоком.
- Список проектов и карточки.
- Страница деталей проекта.
- Переключение языка/темы.

4.2 Админская часть
- Логин администратора.
- Раздел проектов: `/app/projects`
  - create/edit/delete,
  - медиа (обложка, скриншоты, видео),
  - шаблоны (Static/CSharp/Python/JavaScript),
  - загрузка frontend/backend файлов для template-режима.
- Раздел постов: `/app/posts`
  - похожая форма контента, но без runtime/template upload-потока.
- Редактор контента главной: `/app/content`
  - изменения сохраняются через backend API.

4.3 Landing content
- Публичное чтение: `GET /api/public/content/landing`
- Приватное сохранение: `PUT /api/app/content/landing`

4.4 Проекты и runtime
- Публичное чтение:
  - `GET /api/public/projects`
  - `GET /api/public/projects/{id}`
- Приватный CRUD:
  - `GET /api/app/projects`
  - `POST /api/app/projects`
  - `PUT /api/app/projects/{id}`
  - `DELETE /api/app/projects/{id}`
- Upload endpoint:
  - `POST /api/app/projects/{id}/upload-with-template`
- Динамические runtime-маршруты:
  - `/api/app/{slug}/*`
- Раздача загруженного frontend-контента через nginx:
  - `/app/{slug}/...`

5) Локальная разработка
-----------------------

Frontend:
- dev:
  - `npm run dev --workspace @platform/frontend`
- проверки:
  - `npm run typecheck --workspace @platform/frontend`
  - `npm run test --workspace @platform/frontend -- --runInBand`
  - `npm run build --workspace @platform/frontend`

Docker stack:
- поднять:
  - `docker compose up -d --build`
- проверить:
  - `docker compose ps`

6) Эксплуатационные заметки (без секретов)
------------------------------------------

- Контейнеры стоит запускать в detached-режиме (`-d`).
- В production-подобном окружении важно использовать restart policy (`unless-stopped`).
- Наружу публикуется nginx; backend и postgres остаются внутренними сервисами compose-сети.
- Конфиденциальные значения (пароли, ключи, токены, SMTP и т.д.) должны задаваться через env/config, а не в документации.

7) Полезные документы
---------------------

- `docs/README.md` — индекс документации
- `docs/LLM_PROJECT_MAP.md` — карта кода
- `architecture-lock.md` — архитектурные ограничения
- `module-contract.md` — контракт модулей
- `llm-rules.md` — жесткие правила для изменений
