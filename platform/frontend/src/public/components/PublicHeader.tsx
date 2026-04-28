import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { NavLink, useLocation } from "react-router-dom";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import grummmLogo from "../../images/grummmLogo.svg";

const NAV_ITEMS = [
  { to: "/", key: "public.nav.home", end: true },
  { to: "/projects", key: "public.nav.projects", end: false },
  { to: "/posts", key: "public.nav.posts", end: false }
] as const;

const GITHUB_URL = "https://github.com/Grumz18/Grummm";

function GitHubGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" fill="currentColor" />
    </svg>
  );
}

export function PublicHeader() {
  const location = useLocation();
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const nextLanguage = language === "ru" ? "en" : "ru";
  const nextTheme = theme === "dark" ? "light" : "dark";
  const navRef = useRef<HTMLElement | null>(null);
  const navIndicatorRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const navElement = navRef.current;
    const indicatorElement = navIndicatorRef.current;
    if (!navElement || !indicatorElement) {
      return;
    }

    const syncIndicator = () => {
      const activeElement = navElement.querySelector<HTMLAnchorElement>(".rs-nav-pill__link[aria-current='page']");
      if (!activeElement) {
        indicatorElement.style.opacity = "0";
        return;
      }

      indicatorElement.style.opacity = "1";
      gsap.killTweensOf(indicatorElement);
      gsap.to(indicatorElement, {
        x: activeElement.offsetLeft,
        y: activeElement.offsetTop,
        width: activeElement.offsetWidth,
        height: activeElement.offsetHeight,
        duration: 0.46,
        ease: "expo.out",
        overwrite: true,
        force3D: true
      });
    };

    syncIndicator();
    window.addEventListener("resize", syncIndicator);

    const ready = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
    if (ready) {
      void ready.then(() => syncIndicator());
    }

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncIndicator());
      observer.observe(navElement);
      const links = navElement.querySelectorAll<HTMLAnchorElement>(".rs-nav-pill__link");
      for (const link of links) {
        observer.observe(link);
      }
    }

    return () => {
      window.removeEventListener("resize", syncIndicator);
      observer?.disconnect();
      gsap.killTweensOf(indicatorElement);
    };
  }, [location.pathname, language]);

  return (
    <header className="public-header rs-public-header">
      <div className="rs-public-header__inner">
        <NavLink to="/" className="rs-brand" aria-label="Grummm">
          <span className="rs-brand__mark" aria-hidden="true">
            <img src={grummmLogo} alt="" className="rs-brand__image" />
          </span>
          <span className="rs-brand__copy">
            <strong>Grummm</strong>
            <small>{t("public.brand.subtitle", language)}</small>
          </span>
        </NavLink>

        <nav className="rs-nav-pill" aria-label={t("public.nav.primary", language)} ref={navRef}>
          <span aria-hidden="true" className="rs-nav-pill__indicator" ref={navIndicatorRef} />
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? "rs-nav-pill__link is-active" : "rs-nav-pill__link"}
            >
              {t(item.key, language)}
            </NavLink>
          ))}
        </nav>

        <div className="rs-public-actions">
          <button
            type="button"
            className="rs-action-btn rs-action-btn--lang"
            onClick={() => setLanguage(nextLanguage)}
            aria-label={language === "ru" ? "Switch language to English" : "Switch language to Russian"}
            title={nextLanguage.toUpperCase()}
          >
            {language === "ru" ? "RU/EN" : "EN/RU"}
          </button>

          <button
            type="button"
            className="rs-action-btn"
            onClick={() => setTheme(nextTheme)}
            aria-label={theme === "dark" ? t("public.theme.light", language) : t("public.theme.dark", language)}
            title={theme === "dark" ? t("public.theme.light", language) : t("public.theme.dark", language)}
          >
            {theme === "dark" ? "◑" : "○"}
          </button>

          <a
            className="rs-action-btn rs-action-btn--icon"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t("notFound.footerGithubAria", language)}
            title="GitHub"
          >
            <GitHubGlyph />
          </a>
        </div>
      </div>
    </header>
  );
}
