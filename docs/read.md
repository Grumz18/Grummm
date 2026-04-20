# Промпты для реализации редизайна Grummm
> Для Claude Opus с доступом к файлам проекта. Использовать последовательно.

---

## 0. Стартовый контекст (отправить первым)

```
Прочитай файлы docs/LLM_SYSTEM_STATE.md и ai-context.md — они дадут тебе полный контекст о проекте Grummm.

Затем прочитай файл `Grummm Redesign.html` в корне проекта — это готовый hi-fi прототип нового дизайна.
Он содержит:
- Дизайн-токены (функция `tok(theme, hue)`) — цвета, радиусы, тени для светлой и тёмной темы
- Компонент `ContentCard` — карточка для ProjectPost с бейджами Kind/Visibility/Demo
- Секцию контент-фида с фильтрами по Kind и Topics
- Навигацию, Hero, Disciplines, About, Contact, Footer

Изучи прототип и скажи: понял ли ты дизайн-систему и структуру компонентов. Не делай пока никаких изменений.
```

---

## 1. Дизайн-токены и тема

```
На основе прототипа `Grummm Redesign.html` (функция `tok(theme, hue)`) создай файл дизайн-токенов для фронтенда.

Задача:
1. Создай `platform/frontend/src/shared/theme/tokens.ts` — экспортируй объект с типизированными токенами (light/dark)
2. Создай `platform/frontend/src/shared/theme/ThemeContext.tsx` — React context с `theme`, `accentHue`, `setTheme`, `setAccentHue`, персистентность через localStorage
3. Используй `oklch()` для акцентных цветов как в прототипе — не хардкоди hex для акцентов

Цветовая система из прототипа:
- bg, bgS (surface), bgC (card), border, text, muted, faint
- accent, accentBg, accentT
- kindPost / kindPostBg — для бейджей постов
- kindProject / kindProjectBg — для бейджей проектов  
- demoBadge / demoBadgeBg — для Visibility=Demo

Типы должны соответствовать существующим в `public/types.ts`.
```

---

## 2. Навигация (PublicLayout)

```
Обнови навигацию в `platform/frontend/src/core/` чтобы она соответствовала прототипу `Grummm Redesign.html`.

Найди текущий PublicLayout и его навигационный компонент. Затем:

1. Реализуй pill-навигацию (центрированный контейнер с border-radius: 999px) для пунктов меню
2. Логотип слева: SVG-шестиугольник с буквой G + "Grummm" + подпись "Платформа модулей"
3. Справа: кнопка переключения языка (RU/EN), кнопка темы (◑/○), иконка GitHub
4. Nav должен быть sticky с backdrop-filter: blur(14px)
5. Сохрани существующую логику i18n из `src/shared/`

Шрифт: IBM Plex Sans + IBM Plex Mono — добавь в index.html если ещё нет.
```

---

## 3. Компонент ContentCard

```
Создай компонент `platform/frontend/src/public/components/ContentCard.tsx`.

Он должен отображать один `ProjectPost` и соответствовать карточке из прототипа `Grummm Redesign.html` (компонент `ContentCard`).

Требования:
- Принимает `item: PortfolioProject` из `public/types.ts`
- Показывает бейдж Kind: "Пост" (зелёный) или "Проект" (синий)
- Если `visibility === 'Demo'` или `publicDemoEnabled === true` — бейдж "▶ Демо" (оранжевый) и CTA "▶ Открыть демо"
- Иначе CTA: "Читать →" для Post, "Смотреть →" для Project
- Topics отображаются как теги внизу карточки
- Дата публикации в правом верхнем углу через IBM Plex Mono
- Hover: лёгкое изменение фона + box-shadow
- Используй токены из ThemeContext (задача 1)

Экспортируй как default.
```

---

## 4. Страница контент-фида (Projects + Posts)

```
Обнови или создай страницу-фид на маршруте `/projects` в `platform/frontend/src/public/pages/`.

По прототипу `Grummm Redesign.html` (секция "03 Content"):

1. Загружай все публичные записи через `project-store.ts` (уже есть)
2. Фильтр по Kind: кнопки "Все / Проекты / Посты" — pill-стиль
3. Фильтр по Topics: горизонтальный ряд кнопок-чипов (IBM Plex Mono, 11px)
   - Показывай только топики, которые реально встречаются в загруженных данных
   - Один активный топик сразу, повторный клик снимает фильтр
4. Сетка карточек: `repeat(auto-fill, minmax(300px, 1fr))`, gap 14px
5. State фильтров в URL-параметрах (?kind=post&topic=React) для шаринга

Используй существующий `project-store.ts` — не дублируй логику загрузки.
```

---

## 5. Hero-секция главной страницы

```
Обнови главную страницу `/` (`public/pages/` или аналог).

По прототипу `Grummm Redesign.html` (секция "01 Hero"):

1. Три цветные точки + лейбл "Учусь. Делаю. Преподаю." (IBM Plex Mono, uppercase)
2. H1: "Игорь Сербуль — разработчик и педагог" с акцентным цветом на второй строке
3. Подзаголовок: описание платформы, без агрессивных CTA
4. Кнопки: "Смотреть материалы" (accent) + "GitHub" (border)
5. Лента последних материалов (3 штуки) ниже разделителя:
   - Загрузи из `project-store.ts`, сортируй по `publishedAt` DESC
   - Строки: дата | бейдж Kind | название | бейдж Demo (если есть)
   - Клик → переход на `/projects/:id`

Компонент должен быть client-side (CSR), не SSR.
```

---

## 6. Секция дисциплин

```
Создай компонент `DisciplinesSection` для главной страницы.

По прототипу `Grummm Redesign.html` (секция "02 Disciplines"):

Дисциплины (захардкоди, это статичный контент):
- Веб-вёрстка: HTML, CSS, BEM, Flexbox, Grid
- JavaScript: ES2015+, async/await, React, Angular
- C++ и ООП: Алгоритмы, SFML, g++, Git
- Python: Скрипты, БД, Telegram-боты, n8n
- Геймдев: Unity, Unreal 4/5, Godot, Construct 3
- Робототехника: LEGO EV3, Spike, Kodu

Верстка:
- CSS Grid: `repeat(auto-fill, minmax(270px, 1fr))`
- Ячейки без отдельного gap — единая рамка через border на контейнере + border-right/bottom на ячейках
- Цветная точка сверху (3 цвета чередуются по oklch)
- Hover: смена фона ячейки
- i18n: принимай locale из ThemeContext
```

---

## 7. Страница поста с Related entries

```
Обнови `public/pages/ProjectDetailPage.tsx`.

По прототипу и реальной модели данных:

1. Хлебные крошки: Grummm / Проекты / [название] — используй существующий роутер
2. Бейджи Kind + Visibility вверху
3. Если `publicDemoEnabled === true` — кнопка "▶ Открыть демо" (открывает `/{slug}/viewer/`)
4. Topics как кликабельные теги → переход на `/projects?topic=X`
5. Related entries снизу (уже есть `RelatedEntriesSection`) — оберни в новые стили:
   - Заголовок "Похожие материалы"
   - Горизонтальный scroll на мобиле, сетка на десктопе
   - Используй `ContentCard` из задачи 3

Данные related берутся из `/api/public/projects/{id}/related` — логика уже есть.
```

---

## 8. Секция "Обо мне"

```
Создай компонент `AboutSection` для главной страницы.

По прототипу `Grummm Redesign.html` (секция "04 About"):

Левая колонка:
- Заголовок "Игорь Сербуль"
- Два параграфа текста (о преподавании и о платформе)
- Список навыков со стрелкой ▸ и IBM Plex Mono
- Кнопки: Telegram (accent), GitHub (border)

Правая колонка:
- Placeholder для фото (aspectRatio 3/4, border dashed)
  — оставь возможность легко заменить на <img> позже
- Grid 2×2 с быстрыми фактами: год начала, дисциплин, академия, online

Текст должен передаваться через i18n (ru/en).
Не захардкоживай ссылки на Telegram — используй переменную окружения или props.
```

---

## 9. Проверка и финал

```
Проверь результат всех изменений:

1. Запусти `npm run typecheck --workspace @platform/frontend` — исправь все ошибки типов
2. Проверь что существующие маршруты `/app/*` не затронуты
3. Убедись что темы (light/dark) и смена языка (ru/en) работают глобально
4. Проверь что ContentCard правильно обрабатывает все комбинации:
   - kind=Post, visibility=Public
   - kind=Project, visibility=Public, publicDemoEnabled=false
   - kind=Project, visibility=Demo, publicDemoEnabled=true
5. Проверь адаптивность: минимум 375px ширина (мобиле), 768px (планшет), 1120px+ (десктоп)
6. Запусти `npm run build` — убедись что сборка чистая

Если есть конфликты с существующими стилями — приоритет новым токенам из ThemeContext.
```

---

## Порядок выполнения

```
0 → Контекст
1 → Токены и тема (фундамент для всего)
2 → Навигация
3 → ContentCard (нужен для 4, 5, 7)
4 → Контент-фид
5 → Hero
6 → Дисциплины
7 → Страница поста
8 → About
9 → Проверка
```

---

## Важные ограничения (из architecture-lock.md)

- Не трогать маршруты `/app/*` и `PrivateAppLayout`
- Не изменять API-контракты (`/api/public/*`, `/api/app/*`)
- Не менять модель данных `ProjectPost` на бэкенде
- Публичные маршруты остаются: `/`, `/projects`, `/projects/:id`, `/posts`, `/posts/:id`
- Компонент `RelatedEntriesSection` можно рестайлить, но не переписывать логику
