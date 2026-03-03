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
  - поля текста для EN/RU,
  - выбор TemplateType (None/Static/CSharp/Python/JavaScript),
  - условные секции загрузки шаблонов:
    frontend dropzone ("Drag dist here"),
    backend dropzone (отдельная зона под runtime/service файлы).

3.3 Источник данных проектов
- Frontend использует store, который пытается читать/писать через API.
- Если API недоступен или нет токена - есть fallback на localStorage.
- Для /app/projects добавлен multipart submit путь:
  - payload + templateType + frontendFiles + backendFiles в FormData;
  - если multipart endpoint недоступен, используется JSON fallback.

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
  - POST /api/app/projects/{id}/upload-with-template (multipart upload для шаблонов)

Хранение данных:
- Основной репозиторий: PostgreSQL (таблица public.project_posts).
- Fallback: in-memory, если connection string отсутствует.

Добавлено metadata для шаблонов поста:
- TemplateType enum: None, Static, CSharp, Python, JavaScript.
- Поля: frontend_path, backend_path.
- В API/DTO: template, frontendPath, backendPath.
- Для upload добавлен CQRS command:
  UploadWithTemplateCommand (Id, TemplateType, FrontendFiles, BackendFiles),
  включая template-aware validation (пример: JavaScript -> требуется package.json).
- Дополнительные проверки структуры:
  - Python: обязательны `requirements.txt` и минимум один `.py` файл;
  - JavaScript: запрещены `.exe` файлы.
- Перед сохранением upload проходит malware scan (ClamAV, секция ClamAv в appsettings),
  при детекте файл отклоняется с 400 и фиксируется audit-запись.
- Для CSharp шаблона добавлен runtime embedding:
  - DLL грузится через McMaster.NETCore.Plugins в collectible context;
  - dynamic dispatch endpoint: /api/app/{slug}/* (AdminOnly);
  - при удалении поста вызывается unload plugin runtime.
- Для Python шаблона добавлен runtime embedding:
  - Python.Runtime + инициализация CPython runtime;
  - установка зависимостей через `python3 -m pip install -r requirements.txt`;
  - restricted imports policy для sandbox-бейзлайна;
  - dynamic dispatch endpoint: /api/app/{slug}/* (AdminOnly).
- Для БД добавлена миграция:
  platform/backend/src/Modules/ProjectPosts/Infrastructure/Persistence/Migrations/20260303_add_template_metadata.sql

Тест:
- Добавлен backend-тест (xUnit) на сохранение поста с Template=JavaScript и путями.

5) Что нужно доделать (ближайшие шаги)
--------------------------------------

1. Добавить backend endpoint/handler для полноценного приема multipart (template uploads) без fallback.
2. Добавить backend-тесты на PostgreSQL-репозиторий и AdminOnly авторизацию.
3. Добавить валидацию template/path и файлового состава на уровне command/handler.
4. После стабилизации API убрать/сузить localStorage fallback.
5. Прогнать deploy smoke для сценария /app/projects -> /projects.

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
