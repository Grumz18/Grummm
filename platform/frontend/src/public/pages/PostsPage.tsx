import { useNavigate } from "react-router-dom";
import { ProjectCardGrid } from "../components/ProjectCardGrid";
import { ProjectsCatalogHeader } from "../components/ProjectsCatalogHeader";
import { useSwipeBack } from "../hooks/useSwipeBack";
import { useShowcasePosts } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

export function PostsPage() {
  const navigate = useNavigate();
  const { theme, language } = usePreferences();
  const posts = useShowcasePosts();
  const canHover = (typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) ?? false;

  useDocumentMetadata({
    title: `${t("posts.title", language)} | Grummm`,
    description: t("posts.description", language),
    path: "/posts",
    language
  });

  useSwipeBack(() => navigate("/"), { enabled: !canHover, edgeOnly: true });

  return (
    <section className="projects-page" data-gsap="reveal">
      <ProjectsCatalogHeader
        eyebrow={t("posts.eyebrow", language)}
        title={t("posts.title", language)}
        description={t("posts.description", language)}
        count={posts.length}
        backLabel={t("posts.back", language)}
        onBack={() => navigate("/")}
      />

      <ProjectCardGrid
        items={posts}
        theme={theme}
        language={language}
        onNavigate={(projectId) => navigate(`/posts/${projectId}`)}
        className="portfolio-grid--catalog"
      />
    </section>
  );
}
