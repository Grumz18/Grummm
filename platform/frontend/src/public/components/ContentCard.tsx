import { Link } from "react-router-dom";
import { t } from "../../shared/i18n";
import { formatPublishedDate } from "../formatPublishedDate";
import {
  getPortfolioKind,
  isPortfolioPublicDemoEnabled
} from "../data/project-store";
import type { Language, PortfolioProject } from "../types";

interface ContentCardProps {
  item: PortfolioProject;
  language: Language;
  href: string;
  className?: string;
}

export default function ContentCard({ item, language, href, className }: ContentCardProps) {
  const kind = getPortfolioKind(item);
  const isPost = kind === "post";
  const isDemo = isPortfolioPublicDemoEnabled(item);
  const title = item.title[language] || item.title.en || item.id;
  const summary = item.summary[language] || item.summary.en || item.description[language] || item.description.en;
  const publishedAt = formatPublishedDate(item.publishedAt, language);

  const kindLabel = isPost ? (language === "ru" ? "Пост" : "Post") : (language === "ru" ? "Проект" : "Project");
  const ctaLabel = isDemo
    ? (language === "ru" ? "▶ Открыть демо" : "▶ Open demo")
    : isPost
      ? (language === "ru" ? "Читать →" : "Read →")
      : (language === "ru" ? "Смотреть →" : "View →");

  const classes = ["content-card"];
  if (className) {
    classes.push(className);
  }

  return (
    <article className={classes.join(" ")}>
      <Link to={href} className="content-card__link" aria-label={title}>
        <div className="content-card__badges">
          <span className={`content-card__badge ${isPost ? "content-card__badge--post" : "content-card__badge--project"}`}>
            {kindLabel}
          </span>
          {isDemo ? (
            <span className="content-card__badge content-card__badge--demo">
              {language === "ru" ? "▶ Демо" : "▶ Demo"}
            </span>
          ) : null}
          {publishedAt ? (
            <time className="content-card__date" dateTime={item.publishedAt}>{publishedAt}</time>
          ) : null}
        </div>

        <h3 className="content-card__title">{title}</h3>
        <p className="content-card__summary">{summary}</p>

        {item.tags.length > 0 ? (
          <div className="content-card__topics" aria-label={t("landing.hero.highlights", language)}>
            {item.tags.map((tag) => (
              <span key={`${item.id}-${tag}`} className="content-card__topic">{tag}</span>
            ))}
          </div>
        ) : null}

        <div className={`content-card__cta ${isDemo ? "content-card__cta--demo" : ""}`}>
          {ctaLabel}
        </div>
      </Link>
    </article>
  );
}
