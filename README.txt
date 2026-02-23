ФАЗА 0 — Инициализация и фиксация правил
0.1 Зафиксировать начальное состояние контекста. Создать и зафиксировать четыре файла-правил в актуальном виде.
0.2 Зафиксировать точные публичные и приватные маршруты в ai-context.md и module-contract.md. Обновить dev-state.md и architecture-lock.md при необходимости.
ФАЗА 1 — Архитектурный фундамент
1.1 Создать и зафиксировать модель системы:
логические зоны URL (/ , /projects , /projects/:id , /app , /app/:module)
разделение public vs private зон
сравнительную таблицу зон
высокоуровневую структуру папок и namespace
1.2 Создать структуру монорепозитория:
/platform/backend
/platform/frontend
/platform/infra
Создать базовые файлы: README.md , .gitignore , root package.json (если требуется)
1.3 Создать базовые Dockerfile и docker-compose.yml:
nginx
placeholder backend
postgres Без реального кода приложений.
1.4 Создать скелет CI/CD (GitHub Actions или аналог):
только структура workflow-файла, без шагов конкретных модулей.
ФАЗА 2 — Сервер и базовая инфраструктура
2.1 Настроить Ubuntu-сервер:
ufw (открыть только 80/443)
ssh только по ключу
отключить аутентификацию по паролю
включить unattended-upgrades
2.2 Создать минимальный docker-compose.yml:
сеть
volumes
nginx ↔ backend ↔ postgres Backend не экспонируется наружу напрямую.
2.3 Настроить Nginx:
HTTPS (Let's Encrypt или self-signed)
HSTS
security headers
rate limiting
proxy_pass на backend
отдача статического фронтенда
ФАЗА 3 — Backend ядро и безопасность
3.1 Создать структуру Core-проекта:
/Core
/Modules
/Infrastructure
/WebAPI
Создать базовый Program.cs с middleware:
logging
global exception handling
correlation-id
3.2 Настроить JWT + refresh token rotation:
создать контракт, сервисы, middleware
3.3 Создать политику авторизации AdminOnly.
Разделить группы эндпоинтов:
MapGroup("/api/public")
MapGroup("/api/app")
3.4 Настроить базовую валидацию + глобальный exception handling.
Защитить от mass assignment через DTO.
ФАЗА 4 — Механизм модульности на backend
4.1 Создать контракт IModule:
RegisterServices(IServiceCollection)
MapEndpoints(IEndpointRouteBuilder)
Зафиксировать запрет кросс-модульных зависимостей.
4.2 Реализовать автоматическое сканирование модулей:
assembly scanning
extension-метод AddModules
4.3 Создать минимальный каркас модуля TaskTrackerModule (без бизнес-логики).
4.4 Подготовить возможность per-module DbContext / schema (если потребуется в будущем).
ФАЗА 5 — Frontend ядро и плагин-система
5.1 Создать структуру фронтенда:
/src/core
/src/modules
vite.config.ts
tsconfig.json
5.2 Создать Plugin Registry:
контракт объекта module
поля: id, publicPage?, privateApp?, routes?, permissions?
автоматический импорт через import.meta.glob
5.3 Создать глобальный роутинг + ProtectedRoute для /app/* (AdminOnly guard)
5.4 Создать базовое разделение layout: public vs private app
ФАЗА 6 — Механизм добавления нового модуля
6.1 Создать пошаговую инструкцию добавления нового модуля (backend + frontend).
6.2 Реализовать подключение нового модуля на backend:
реализация IModule
автоматическая регистрация
6.3 Реализовать подключение нового модуля на frontend:
размещение в /modules
автоматическая регистрация через registry
6.4 Создать тестовый процесс деплоя нового модуля:
коммит → билд → docker restart → проверка /projects и /app
ФАЗА 7 — Production-grade безопасность
7.1 Защитить от SQLi, XSS, CSRF:
EF Core best practices
CSP
SameSite cookies
antiforgery (при необходимости)
7.2 Защитить от brute-force, IDOR, mass assignment:
rate limiting
ownership checks
строгое маппинг DTO
7.3 Настроить точное время жизни токенов + refresh rotation + HttpOnly + Secure cookie
7.4 Создать audit logging:
таблица
middleware для записи админ-действий
7.5 Настроить propagation Correlation ID: nginx → backend → логи
ФАЗА 8 — Первый реальный модуль (TaskTracker)
8.1 Реализовать backend-часть TaskTracker:
домен
CQRS
валидация
репозитории
DTO
8.2 Реализовать эндпоинты /api/app/tasks/* + ownership checks
8.3 Реализовать frontend-часть TaskTracker:
публичная страница описания
8.4 Реализовать приватный UI TaskTracker + маршруты внутри /app/tasks
ФАЗА 9 — DevOps и финальная проверка
9.1 Создать CI/CD пайплайн:
build backend
build frontend
push images
deploy
разделение окружений (ENV)
9.2 Настроить PostgreSQL backups + health-check эндпоинты (/health, /ready)
9.3 Провести end-to-end проверку архитектуры:
поток запроса
модульная независимость
авторизация
безопасность
