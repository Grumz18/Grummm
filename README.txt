GRUMMM - ОПИСАНИЕ ПРОЕКТА (АКТУАЛЬНО НА 2026-03-03)
====================================================

1) Что это за проект
-------------------

Grummm - это платформенный монорепозиторий с архитектурой Modular Monolith.

Проект состоит из двух продуктовых зон:
- Публичная зона (витрина):
  - /
  - /projects
  - /projects/:id
- Приватная админ-зона:
  - /app/*

Назначение проекта:
- показывать портфолио/проекты в публичной части;
- управлять этими проектами через админку;
- соблюдать строгие архитектурные и security-границы между public/private.

2) Стек и инфраструктура
------------------------

Backend:
- ASP.NET Core 9 / .NET 9

Frontend:
- React + TypeScript + Vite

Infra:
- Nginx
- Docker Compose
- PostgreSQL baseline

3) Как это работает на текущий момент
-------------------------------------

3.1 Публичная часть
- Landing на / с 2D-анимацией «земли» и орбитами технологий.
- Каталог проектов на /projects.
- Детальная страница проекта на /projects/:id.
- Переключение темы и языка в публичной зоне.

3.2 Админская часть
- Приватный shell /app с навигацией.
- Workspace для постов /app/projects:
  - создание поста,
  - редактирование поста,
  - удаление поста,
  - загрузка медиа (обложка, скриншоты, видео),
  - поля текста для EN/RU.

3.3 Источник данных проектов
- Frontend использует store, который пытается читать/писать через API.
- Если API недоступен или нет токена - есть fallback на localStorage.

4) Что сделано по backend
-------------------------

Добавлен модуль ProjectPosts:
- Public read:
  - GET /api/public/projects
  - GET /api/public/projects/{id}
- Admin CRUD (AdminOnly):
  - GET /api/app/projects
  - POST /api/app/projects
  - PUT /api/app/projects/{id}
  - DELETE /api/app/projects/{id}

Важно:
- Сейчас репозиторий ProjectPosts in-memory.
- Это рабочий baseline, но данные не переживают рестарт backend.

5) Что нужно доделать (ближайшие шаги)
--------------------------------------

1. Перевести ProjectPosts на PostgreSQL persistence.
2. Добавить backend-тесты на CRUD и авторизацию AdminOnly.
3. После стабилизации API убрать/сузить localStorage fallback.
4. Прогнать deploy smoke для сценария /app/projects -> /projects.

6) Структура репозитория
------------------------

- platform/backend   : backend, модули, WebAPI
- platform/frontend  : frontend (public + admin)
- platform/infra     : nginx, server scripts, postgres image
- docs               : runbook-и, onboarding, проверки

7) Ключевые файлы контекста
---------------------------

- ai-context.md        : полный снимок архитектуры и состояния
- dev-state.md         : активные задачи и приоритеты
- architecture-lock.md : зафиксированные архитектурные ограничения

8) Быстрая команда сборки фронтенда
-----------------------------------

npm run build --workspace @platform/frontend
