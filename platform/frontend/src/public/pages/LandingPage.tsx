import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AboutSection } from "../components/AboutSection";
import { ContactSection } from "../components/ContactSection";
import { ContentFeed, type KindFilterValue } from "../components/ContentFeed";
import { DisciplinesSection } from "../components/DisciplinesSection";
import { useLandingContent } from "../data/landing-content-store";
import { formatPublishedDate } from "../formatPublishedDate";
import {
  getPortfolioKind,
  getPublicEntryPath,
  isPortfolioPublicDemoEnabled,
  isPortfolioPubliclyVisible,
  useProjectPosts
} from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

const GITHUB_URL = "https://github.com/Grumz18/Grummm";

function sortByPublishedDesc<T extends { publishedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return right - left;
  });
}

function fallback(value: string | undefined, next: string): string {
  return value && value.trim().length > 0 ? value : next;
}

function splitHeroTitle(title: string): { main: string; accent?: string } {
  const separators = [" — ", " – ", " - "];
  for (const separator of separators) {
    if (title.includes(separator)) {
      const [main, ...rest] = title.split(separator);
      const accent = rest.join(separator).trim();
      if (main.trim().length > 0 && accent.length > 0) {
        return { main: main.trim(), accent };
      }
    }
  }
  return { main: title };
}

export function LandingPage() {
  const { language } = usePreferences();
  const landingContent = useLandingContent();
  const allItems = useProjectPosts().filter(isPortfolioPubliclyVisible);
  const latestItems = useMemo(() => sortByPublishedDesc(allItems).slice(0, 3), [allItems]);
  const sortedItems = useMemo(() => sortByPublishedDesc(allItems), [allItems]);
  const [kind, setKind] = useState<KindFilterValue>("all");
  const [topic, setTopic] = useState<string | null>(null);

  const telegramUrl = typeof import.meta.env.VITE_PUBLIC_TELEGRAM_URL === "string"
    ? import.meta.env.VITE_PUBLIC_TELEGRAM_URL.trim()
    : undefined;

  const heroEyebrow = fallback(landingContent.heroEyebrow[language], t("landing.hero.fallbackEyebrow", language));
  const heroTitle = fallback(landingContent.heroTitle[language], t("landing.hero.fallbackTitle", language));
  const heroDescription = fallback(landingContent.heroDescription[language], t("landing.hero.fallbackDescription", language));
  const aboutTitle = fallback(landingContent.aboutTitle[language], t("landing.about.fallbackTitle", language));
  const aboutSubtitle = fallback(
    landingContent.aboutSubtitle[language],
    language === "ru" ? "Что я делаю" : t("landing.about.fallbackSubtitle", language)
  );
  const aboutText = fallback(landingContent.aboutText[language], t("landing.about.fallbackText", language));
  const portfolioTitle = fallback(landingContent.portfolioTitle[language], t("landing.about.fallbackPortfolioTitle", language));
  const portfolioText = fallback(landingContent.portfolioText[language], t("landing.about.fallbackPortfolioText", language));
  const parsedHeroTitle = splitHeroTitle(heroTitle);

  const title = language === "ru"
    ? "Grummm: посты, проекты и модульные демо"
    : "Grummm: posts, projects and runtime demos";
  const description = language === "ru"
    ? "Grummm — модульная платформа с постами, проектами, демо, аналитикой и защищенной админ-зоной."
    : "Grummm is a modular platform for posts, projects, runtime demos, analytics, and a secure admin workspace.";

  useDocumentMetadata({
    title,
    description,
    path: "/",
    language,
    keywords: language === "ru"
      ? "grummm, проекты, посты, демо, обучение, разработка"
      : "grummm, projects, posts, demos, learning, development"
  });

  return (
    <section className="rs-landing-page">
      <section className="rs-hero">
        <div className="rs-hero__top">
          <div className="rs-hero__content">
            <p className="rs-hero__label">
              <span className="rs-hero__dot rs-hero__dot--post" />
              <span className="rs-hero__dot rs-hero__dot--accent" />
              <span className="rs-hero__dot rs-hero__dot--demo" />
              <span>{heroEyebrow}</span>
            </p>

            <h1 className="rs-hero__title">
              {parsedHeroTitle.main}
              {parsedHeroTitle.accent ? (
                <>
                  <br />
                  <span>{parsedHeroTitle.accent}</span>
                </>
              ) : null}
            </h1>

            <p className="rs-hero__subtitle">{heroDescription}</p>

            <div className="rs-hero__actions">
              <Link className="rs-btn rs-btn--accent" to="/projects">
                {t("landing.hero.openProjects", language)}
              </Link>
              <a className="rs-btn rs-btn--border" href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>

          <aside className="rs-hero__scene" aria-hidden="true">
            <div className="rs-hero__scene-stage" data-gsap-hero-parallax>
              <div className="rs-hero__scene-glow" />
              <div className="rs-hero__scene-cube" />
              <div className="rs-hero__scene-spark rs-hero__scene-spark--one" />
              <div className="rs-hero__scene-spark rs-hero__scene-spark--two" />
              <div className="rs-hero__scene-spark rs-hero__scene-spark--three" />
              <div className="rs-hero__scene-spark rs-hero__scene-spark--four" />
            </div>
          </aside>
        </div>

        <div className="rs-hero__latest">
          {latestItems.map((item) => {
            const itemKind = getPortfolioKind(item);
            return (
              <Link key={item.id} className="rs-latest-row" to={getPublicEntryPath(item)}>
                <span className="rs-latest-row__date">{formatPublishedDate(item.publishedAt, language) ?? "—"}</span>
                <span className={`rs-latest-row__kind ${itemKind === "post" ? "is-post" : "is-project"}`}>
                  {itemKind === "post" ? (language === "ru" ? "Пост" : "Post") : (language === "ru" ? "Проект" : "Project")}
                </span>
                <span className="rs-latest-row__title">{item.title[language] || item.title.en || item.id}</span>
                {isPortfolioPublicDemoEnabled(item) ? (
                  <span className="rs-latest-row__demo">{language === "ru" ? "▶ Демо" : "▶ Demo"}</span>
                ) : (
                  <span className="rs-latest-row__demo" />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <DisciplinesSection language={language} />

      <section className="rs-section">
        <p className="rs-section-label">{language === "ru" ? "Контент" : "Content"}</p>
        <h2 className="rs-section-title">
          {language === "ru" ? "Материалы платформы" : "Platform materials"}
        </h2>
        <ContentFeed
          language={language}
          items={sortedItems}
          kind={kind}
          topic={topic}
          onKindChange={(next) => setKind(next)}
          onTopicToggle={(nextTopic) => setTopic((current) => (current === nextTopic ? null : nextTopic))}
          emptyMessage={language === "ru" ? "Под выбранные фильтры ничего не найдено." : "No entries match current filters."}
        />
      </section>

      <AboutSection
        language={language}
        title={aboutTitle}
        subtitle={aboutSubtitle}
        text={aboutText}
        portfolioTitle={portfolioTitle}
        portfolioText={portfolioText}
        photo={landingContent.aboutPhoto}
        photoPlaceholder={t("landing.about.photoPlaceholder", language)}
        telegramUrl={telegramUrl}
        githubUrl={GITHUB_URL}
      />

      <ContactSection language={language} telegramUrl={telegramUrl} githubUrl={GITHUB_URL} />
    </section>
  );
}
