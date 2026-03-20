import { useNavigate } from "react-router-dom";
import { LiquidGlass } from "../components/LiquidGlass";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { language } = usePreferences();

  useDocumentMetadata({
    title: "404 | Grummm",
    description: t("notFound.description", language),
    path: "/404",
    language,
    keywords: language === "ru" ? "grummm, 404, страница не найдена" : "grummm, 404, page not found",
    robots: "noindex,nofollow,noarchive"
  });

  return (
    <section className="not-found-page" data-gsap="reveal">
      <LiquidGlass as="div" className="project-detail__title-card not-found-page__card">
        <p className="section-heading__eyebrow">{t("notFound.eyebrow", language)}</p>
        <h1>{t("notFound.title", language)}</h1>
        <p className="not-found-page__description">{t("notFound.description", language)}</p>
        <div className="not-found-page__actions">
          <button type="button" className="glass-button" onClick={() => navigate("/")}>
            {t("notFound.backHome", language)}
          </button>
          <button type="button" className="glass-button glass-button--ghost" onClick={() => navigate("/projects")}>
            {t("notFound.openProjects", language)}
          </button>
        </div>
      </LiquidGlass>
    </section>
  );
}
