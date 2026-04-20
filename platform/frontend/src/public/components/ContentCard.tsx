import { Link } from "react-router-dom";
import { t } from "../../shared/i18n";
import { formatPublishedDate } from "../formatPublishedDate";
import {
  getPortfolioKind,
  isPortfolioPublicDemoEnabled
} from "../data/project-store";
import { usePreferences } from "../preferences";
import type { Language, PortfolioProject } from "../types";
import { ProgressiveImage } from "./ProgressiveImage";

interface ContentCardProps {
  item: PortfolioProject;
  language: Language;
  href: string;
  className?: string;
}

function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

function resolveCoverSrc(item: PortfolioProject, theme: "light" | "dark"): string {
  const hero = pickFirstNonEmpty(item.heroImage[theme], item.heroImage.light, item.heroImage.dark);
  if (hero) {
    return hero;
  }

  const screenshot = item.screenshots.find((asset) =>
    Boolean((asset[theme] && asset[theme].trim().length > 0) || (asset.light && asset.light.trim().length > 0) || (asset.dark && asset.dark.trim().length > 0))
  );
  if (screenshot) {
    return pickFirstNonEmpty(screenshot[theme], screenshot.light, screenshot.dark);
  }

  const mediaBlock = (item.contentBlocks ?? []).find((block) => {
    if (block.type === "image" && typeof block.imageUrl === "string" && block.imageUrl.trim().length > 0) {
      return true;
    }
    if (block.type === "video" && typeof block.posterUrl === "string" && block.posterUrl.trim().length > 0) {
      return true;
    }
    return block.type === "collage" && Array.isArray(block.images) && block.images.some((image) => typeof image === "string" && image.trim().length > 0);
  });

  if (!mediaBlock) {
    return "";
  }

  if (mediaBlock.type === "image") {
    return mediaBlock.imageUrl?.trim() ?? "";
  }

  if (mediaBlock.type === "video") {
    return mediaBlock.posterUrl?.trim() ?? "";
  }

  return mediaBlock.images?.find((image) => typeof image === "string" && image.trim().length > 0) ?? "";
}

export default function ContentCard({ item, language, href, className }: ContentCardProps) {
  const { theme } = usePreferences();
  const kind = getPortfolioKind(item);
  const isPost = kind === "post";
  const isDemo = isPortfolioPublicDemoEnabled(item);
  const isCompact = className?.includes("content-card--compact") ?? false;
  const title = item.title[language] || item.title.en || item.id;
  const summary = item.summary[language] || item.summary.en || item.description[language] || item.description.en;
  const publishedAt = formatPublishedDate(item.publishedAt, language);
  const coverSrc = resolveCoverSrc(item, theme);

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
        {!isCompact && coverSrc ? (
          <ProgressiveImage
            src={coverSrc}
            alt={title}
            loading="lazy"
            wrapperClassName="content-card__cover"
            className="content-card__cover-image"
          />
        ) : null}

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
