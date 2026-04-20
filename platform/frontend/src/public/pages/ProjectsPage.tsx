import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ContentFeed } from "../components/ContentFeed";
import { useRuntimeProjects } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

function sortByPublishedDesc<T extends { publishedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return right - left;
  });
}

export function ProjectsPage() {
  const { language } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useRuntimeProjects();
  const items = useMemo(() => sortByPublishedDesc(projects), [projects]);
  const topic = searchParams.get("topic");

  function updateTopic(nextTopic: string | null) {
    const next = new URLSearchParams(searchParams);
    if (nextTopic) {
      next.set("topic", nextTopic);
    } else {
      next.delete("topic");
    }
    next.delete("kind");
    setSearchParams(next, { replace: true });
  }

  useDocumentMetadata({
    title: `${t("projects.title", language)} | Grummm`,
    description: t("projects.description", language),
    path: "/projects",
    language,
    keywords: language === "ru"
      ? "grummm, проекты, runtime демо, модули, шаблоны, витрина проектов"
      : "grummm, projects, runtime demos, modules, templates, showcase projects"
  });

  return (
    <section className="rs-feed-page">
      <p className="rs-section-label">{t("projects.eyebrow", language)}</p>
      <h1 className="rs-feed-page__title">{t("projects.title", language)}</h1>
      <p className="rs-feed-page__description">{t("projects.description", language)}</p>

      <ContentFeed
        language={language}
        items={items}
        kind="project"
        topic={topic}
        showKindFilter={false}
        onKindChange={() => undefined}
        onTopicToggle={(nextTopic) => updateTopic(topic === nextTopic ? null : nextTopic)}
      />
    </section>
  );
}
