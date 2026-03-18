import { useNavigate } from "react-router-dom";
import { LandingAboutSection } from "../components/LandingAboutSection";
import { LandingHeroSection } from "../components/LandingHeroSection";
import { PortfolioSection } from "../components/PortfolioSection";
import { useLandingContent } from "../data/landing-content-store";
import { isPortfolioPost, isPortfolioProject, useProjectPosts } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

function fallback(value: string | undefined, next: string): string {
  return value && value.trim().length > 0 ? value : next;
}

const HERO_HIGHLIGHTS = ["Modular Monolith", "Plugin Runtime", "Admin Workspace"];

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, language } = usePreferences();
  const projects = useProjectPosts();
  const landingContent = useLandingContent();

  const featuredPosts = projects.filter(isPortfolioPost).slice(0, 3);
  const featuredProjects = projects.filter(isPortfolioProject).slice(0, 3);

  const heroEyebrow = fallback(landingContent.heroEyebrow[language], t("landing.hero.fallbackEyebrow", language));
  const heroTitle = fallback(landingContent.heroTitle[language], t("landing.hero.fallbackTitle", language));
  const heroDescription = fallback(landingContent.heroDescription[language], t("landing.hero.fallbackDescription", language));
  const aboutTitle = fallback(landingContent.aboutTitle[language], t("landing.about.fallbackTitle", language));
  const aboutText = fallback(landingContent.aboutText[language], t("landing.about.fallbackText", language));
  const portfolioTitle = fallback(landingContent.portfolioTitle[language], t("landing.about.fallbackPortfolioTitle", language));
  const portfolioText = fallback(landingContent.portfolioText[language], t("landing.about.fallbackPortfolioText", language));

  const seoTitle = language === "ru"
    ? "Grummm: \u043f\u043e\u0441\u0442\u044b, \u043f\u0440\u043e\u0435\u043a\u0442\u044b \u0438 \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u044b\u0435 \u0434\u0435\u043c\u043e"
    : "Grummm: posts, projects and runtime demos";
  const seoDescription = language === "ru"
    ? "Grummm \u2014 \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u0430\u044f \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u0441 \u043f\u043e\u0441\u0442\u0430\u043c\u0438, \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u043c\u0438, \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u044b\u043c\u0438 \u0434\u0435\u043c\u043e, \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u043e\u0439 \u0438 \u0437\u0430\u0449\u0438\u0449\u0451\u043d\u043d\u043e\u0439 \u0430\u0434\u043c\u0438\u043d\u043a\u043e\u0439 \u0434\u043b\u044f \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432\u044b\u0445 \u043a\u043e\u043c\u0430\u043d\u0434."
    : "Grummm is a modular platform for posts, projects, runtime demos, analytics, and a secure admin workspace for product teams.";
  const seoKeywords = language === "ru"
    ? "grummm, \u043f\u043e\u0441\u0442\u044b, \u043f\u0440\u043e\u0435\u043a\u0442\u044b, \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u044b\u0435 \u0434\u0435\u043c\u043e, \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u0430\u044f \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430, \u0430\u0434\u043c\u0438\u043d\u043a\u0430, \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430"
    : "grummm, posts, projects, runtime demos, modular platform, admin workspace, analytics";

  useDocumentMetadata({
    title: seoTitle,
    description: seoDescription,
    path: "/",
    language,
    keywords: seoKeywords
  });

  return (
    <section className="landing-page">
      <LandingHeroSection
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        highlightsLabel={t("landing.hero.highlights", language)}
        highlights={HERO_HIGHLIGHTS}
        language={language}
        onOpenProjects={() => navigate("/projects")}
        onOpenAdmin={() => navigate("/login")}
        openProjectsLabel={t("landing.hero.openProjects", language)}
        openAdminLabel={t("landing.hero.openAdmin", language)}
      />

      <PortfolioSection
        eyebrow="Curated posts"
        title={t("landing.posts.title", language)}
        description={t("landing.posts.description", language)}
        items={featuredPosts}
        theme={theme}
        language={language}
        resolveHref={(projectId) => `/posts/${projectId}`}
        placeholderCount={3}
      />

      <PortfolioSection
        eyebrow="Runtime-ready modules"
        title={t("landing.projects.title", language)}
        description={t("landing.projects.description", language)}
        items={featuredProjects}
        theme={theme}
        language={language}
        resolveHref={(projectId) => `/projects/${projectId}`}
        placeholderCount={3}
      />

      <LandingAboutSection
        eyebrow={t("landing.about.eyebrow", language)}
        title={aboutTitle}
        intro={aboutText}
        portfolioTitle={portfolioTitle}
        portfolioText={portfolioText}
        photo={landingContent.aboutPhoto}
        photoPlaceholder={t("landing.about.photoPlaceholder", language)}
      />
    </section>
  );
}
