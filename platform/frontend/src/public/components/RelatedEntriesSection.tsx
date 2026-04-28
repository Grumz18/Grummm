import { t } from "../../shared/i18n";
import { getPublicEntryPath } from "../data/project-store";
import ContentCard from "./ContentCard";
import type { Language, PortfolioProject } from "../types";

interface RelatedEntriesSectionProps {
  language: Language;
  posts: PortfolioProject[];
  projects: PortfolioProject[];
}

export function RelatedEntriesSection({ language, posts, projects }: RelatedEntriesSectionProps) {
  const entries = [...posts, ...projects].slice(0, 6);
  const headingId = `related-entries-title-${language}`;

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="rs-related-entries" data-gsap="reveal" aria-labelledby={headingId}>
      <header className="rs-related-entries__header">
        <p className="rs-section-label">{language === "ru" ? "Рекомендуем" : "Recommended"}</p>
        <h2 id={headingId} className="rs-section-title">
          {language === "ru" ? "Похожие материалы" : "Related materials"}
        </h2>
        <p>{t("related.description", language)}</p>
      </header>

      <div className="rs-related-entries__cards">
        {entries.map((entry) => (
          <ContentCard
            key={entry.id}
            item={entry}
            language={language}
            href={getPublicEntryPath(entry)}
            className="content-card--compact"
          />
        ))}
      </div>
    </section>
  );
}
