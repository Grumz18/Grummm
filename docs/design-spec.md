# Grummm — Дизайн-спецификация для реализации
> Точные значения из утверждённого прототипа `Grummm Redesign.html`.
> Цель: реализовать публичную часть сайта максимально близко к прототипу.

---

## 1. Типографика

**Шрифты** — подключить через Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
```

| Роль | Шрифт | Размер | Вес | Особенности |
|------|-------|--------|-----|-------------|
| Основной текст | IBM Plex Sans | 14–16px | 400 | line-height: 1.65 |
| Заголовок H1 | IBM Plex Sans | clamp(36px, 5.5vw, 68px) | 700 | letter-spacing: -0.03em, line-height: 1.06 |
| Заголовок H2 (секции) | IBM Plex Sans | clamp(26px, 3.5vw, 38px) | 700 | letter-spacing: -0.025em, line-height: 1.1 |
| Заголовок карточки | IBM Plex Sans | 16px | 600 | letter-spacing: -0.01em, line-height: 1.35 |
| Мелкий текст / muted | IBM Plex Sans | 13.5–15px | 400 | color: muted |
| Метки секций / бейджи / теги | IBM Plex Mono | 11px | 400–500 | text-transform: uppercase, letter-spacing: 0.08em |
| Даты / метаданные | IBM Plex Mono | 11px | 400 | color: faint |
| CTA ссылки в карточках | IBM Plex Mono | 12px | 500 | — |
| Кнопки | IBM Plex Sans | 13–15px | 500–600 | — |

**Правило:** IBM Plex Mono используется только для меток, тегов, дат, кода и технических строк. Весь остальной текст — IBM Plex Sans.

---

## 2. Цвета

### Светлая тема (light) — основная

```ts
const light = {
  bg:        '#fafaf8',          // фон страницы (тёплый белый)
  bgS:       '#f3f3f0',          // фон секций (surface)
  bgC:       '#ffffff',          // фон карточек
  border:    '#e4e4df',          // все границы
  text:      '#18181b',          // основной текст
  muted:     '#69697a',          // вторичный текст
  faint:     '#b0b0be',          // третичный текст, плейсхолдеры

  // Акцент (зависит от accentHue, по умолчанию hue=225 — синий)
  accent:    'oklch(0.5 0.17 225)',
  accentBg:  'oklch(0.95 0.04 225)',
  accentT:   'oklch(0.45 0.17 225)',

  // Теги / чипы
  tag:       '#ededea',
  tagT:      '#52525e',

  // Навбар
  nav:       'rgba(250,250,248,0.88)',  // + backdrop-filter: blur(14px)

  // Hover состояние карточки
  cardHov:   '#f7f7f4',
  shadow:    '0 4px 20px rgba(0,0,0,0.07)',

  // Бейдж Kind=Post (зелёный)
  kindPost:    'oklch(0.46 0.13 160)',
  kindPostBg:  'oklch(0.94 0.04 160)',

  // Бейдж Kind=Project (синий)
  kindProject:    'oklch(0.46 0.13 220)',
  kindProjectBg:  'oklch(0.94 0.04 220)',

  // Бейдж Visibility=Demo (оранжевый)
  demoBadge:    'oklch(0.5 0.14 40)',
  demoBadgeBg:  'oklch(0.95 0.05 40)',
}
```

### Тёмная тема (dark)

```ts
const dark = {
  bg:        '#0e0e11',
  bgS:       '#15151a',
  bgC:       '#1c1c22',
  border:    '#28282f',
  text:      '#e8e8f0',
  muted:     '#7878a0',
  faint:     '#44445a',

  accent:    'oklch(0.63 0.17 225)',
  accentBg:  'oklch(0.2 0.07 225)',
  accentT:   'oklch(0.63 0.17 225)',

  tag:       '#22222c',
  tagT:      '#9898c0',

  nav:       'rgba(14,14,17,0.88)',
  cardHov:   '#202028',
  shadow:    '0 4px 20px rgba(0,0,0,0.4)',

  kindPost:    'oklch(0.63 0.14 160)',
  kindPostBg:  'oklch(0.2 0.06 160)',
  kindProject:    'oklch(0.63 0.14 220)',
  kindProjectBg:  'oklch(0.2 0.06 220)',
  demoBadge:    'oklch(0.63 0.15 40)',
  demoBadgeBg:  'oklch(0.2 0.07 40)',
}
```

### Акцентные точки дисциплин (три цвета, чередуются по индексу)

```ts
const disciplineAccents = [
  'oklch(0.52 0.14 250)',  // синий
  'oklch(0.52 0.14 165)',  // зелёный
  'oklch(0.52 0.14 35)',   // оранжевый
]
// index % 3 → выбор цвета
```

---

## 3. Пространство и сетка

```
maxWidth контента:   1120px, margin: 0 auto, padding: 0 24px
Высота навбара:      54px
Отступ страницы от навбара (padding-top hero): 104px
Отступы секций:      padding: 72px 24px
gap карточек:        14px
gap тегов:           5–6px
border-radius карточки: 10px
border-radius кнопок:   8px
border-radius чипов/тегов: 4px
border-radius pill-навигации: 999px
border-radius дисциплин-сетки: 12px (на контейнере)
```

---

## 4. Компоненты

### 4.1 Логотип

SVG шестиугольник `viewBox="0 0 100 100"`:
```svg
<polygon points="50,4 94,28 94,72 50,96 6,72 6,28"
  stroke={accentColor} stroke-width="6" fill="none"/>
<text x="50" y="67" text-anchor="middle"
  font-family="IBM Plex Sans" font-weight="700" font-size="46"
  fill={accentColor}>G</text>
```
Рядом с логотипом:
- "Grummm" — 14px, weight 700, letter-spacing -0.02em
- "Платформа модулей" — 9.5px, IBM Plex Mono, color: muted, margin-top: 2px

---

### 4.2 Навигация (sticky)

```
position: fixed, top: 0, height: 54px
background: nav (rgba с blur)
backdrop-filter: blur(14px)
border-bottom: 1px solid border
z-index: 100
```

**Структура строки:**
```
[Логотип]   [Pill с пунктами меню]   [EN/RU | ◑/○ | GitHub]
```

**Pill (центр):**
```
background: bgS
border: 1px solid border
border-radius: 999px
padding: 3px 5px
```

Каждый пункт:
```
padding: 5px 14px
border-radius: 999px
font-size: 13px, weight 500
color: muted по умолчанию
hover → background: bgC, color: text
transition: all 0.15s
```

**Кнопки справа:**
```
RU/EN: background bgS, border 1px solid border, border-radius 6px,
       padding 4px 10px, font IBM Plex Mono, 12px, color muted

Тема ◑/○: 32×28px, border-radius 6px, background bgS

GitHub: 32×28px SVG иконка, border-radius 6px, background bgS
```

---

### 4.3 Метка секции

Паттерн, повторяющийся перед каждым H2:
```
font-family: IBM Plex Mono
font-size: 11px
color: muted
text-transform: uppercase
letter-spacing: 0.08em
margin-bottom: 10px
```

---

### 4.4 ContentCard (карточка ProjectPost)

```
background: bgC
border: 1px solid border
border-radius: 10px
padding: 22px
display: flex, flex-direction: column, gap: 12px
transition: background 0.15s, box-shadow 0.15s
hover → background: cardHov, box-shadow: shadow
```

**Внутри (сверху вниз):**

1. **Строка бейджей:**
   - Бейдж Kind: `Пост` (kindPost/kindPostBg) или `Проект` (kindProject/kindProjectBg)
   - Бейдж Demo: `▶ Демо` (demoBadge/demoBadgeBg) — только если `visibility=Demo` или `publicDemoEnabled=true`
   - Дата справа: IBM Plex Mono 11px, color faint, `margin-left: auto`

2. **Заголовок:** 16px, weight 600, letter-spacing -0.01em, line-height 1.35

3. **Описание:** 13.5px, color muted, line-height 1.6

4. **Topics:** flex wrap, gap 6px, теги (тип Tag)

5. **CTA строка** (border-top 1px border, padding-top 4px):
   - Если Demo → `▶ Открыть демо`, color demoBadge
   - Если Post → `Читать →`, color accent
   - Если Project → `Смотреть →`, color accent
   - Все: IBM Plex Mono, 12px, weight 500

**Бейдж (общий паттерн тегов):**
```
font-family: IBM Plex Mono
font-size: 11px
padding: 3px 8px
border-radius: 4px
background + color по типу
```

---

### 4.5 Фильтр контент-фида

**Kind-фильтр** (кнопки "Все / Проекты / Посты"):
```
border-radius: 999px
padding: 5px 14px
font-size: 13px, weight 500

Активная: background accent, color #fff, border accent
Неактивная: background tag, color tagT, border border
transition: all 0.15s
```

**Topic-фильтр** (чипы):
```
font-family: IBM Plex Mono, font-size: 11px
border-radius: 4px
padding: 3px 8px

Активный: background accentBg, color accentT, border 1px solid accent
Неактивный: background tag, color tagT, border transparent
transition: all 0.12s
```

---

### 4.6 Секция дисциплин — сетка

Контейнер:
```
display: grid
grid-template-columns: repeat(auto-fill, minmax(270px, 1fr))
gap: 0 (не gap! — границы через border на ячейках)
border: 1px solid border
border-radius: 12px
overflow: hidden
```

Каждая ячейка:
```
padding: 24px 22px
border-right: 1px solid border
border-bottom: 1px solid border
background: bgS по умолчанию
hover → background: bgC
transition: background 0.15s
```

Внутри ячейки:
```
• Цветная точка 8×8px, border-radius 50%, margin-bottom: 14px
  (цвет из disciplineAccents[col])
• Название: 15px, weight 600, margin-bottom: 10px
• Теги: flex wrap, gap 5px
```

---

### 4.7 Hero

```
padding-top: 104px (от навбара)
padding-bottom: 72px
```

**Лейбл с точками:**
```
3 круга 7×7px: kindPost, accent, demoBadge
+ текст IBM Plex Mono 11px, uppercase, muted, margin-left 6px
```

**H1:** `clamp(36px, 5.5vw, 68px)`, weight 700, letter-spacing -0.03em
Вторая строка: `color: accent`

**Подзаголовок:** 17px, color muted, line-height 1.65, max-width 540px

**Кнопки:**
```
Основная: background accent, color #fff, border-radius 8px, padding 11px 22px, 14px 600
Вторичная: border 1px solid border, border-radius 8px, padding 11px 22px, 14px 500
```

**Лента последних материалов:**
```
border-top: 1px solid border, padding-top: 40px, margin-top: 56px

Каждая строка: display grid, grid-template-columns: 90px auto 1fr auto
gap: 16px, padding: 13px 0, border-bottom: 1px solid border

Колонки: дата (mono faint) | бейдж Kind | название (hover → accent) | бейдж Demo
```

---

### 4.8 Секция About — двухколоночная сетка

```
display: grid
grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr)
gap: 64px
align-items: start
```

**Список навыков:**
```
▸  (IBM Plex Mono 10px, accent) + текст 14px color muted
gap между пунктами: 7px
```

**Карточка с быстрыми фактами:**
```
display: grid, grid-template-columns: 1fr 1fr, gap: 0
border: 1px solid border, border-radius: 10px, overflow: hidden
Каждая ячейка: padding 16px 18px, border-right + border-bottom
Число: 22px weight 700, letter-spacing -0.02em
Подпись: IBM Plex Mono 11px, color muted, margin-top 3px
```

---

### 4.9 Кнопки (общий паттерн)

```
Accent (основная):
  background: accent, color: #fff
  border: none, border-radius: 8px
  padding: 11–13px 22–24px
  font-weight: 600

Border (вторичная):
  background: none, color: text
  border: 1px solid border, border-radius: 8px
  padding: 11–13px 22–24px
  font-weight: 500

С иконкой: display inline-flex, align-items center, gap 8px
```

---

## 5. Переходы и анимация

```
Всё взаимодействие: transition: all/background/color 0.15s
Карточки: transition: background 0.15s, box-shadow 0.15s
Быстрые переходы: 0.12s для мелких чипов
Смена темы: transition: background 0.2s, color 0.2s на root-элементе
```

**Правило:** никаких transform-анимаций, параллакса, fade-in при скролле. Только hover-состояния через transition.

---

## 6. Структура страниц

### `/` — Главная

1. Hero (лейбл + H1 + sub + кнопки + лента последних)
2. Disciplines (программа обучения)
3. Content (фид ProjectPost с фильтрами)
4. About
5. Contact
6. Footer

### `/projects` и `/posts`

Переиспользуют те же компоненты. `/projects` показывает все Kind=Project, `/posts` — все Kind=Post. Оба имеют topic-фильтр.

### `/projects/:id` и `/posts/:id`

Детальная страница. Внизу — Related entries через `ContentCard`.

---

## 7. Персистентность темы и языка

```ts
// При инициализации
const savedTheme = localStorage.getItem('grummm-theme') ?? 'light'
const savedLang  = localStorage.getItem('grummm-lang')  ?? 'ru'
const savedHue   = localStorage.getItem('grummm-hue')   ?? '225'

// При изменении — сохранять в localStorage
```

---

## 8. GitHub SVG иконка

```jsx
<svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
</svg>
```

---

## 9. Что намеренно отсутствует

- Градиенты — нигде
- Скругления больше 12px (только pill = 999px)
- Тени кроме cardHov shadow
- Анимации при скролле (scroll-triggered)
- Иконки из icon-библиотек — только SVG вручную где нужно
- Цветные фоны секций кроме bgS / bgC / bg
- Любые декоративные элементы, иллюстрации, emoji

---

## 10. Итоговый CSS reset (минимум)

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'IBM Plex Sans', sans-serif; }
```
