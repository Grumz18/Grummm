import { ProjectCardGrid } from "./ProjectCardGrid";
import { SectionHeading } from "./SectionHeading";
import type { Language, PortfolioProject, ThemeMode } from "../types";

interface PortfolioSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  items: PortfolioProject[];
  theme: ThemeMode;
  language: Language;
  resolveHref: (projectId: string) => string;
  placeholderCount?: number;
}

export function PortfolioSection({
  eyebrow,
  title,
  description,
  items,
  theme,
  language,
  resolveHref,
  placeholderCount = 0
}: PortfolioSectionProps) {
  return (
    <section className="portfolio-section section-block" data-gsap="reveal">
      <div className="portfolio-section__intro">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="portfolio-section__heading"
          titleClassName="portfolio-section__title"
        />
      </div>

      <div className="portfolio-section__grid">
        <ProjectCardGrid
          items={items}
          theme={theme}
          language={language}
          resolveHref={resolveHref}
          placeholderCount={placeholderCount}
        />
      </div>
    </section>
  );
}
