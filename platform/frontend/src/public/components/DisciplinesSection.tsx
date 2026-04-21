import type { Language } from "../types";
import type { IconType } from "react-icons";
import { FaPython } from "react-icons/fa";
import { LuBot, LuGamepad2, LuLayoutGrid } from "react-icons/lu";
import { SiCplusplus, SiJavascript } from "react-icons/si";

interface DisciplineItem {
  icon: IconType;
  title: { ru: string; en: string };
  tags: { ru: string[]; en: string[] };
}

const DISCIPLINES: DisciplineItem[] = [
  {
    icon: LuLayoutGrid,
    title: { ru: "\u0412\u0435\u0431-\u0432\u0451\u0440\u0441\u0442\u043a\u0430", en: "Web Layout" },
    tags: {
      ru: ["HTML", "CSS", "BEM", "Flexbox", "Grid"],
      en: ["HTML", "CSS", "BEM", "Flexbox", "Grid"]
    }
  },
  {
    icon: SiJavascript,
    title: { ru: "JavaScript", en: "JavaScript" },
    tags: {
      ru: ["ES2015+", "async/await", "React", "Angular"],
      en: ["ES2015+", "async/await", "React", "Angular"]
    }
  },
  {
    icon: SiCplusplus,
    title: { ru: "C++ \u0438 \u041e\u041e\u041f", en: "C++ and OOP" },
    tags: {
      ru: ["\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b", "SFML", "g++", "Git"],
      en: ["Algorithms", "SFML", "g++", "Git"]
    }
  },
  {
    icon: FaPython,
    title: { ru: "Python", en: "Python" },
    tags: {
      ru: ["\u0421\u043a\u0440\u0438\u043f\u0442\u044b", "\u0411\u0414", "Telegram-\u0431\u043e\u0442\u044b", "n8n"],
      en: ["Scripts", "Databases", "Telegram bots", "n8n"]
    }
  },
  {
    icon: LuGamepad2,
    title: { ru: "\u0413\u0435\u0439\u043c\u0434\u0435\u0432", en: "Gamedev" },
    tags: {
      ru: ["Unity", "Unreal 4/5", "Godot", "Construct 3"],
      en: ["Unity", "Unreal 4/5", "Godot", "Construct 3"]
    }
  },
  {
    icon: LuBot,
    title: { ru: "\u0420\u043e\u0431\u043e\u0442\u043e\u0442\u0435\u0445\u043d\u0438\u043a\u0430", en: "Robotics" },
    tags: {
      ru: ["LEGO EV3", "Spike", "Kodu"],
      en: ["LEGO EV3", "Spike", "Kodu"]
    }
  }
];

interface DisciplinesSectionProps {
  language: Language;
  showHeading?: boolean;
}

export function DisciplinesSection({ language, showHeading = true }: DisciplinesSectionProps) {
  return (
    <section className="rs-section">
      {showHeading ? (
        <>
          <p className="rs-section-label">{language === "ru" ? "\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u044b" : "Disciplines"}</p>
          <h2 className="rs-section-title">
            {language === "ru" ? "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f" : "Learning Program"}
          </h2>
        </>
      ) : null}

      <div className="rs-disciplines-grid">
        {DISCIPLINES.map((item, index) => {
          const Icon = item.icon;
          return (
            <article key={item.title.en} className="rs-discipline-cell">
              <span className={`rs-discipline-icon rs-discipline-icon--${index % 3}`}>
                <Icon aria-hidden="true" focusable="false" />
              </span>
              <h3>{item.title[language]}</h3>
              <div className="rs-discipline-tags">
                {item.tags[language].map((tag) => (
                  <span key={`${item.title.en}-${tag}`} className="rs-discipline-tag">{tag}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
