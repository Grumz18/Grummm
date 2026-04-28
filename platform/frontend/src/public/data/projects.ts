import type { PortfolioProject } from "../types";

function svgCard(label: string, start: string, end: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${start}' />
        <stop offset='100%' stop-color='${end}' />
      </linearGradient>
    </defs>
    <rect width='1280' height='720' fill='url(#g)'/>
    <circle cx='1120' cy='140' r='160' fill='${accent}' fill-opacity='0.22'/>
    <circle cx='180' cy='620' r='230' fill='${accent}' fill-opacity='0.18'/>
    <text x='70' y='120' font-family='Segoe UI, Arial, sans-serif' font-size='64' fill='white'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const seedProjects: PortfolioProject[] = [
  {
    id: "grummm-platform",
    kind: "post",
    visibility: "public",
    title: {
      en: "Grummm IT and AI Lab",
      ru: "Grummm: IT и AI лаборатория"
    },
    summary: {
      en: "Editorial overview of the site, project layer, and AI-assisted engineering workflow.",
      ru: "Редакционный обзор сайта, проектного слоя и AI-assisted инженерного workflow."
    },
    description: {
      en: "Grummm connects developer notes, practical guides, AI trend breakdowns, and runtime-ready projects.",
      ru: "Grummm соединяет заметки разработчика, практические гайды, разборы AI-трендов и runtime-проекты."
    },
    publishedAt: "2026-03-16T09:30:00.000Z",
    contentBlocks: [
      {
        id: "intro",
        type: "paragraph",
        content: {
          en: "Grummm combines a public feed, project showcase, secure admin area, and runtime-ready modules. The public side focuses on posts, guides, AI trends, and projects, while the admin workspace controls materials, templates, and publishing.",
          ru: "Grummm объединяет публичную ленту, проектную витрину, защищённую админ-зону и runtime-модули. Публичная часть сфокусирована на постах, гайдах, AI-трендах и проектах, а админка управляет материалами, шаблонами и публикацией."
        }
      },
      {
        id: "architecture-title",
        type: "subheading",
        content: {
          en: "Why projects stay close to posts",
          ru: "Почему проекты остаются рядом с постами"
        }
      },
      {
        id: "architecture-copy",
        type: "paragraph",
        content: {
          en: "Posts explain ideas, guides document repeatable steps, and projects show the result in motion. This structure presents AI expertise through visible engineering artifacts.",
          ru: "Посты объясняют идеи, гайды фиксируют повторяемые шаги, а проекты показывают результат в работе. Такая структура показывает AI-экспертизу через инженерные артефакты."
        }
      }
    ],
    tags: ["AI", "Guides", "Projects", "React", "ASP.NET Core 9", "Docker"],
    heroImage: {
      light: svgCard("IT + AI Lab", "#81A6C6", "#AACDDC", "#F3E3D0"),
      dark: svgCard("IT + AI Lab", "#1C252E", "#2C3B4A", "#81A6C6")
    },
    screenshots: [],
    template: "None"
  },
  {
    id: "task-tracker",
    kind: "project",
    visibility: "public",
    title: {
      en: "Task Tracker",
      ru: "Трекер задач"
    },
    summary: {
      en: "Owner-scoped task board with secure private routes.",
      ru: "Доска задач с приватными маршрутами и owner-логикой."
    },
    description: {
      en: "Task Tracker is a production-oriented module with CQRS handlers, ownership checks, and audit-aware private API endpoints.",
      ru: "Task Tracker показывает production-модуль с CQRS, проверкой владельца и приватными API."
    },
    publishedAt: "2026-03-17T08:00:00.000Z",
    contentBlocks: [],
    tags: ["React", ".NET", "CQRS", "Audit"],
    heroImage: {
      light: svgCard("Task Tracker", "#1795a8", "#3cbf8a", "#f4f1a7"),
      dark: svgCard("Task Tracker", "#0e2f48", "#0b5668", "#f59e0b")
    },
    screenshots: [
      {
        light: svgCard("Create Task", "#28a6b8", "#47ce9a", "#ffe08a"),
        dark: svgCard("Create Task", "#163145", "#0e6478", "#f59e0b")
      },
      {
        light: svgCard("Board View", "#58b8d1", "#75d4ad", "#fff2a4"),
        dark: svgCard("Board View", "#1d374d", "#216975", "#f2b56f")
      }
    ],
    template: "CSharp",
    frontendPath: "/templates/csharp",
    backendPath: "/services/csharp"
  },
  {
    id: "finance-tracker",
    kind: "project",
    visibility: "demo",
    title: {
      en: "Finance Tracker",
      ru: "Финансовый трекер"
    },
    summary: {
      en: "Budget, cashflow and KPI visualization for teams.",
      ru: "Бюджет, cashflow и KPI для команд."
    },
    description: {
      en: "Finance Tracker focuses on monthly planning, variance alerts and compact decision dashboards for operational teams.",
      ru: "Finance Tracker собирает планирование, отклонения и компактные дашборды для команд."
    },
    publishedAt: "2026-03-17T11:15:00.000Z",
    contentBlocks: [],
    tags: ["Analytics", "PostgreSQL", "Dashboard"],
    heroImage: {
      light: svgCard("Finance Tracker", "#eb8d45", "#f2bc61", "#5ca4df"),
      dark: svgCard("Finance Tracker", "#3f2b24", "#6b3f28", "#2d6ea2")
    },
    screenshots: [
      {
        light: svgCard("KPI Tiles", "#ec9952", "#f5c86e", "#5ca4df"),
        dark: svgCard("KPI Tiles", "#4f3026", "#71482f", "#3e80b5")
      },
      {
        light: svgCard("Cashflow", "#f6a85c", "#f8d084", "#69a9df"),
        dark: svgCard("Cashflow", "#543626", "#764d30", "#3f88bb")
      }
    ],
    template: "Static",
    frontendPath: "/templates/static",
    backendPath: "/services/static"
  },
  {
    id: "chat-module",
    kind: "project",
    visibility: "public",
    title: {
      en: "Chat Module",
      ru: "Чат-модуль"
    },
    summary: {
      en: "Fast internal messaging with moderation controls.",
      ru: "Быстрые внутренние сообщения с модерацией."
    },
    description: {
      en: "Chat Module provides low-friction team communication with role-based moderation and a lightweight event stream.",
      ru: "Chat Module даёт role-based модерацию и быстрый событийный поток."
    },
    publishedAt: "2026-03-17T13:45:00.000Z",
    contentBlocks: [],
    tags: ["Realtime", "Moderation", "UX"],
    heroImage: {
      light: svgCard("Chat Module", "#4d92f2", "#57c8e8", "#ffd283"),
      dark: svgCard("Chat Module", "#1e375f", "#18586a", "#f59e0b")
    },
    screenshots: [
      {
        light: svgCard("Rooms", "#519cf2", "#63cbe9", "#ffd283"),
        dark: svgCard("Rooms", "#213b65", "#1b5f71", "#f59e0b")
      },
      {
        light: svgCard("Moderation", "#57a7f4", "#73d1ed", "#ffd89b"),
        dark: svgCard("Moderation", "#24416b", "#21697a", "#f7ac35")
      }
    ],
    template: "JavaScript",
    frontendPath: "/templates/js",
    backendPath: "/services/js"
  }
];
