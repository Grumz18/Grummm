import { useNavigate } from "react-router-dom";
import { ProjectCardGrid } from "../components/ProjectCardGrid";
import { ProjectsCatalogHeader } from "../components/ProjectsCatalogHeader";
import { useSwipeBack } from "../hooks/useSwipeBack";
import { useRuntimeProjects } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { theme, language } = usePreferences();
  const projects = useRuntimeProjects();
  const canHover = (typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) ?? false;

  useDocumentMetadata({
    title: `${t("projects.title", language)} | Grummm`,
    description: t("projects.description", language),
    path: "/projects",
    language
  });

  useSwipeBack(() => navigate("/"), { enabled: !canHover, edgeOnly: true });

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
        onNavigate={(projectId) => navigate(`/projects/${projectId}`)}
        className="portfolio-grid--catalog"
      />
    </section>
  );
}
