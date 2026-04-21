import { FaGithub, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import type { Language } from "../types";

interface ContactSectionProps {
  language: Language;
  telegramUrl?: string;
  whatsappUrl?: string;
  gmailUrl?: string;
  githubUrl: string;
}

export function ContactSection({ language, telegramUrl, whatsappUrl, gmailUrl, githubUrl }: ContactSectionProps) {
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
        {whatsappUrl ? (
          <a className="rs-btn rs-btn--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
            <FaWhatsapp className="rs-btn__icon" aria-hidden="true" />
            WhatsApp
          </a>
        ) : null}
        {telegramUrl ? (
          <a className="rs-btn rs-btn--accent" href={telegramUrl} target="_blank" rel="noreferrer">
            <FaTelegramPlane className="rs-btn__icon" aria-hidden="true" />
            Telegram
          </a>
        ) : null}
        {gmailUrl ? (
          <a className="rs-btn rs-btn--gmail" href={gmailUrl} target="_blank" rel="noreferrer">
            <SiGmail className="rs-btn__icon" aria-hidden="true" />
            Gmail
          </a>
        ) : null}
        <a className="rs-btn rs-btn--border" href={githubUrl} target="_blank" rel="noreferrer">
          <FaGithub className="rs-btn__icon" aria-hidden="true" />
          GitHub
        </a>
      </div>
    </section>
  );
}
