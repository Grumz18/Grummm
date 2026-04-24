import { ProgressiveImage } from "./ProgressiveImage";
import { DisciplinesSection } from "./DisciplinesSection";
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

const STACK_TAGS = {
  ru: [
    "React",
    "PostgreSQL",
    "Docker",
    "CI/CD",
    "LLM workflow",
    "GitHub Org",
    "Linux"
  ],
  en: [
    "React",
    "PostgreSQL",
    "Docker",
    "CI/CD",
    "LLM workflow",
    "GitHub Org",
    "Linux"
  ]
} as const;

const FACTS = {
  ru: [
    { value: "\u041c\u043e\u0441\u043a\u0432\u0430", label: "\u0413\u043e\u0440\u043e\u0434" },
    { value: "2023", label: "\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u044e \u0441" },
    { value: "\u041a\u0410 \u0422\u041e\u041f", label: "\u041c\u0435\u0441\u0442\u043e \u0440\u0430\u0431\u043e\u0442\u044b" },
    { value: "14", label: "\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432" }
  ],
  en: [
    { value: "Moscow", label: "City" },
    { value: "2023", label: "Teaching since" },
    { value: "KA TOP", label: "Workplace" },
    { value: "14", label: "Subjects" }
  ]
} as const;

const PROFILE = {
  ru: {
    title: ["\u0418\u0433\u043e\u0440\u044c", "\u0421\u0435\u0440\u0431\u0443\u043b\u044c"],
    subtitle: "Fullstack-\u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a \u00b7 \u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c \u00b7 \u041c\u043e\u0441\u043a\u0432\u0430"
  },
  en: {
    title: ["Igor", "Serbul"],
    subtitle: "Fullstack developer \u00b7 Teacher \u00b7 Moscow"
  }
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
  const profile = PROFILE[language];

  return (
    <section className="rs-section rs-about">
      <article className="rs-about-card">
        <div className="rs-about-top">
          <div className="rs-about-media">
            {photo ? (
              <ProgressiveImage
                src={photo}
                alt={title}
                loading="lazy"
                wrapperClassName="rs-about-photo-frame"
              />
            ) : (
              <div className="rs-about-photo-fallback">{photoPlaceholder}</div>
            )}
          </div>

          <div className="rs-about-main">
            <p className="rs-about-eyebrow">{language === "ru" ? "\u041e\u0411\u041e \u041c\u041d\u0415 \u00b7 \u041f\u0420\u041e\u0424\u0418\u041b\u042c" : "ABOUT \u00b7 PROFILE"}</p>
            <h2 className="rs-about-title" aria-label={profile.title.join(" ")}>
              {profile.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="rs-about-subtitle">{profile.subtitle}</p>
            <span className="rs-about-divider" aria-hidden="true" />
            <p className="rs-about-text">{text}</p>

            <ul className="rs-about-skills">
              {STACK_TAGS[language].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rs-about-facts">
          {FACTS[language].map((item) => (
            <div key={item.label} className="rs-about-fact">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <DisciplinesSection language={language} showHeading={false} embedded />
      </article>
    </section>
  );
}
