import { ProgressiveImage } from "./ProgressiveImage";
import type { Language } from "../types";

interface AboutSectionProps {
  language: Language;
  title: string;
  subtitle: string;
  text: string;
  portfolioTitle: string;
  portfolioText: string;
  photo?: string;
  photoPlaceholder: string;
  telegramUrl?: string;
  githubUrl: string;
}

const SKILLS = {
  ru: ["Frontend и UI", "Backend и API", "Проектирование архитектуры", "Запуск и сопровождение"],
  en: ["Frontend and UI", "Backend and API", "Architecture design", "Delivery and support"]
} as const;

const FACTS = {
  ru: [
    { value: "2018", label: "Старт преподавания" },
    { value: "6+", label: "Дисциплин" },
    { value: "1", label: "Академия" },
    { value: "Online", label: "Формат" }
  ],
  en: [
    { value: "2018", label: "Teaching since" },
    { value: "6+", label: "Disciplines" },
    { value: "1", label: "Academy" },
    { value: "Online", label: "Format" }
  ]
} as const;

export function AboutSection({
  language,
  title,
  subtitle,
  text,
  portfolioTitle,
  portfolioText,
  photo,
  photoPlaceholder,
  telegramUrl,
  githubUrl
}: AboutSectionProps) {
  return (
    <section className="rs-section rs-about">
      <p className="rs-section-label">{language === "ru" ? "Обо мне" : "About"}</p>
      <div className="rs-about-grid">
        <div className="rs-about-main">
          <h2 className="rs-section-title">{title}</h2>
          <p>{subtitle}</p>
          <p>{text}</p>
          <p><strong>{portfolioTitle}:</strong> {portfolioText}</p>

          <ul className="rs-about-skills">
            {SKILLS[language].map((item) => (
              <li key={item}><span>▸</span>{item}</li>
            ))}
          </ul>

          <div className="rs-about-actions">
            {telegramUrl ? (
              <a className="rs-btn rs-btn--accent" href={telegramUrl} target="_blank" rel="noreferrer">
                Telegram
              </a>
            ) : null}
            <a className="rs-btn rs-btn--border" href={githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>

        <aside className="rs-about-side">
          {photo ? (
            <ProgressiveImage
              src={photo}
              alt={title}
              loading="lazy"
              wrapperClassName="rs-about-photo-placeholder"
            />
          ) : (
            <div className="rs-about-photo-placeholder">{photoPlaceholder}</div>
          )}

          <div className="rs-about-facts">
            {FACTS[language].map((item) => (
              <div key={item.label} className="rs-about-fact">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
