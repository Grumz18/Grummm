import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { NavLink, useLocation } from "react-router-dom";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import grummmLogo from "../../images/grummmLogo.svg";

const NAV_ITEMS = [
  { to: "/", key: "public.nav.home", end: true },
  { to: "/projects", key: "public.nav.projects" },
  { to: "/posts", key: "public.nav.posts" }
] as const;

function ThemeGlyph({ theme }: { theme: "light" | "dark" }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.8 3.5A8.8 8.8 0 1 0 20.5 15a7.2 7.2 0 1 1-5.7-11.5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2.5v2.4" />
        <path d="M12 19.1v2.4" />
        <path d="M2.5 12h2.4" />
        <path d="M19.1 12h2.4" />
        <path d="m5.3 5.3 1.7 1.7" />
        <path d="m17 17 1.7 1.7" />
        <path d="m18.7 5.3-1.7 1.7" />
        <path d="M7 17 5.3 18.7" />
      </g>
    </svg>
  );
}

function LanguageGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.9 12h16.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 3.6c2.4 2.2 3.8 5.2 3.8 8.4s-1.4 6.2-3.8 8.4c-2.4-2.2-3.8-5.2-3.8-8.4S9.6 5.8 12 3.6Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PublicHeader() {
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const navIndicatorRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = navIndicatorRef.current;
    if (!nav || !indicator) {
      return;
    }

    function syncIndicator() {
      const activeLink = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!activeLink) {
        indicator.style.opacity = "0";
        return;
      }

      indicator.style.opacity = "1";
      gsap.killTweensOf(indicator);
      gsap.to(indicator, {
        x: activeLink.offsetLeft,
        y: activeLink.offsetTop,
        width: activeLink.offsetWidth,
        height: activeLink.offsetHeight,
        duration: 0.46,
        ease: "expo.out",
        overwrite: true,
        force3D: true
      });
    }

    syncIndicator();
    window.addEventListener("resize", syncIndicator);
    return () => window.removeEventListener("resize", syncIndicator);
  }, [location.pathname, language, menuOpen]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const nextLanguage = language === "ru" ? "en" : "ru";

  return (
    <header className="public-header">
      <div className="public-header__shell liquid-glass">
        <div className="liquid-glass__sheen" aria-hidden="true" />
        <div className="liquid-glass__grain" aria-hidden="true" />
        <div className="liquid-glass__content public-header__content">
          <NavLink to="/" className="public-brand">
            <span className="public-brand__mark">
              <img src={grummmLogo} alt="" className="public-brand__mark-image" />
            </span>
            <span className="public-brand__copy">
              <strong>Grummm</strong>
              <small>{t("public.brand.subtitle", language)}</small>
            </span>
          </NavLink>

          <button
            type="button"
            data-gsap-button
            className={`public-menu-toggle ${menuOpen ? "is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="public-navigation"
            aria-label={menuOpen ? t("public.menu.close", language) : t("public.menu.open", language)}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`public-header__panel ${menuOpen ? "is-open" : ""}`}>
            <nav
              ref={navRef}
              id="public-navigation"
              className="public-nav liquid-glass"
              aria-label={t("public.nav.primary", language)}
            >
              <div ref={navIndicatorRef} className="public-nav__indicator" aria-hidden="true" />
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} data-gsap-button>
                  <span className="public-nav__label">{t(item.key, language)}</span>
                </NavLink>
              ))}
            </nav>

            <div className="public-header__actions" aria-label={t("public.nav.primary", language)}>
              <button
                type="button"
                className="public-header__action-button"
                data-gsap-button
                aria-label={language === "ru" ? "Switch language to English" : "Switch language to Russian"}
                title={nextLanguage.toUpperCase()}
                onClick={() => setLanguage(nextLanguage)}
              >
                <span className="public-header__action-glyph"><LanguageGlyph /></span>
                <span className="public-header__action-code">{language.toUpperCase()}</span>
              </button>

              <button
                type="button"
                className="public-header__action-button"
                data-gsap-button
                aria-label={theme === "dark" ? t("public.theme.light", language) : t("public.theme.dark", language)}
                title={theme === "dark" ? t("public.theme.light", language) : t("public.theme.dark", language)}
                onClick={() => setTheme(nextTheme)}
              >
                <span className="public-header__action-glyph"><ThemeGlyph theme={theme} /></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}