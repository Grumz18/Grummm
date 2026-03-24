import { useNavigate } from "react-router-dom";
import { ProjectCardGrid } from "../components/ProjectCardGrid";
import { ProjectsCatalogHeader } from "../components/ProjectsCatalogHeader";
import { useRuntimeProjects } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { theme, language } = usePreferences();
  const projects = useRuntimeProjects();
  const seoKeywords = language === "ru"
    ? "grummm, \u043f\u0440\u043e\u0435\u043a\u0442\u044b, runtime \u0434\u0435\u043c\u043e, \u043c\u043e\u0434\u0443\u043b\u0438, \u0448\u0430\u0431\u043b\u043e\u043d\u044b, \u0432\u0438\u0442\u0440\u0438\u043d\u0430 \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432"
    : "grummm, projects, runtime demos, modules, templates, showcase projects";

  useDocumentMetadata({
    title: `${t("projects.title", language)} | Grummm`,
    description: t("projects.description", language),
    path: "/projects",
    language,
    keywords: seoKeywords
  });

  return (
    <section className="projects-page" data-gsap="reveal">
      <ProjectsCatalogHeader
        eyebrow={t("projects.eyebrow", language)}
        title={t("projects.title", language)}
        description={t("projects.description", language)}
        count={projects.length}
        backLabel={t("projects.back", language)}
        onBack={() => navigate("/")}
      />

      <ProjectCardGrid
        items={projects}
        theme={theme}
        language={language}
        resolveHref={(projectId) => `/projects/${projectId}`}
        className="portfolio-grid--catalog"
      />
    </section>
  );
}
