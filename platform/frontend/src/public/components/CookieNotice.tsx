import { useEffect, useState } from "react";
import { usePreferences } from "../preferences";

const COOKIE_NOTICE_STORAGE_KEY = "platform.ui.cookie-notice.dismissed.v1";

const copy = {
  ru: {
    eyebrow: "Cookies",
    title: "Сайт использует обязательные cookies",
    description:
      "Grummm использует cookies для CSRF-защиты и сессии входа. Настройки темы и языка сохраняются локально в браузере.",
    accept: "Понятно"
  },
  en: {
    eyebrow: "Cookies",
    title: "This site uses essential cookies",
    description:
      "Grummm uses cookies for CSRF protection and sign-in sessions. Theme and language preferences are stored locally in the browser.",
    accept: "Understood"
  }
} as const;

export function CookieNotice() {
  const { language } = usePreferences();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setVisible(window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== "1");
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "1");
    }

    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  const text = copy[language];

  return (
    <section className="cookie-notice liquid-glass" role="status" aria-live="polite">
      <div className="liquid-glass__sheen" aria-hidden="true" />
      <div className="liquid-glass__grain" aria-hidden="true" />

      <div className="liquid-glass__content cookie-notice__content">
        <div className="cookie-notice__copy">
          <span className="cookie-notice__eyebrow">{text.eyebrow}</span>
          <strong className="cookie-notice__title">{text.title}</strong>
          <p className="cookie-notice__text">{text.description}</p>
        </div>

        <button type="button" className="glass-button cookie-notice__button" onClick={handleDismiss}>
          {text.accept}
        </button>
      </div>
    </section>
  );
}
