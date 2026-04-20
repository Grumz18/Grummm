import { Link } from "react-router-dom";
import { ProgressiveImage } from "../components/ProgressiveImage";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";
import notFoundCat from "../../images/404.png";

export function NotFoundPage() {
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
    <section className="not-found-page rs-not-found-page" data-gsap="reveal">
      <div className="rs-not-found">
        <div className="rs-not-found__copy">
          <p className="rs-section-label">{t("notFound.eyebrow", language)}</p>
          <h1 className="rs-not-found__title">{t("notFound.title", language)}</h1>
          <p className="rs-not-found__description">{t("notFound.description", language)}</p>
          <div className="rs-not-found__actions">
            <Link to="/" className="rs-btn rs-btn--accent">
              {t("notFound.backHome", language)}
            </Link>
            <Link to="/projects" className="rs-btn rs-btn--border">
              {t("notFound.openProjects", language)}
            </Link>
          </div>
        </div>

        <div className="rs-not-found__art">
          <ProgressiveImage
            src={notFoundCat}
            alt={t("notFound.title", language)}
            loading="eager"
            fetchPriority="high"
            wrapperClassName="rs-not-found__art-frame"
            className="rs-not-found__art-image"
          />
        </div>
      </div>
    </section>
  );
}
