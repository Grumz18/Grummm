import type { Language } from "../types";

interface DisciplineItem {
  title: { ru: string; en: string };
  tags: { ru: string[]; en: string[] };
}

const DISCIPLINES: DisciplineItem[] = [
  {
    title: { ru: "Веб-вёрстка", en: "Web Layout" },
    tags: {
      ru: ["HTML", "CSS", "BEM", "Flexbox", "Grid"],
      en: ["HTML", "CSS", "BEM", "Flexbox", "Grid"]
    }
  },
  {
    title: { ru: "JavaScript", en: "JavaScript" },
    tags: {
      ru: ["ES2015+", "async/await", "React", "Angular"],
      en: ["ES2015+", "async/await", "React", "Angular"]
    }
  },
  {
    title: { ru: "C++ и ООП", en: "C++ and OOP" },
    tags: {
      ru: ["Алгоритмы", "SFML", "g++", "Git"],
      en: ["Algorithms", "SFML", "g++", "Git"]
    }
  },
  {
    title: { ru: "Python", en: "Python" },
    tags: {
      ru: ["Скрипты", "БД", "Telegram-боты", "n8n"],
      en: ["Scripts", "Databases", "Telegram bots", "n8n"]
    }
  },
  {
    title: { ru: "Геймдев", en: "Gamedev" },
    tags: {
      ru: ["Unity", "Unreal 4/5", "Godot", "Construct 3"],
      en: ["Unity", "Unreal 4/5", "Godot", "Construct 3"]
    }
  },
  {
    title: { ru: "Робототехника", en: "Robotics" },
    tags: {
      ru: ["LEGO EV3", "Spike", "Kodu"],
      en: ["LEGO EV3", "Spike", "Kodu"]
    }
  }
];

interface DisciplinesSectionProps {
  language: Language;
}

export function DisciplinesSection({ language }: DisciplinesSectionProps) {
  return (
    <section className="rs-section">
      <p className="rs-section-label">{language === "ru" ? "Дисциплины" : "Disciplines"}</p>
      <h2 className="rs-section-title">
        {language === "ru" ? "Программа обучения" : "Learning Program"}
      </h2>

      <div className="rs-disciplines-grid">
        {DISCIPLINES.map((item, index) => (
          <article key={item.title.en} className="rs-discipline-cell">
            <span className={`rs-discipline-dot rs-discipline-dot--${index % 3}`} />
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
