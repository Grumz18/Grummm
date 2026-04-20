import type { Language } from "../types";

type DisciplineIcon = "layout" | "javascript" | "cpp" | "python" | "gamedev" | "robotics";

interface DisciplineItem {
  icon: DisciplineIcon;
  title: { ru: string; en: string };
  tags: { ru: string[]; en: string[] };
}

const DISCIPLINES: DisciplineItem[] = [
  {
    icon: "layout",
    title: { ru: "\u0412\u0435\u0431-\u0432\u0451\u0440\u0441\u0442\u043a\u0430", en: "Web Layout" },
    tags: {
      ru: ["HTML", "CSS", "BEM", "Flexbox", "Grid"],
      en: ["HTML", "CSS", "BEM", "Flexbox", "Grid"]
    }
  },
  {
    icon: "javascript",
    title: { ru: "JavaScript", en: "JavaScript" },
    tags: {
      ru: ["ES2015+", "async/await", "React", "Angular"],
      en: ["ES2015+", "async/await", "React", "Angular"]
    }
  },
  {
    icon: "cpp",
    title: { ru: "C++ \u0438 \u041e\u041e\u041f", en: "C++ and OOP" },
    tags: {
      ru: ["\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b", "SFML", "g++", "Git"],
      en: ["Algorithms", "SFML", "g++", "Git"]
    }
  },
  {
    icon: "python",
    title: { ru: "Python", en: "Python" },
    tags: {
      ru: ["\u0421\u043a\u0440\u0438\u043f\u0442\u044b", "\u0411\u0414", "Telegram-\u0431\u043e\u0442\u044b", "n8n"],
      en: ["Scripts", "Databases", "Telegram bots", "n8n"]
    }
  },
  {
    icon: "gamedev",
    title: { ru: "\u0413\u0435\u0439\u043c\u0434\u0435\u0432", en: "Gamedev" },
    tags: {
      ru: ["Unity", "Unreal 4/5", "Godot", "Construct 3"],
      en: ["Unity", "Unreal 4/5", "Godot", "Construct 3"]
    }
  },
  {
    icon: "robotics",
    title: { ru: "\u0420\u043e\u0431\u043e\u0442\u043e\u0442\u0435\u0445\u043d\u0438\u043a\u0430", en: "Robotics" },
    tags: {
      ru: ["LEGO EV3", "Spike", "Kodu"],
      en: ["LEGO EV3", "Spike", "Kodu"]
    }
  }
];

interface DisciplinesSectionProps {
  language: Language;
}

function renderDisciplineIcon(icon: DisciplineIcon) {
  if (icon === "layout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 9v11" />
      </svg>
    );
  }

  if (icon === "javascript") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M10 9v6c0 1-.8 2-2 2" />
        <path d="M14 13c0 1.5 1 2 2.2 2S19 14.3 19 13" />
      </svg>
    );
  }

  if (icon === "cpp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M9 12h6" />
        <path d="M9 9v6" />
        <path d="M18 10h2" />
        <path d="M18 14h2" />
      </svg>
    );
  }

  if (icon === "python") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="6" rx="2" />
        <rect x="4" y="13" width="16" height="6" rx="2" />
        <circle cx="9" cy="8" r="0.8" />
        <circle cx="15" cy="16" r="0.8" />
      </svg>
    );
  }

  if (icon === "gamedev") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 9h10a4 4 0 0 1 3.6 5.7l-1 2A3 3 0 0 1 17 18h-1.5l-2-2h-3l-2 2H7a3 3 0 0 1-2.6-1.3l-1-2A4 4 0 0 1 7 9Z" />
        <path d="M8.5 13h3" />
        <path d="M10 11.5v3" />
        <circle cx="15.8" cy="12.2" r="0.7" />
        <circle cx="17.6" cy="13.8" r="0.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="12" rx="2" />
      <path d="M9 9h6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="15" cy="20" r="1.5" />
    </svg>
  );
}

export function DisciplinesSection({ language }: DisciplinesSectionProps) {
  return (
    <section className="rs-section">
      <p className="rs-section-label">{language === "ru" ? "\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u044b" : "Disciplines"}</p>
      <h2 className="rs-section-title">
        {language === "ru" ? "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f" : "Learning Program"}
      </h2>

      <div className="rs-disciplines-grid">
        {DISCIPLINES.map((item, index) => (
          <article key={item.title.en} className="rs-discipline-cell">
            <span className={`rs-discipline-icon rs-discipline-icon--${index % 3}`}>
              {renderDisciplineIcon(item.icon)}
            </span>
            <h3>{item.title[language]}</h3>
            <div className="rs-discipline-tags">
              {item.tags[language].map((tag) => (
                <span key={`${item.title.en}-${tag}`} className="rs-discipline-tag">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
