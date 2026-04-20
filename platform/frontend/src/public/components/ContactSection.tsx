import type { Language } from "../types";

interface ContactSectionProps {
  language: Language;
  telegramUrl?: string;
  githubUrl: string;
}

export function ContactSection({ language, telegramUrl, githubUrl }: ContactSectionProps) {
  return (
    <section className="rs-section rs-contact">
      <p className="rs-section-label">{language === "ru" ? "Контакты" : "Contact"}</p>
      <h2 className="rs-section-title">
        {language === "ru" ? "Открыт к сотрудничеству" : "Open for Collaboration"}
      </h2>
      <p className="rs-contact-text">
        {language === "ru"
          ? "Если вы хотите обсудить проект, обучение или интеграцию модулей — напишите в удобный канал."
          : "If you want to discuss a project, training, or module integration, use any convenient channel."}
      </p>

      <div className="rs-contact-actions">
        {telegramUrl ? (
          <a className="rs-btn rs-btn--accent" href={telegramUrl} target="_blank" rel="noreferrer">
            Telegram
          </a>
        ) : null}
        <a className="rs-btn rs-btn--border" href={githubUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </section>
  );
}
