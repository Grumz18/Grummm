import { t } from "../../shared/i18n";
import { formatPublishedDate } from "../formatPublishedDate";
import { getPortfolioKind } from "../data/project-store";
import type { Language, PortfolioProject, ThemeMode } from "../types";

interface ProjectCardProps {
  project: PortfolioProject;
  theme: ThemeMode;
  language: Language;
  onNavigate: (projectId: string) => void;
}

export function ProjectCard({
  project,
  theme,
  language,
  onNavigate
}: ProjectCardProps) {
  const title = project.title[language];
  const summary = project.summary[language];
  const cover = project.heroImage[theme];
  const kind = getPortfolioKind(project);
  const eyebrow = kind === "project"
    ? project.template && project.template !== "None" ? project.template : t("project.card.project", language)
    : t("project.card.showcase", language);
  const publishedAt = kind === "post" ? formatPublishedDate(project.publishedAt, language) : null;

  function handleNavigate() {
    onNavigate(project.id);
  }

  return (
    <article
      className="project-card liquid-glass"
      data-gsap-button
      onClick={handleNavigate}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
      aria-label={title}
    >
      <div className="liquid-glass__sheen" aria-hidden="true" />
      <div className="liquid-glass__grain" aria-hidden="true" />
      <div className="liquid-glass__content project-card__shell">
        <div className="project-card__media">
          <img src={cover} alt={title} loading="lazy" />
        </div>

        <div className="project-card__content">
          <div className="project-card__meta">
            <p className="project-card__eyebrow">{eyebrow}</p>
            {publishedAt ? <p className="project-card__published-at">{publishedAt}</p> : null}
          </div>

          <div className="project-card__text">
            <h3 title={title}>{title}</h3>
            <p className="project-card__summary" title={summary}>{summary}</p>
          </div>

          {project.tags.length > 0 ? (
            <div className="project-card__tags-marquee" aria-label={t("landing.hero.highlights", language)}>
              <div className="project-card__tags-track">
                {[...project.tags, ...project.tags].map((tag, index) => (
                  <span key={`${project.id}-${tag}-${index}`} className="project-card__tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}