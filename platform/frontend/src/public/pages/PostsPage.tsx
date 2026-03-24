import { useNavigate } from "react-router-dom";
import { ProjectCardGrid } from "../components/ProjectCardGrid";
import { ProjectsCatalogHeader } from "../components/ProjectsCatalogHeader";
import { useShowcasePosts } from "../data/project-store";
import { usePreferences } from "../preferences";
import { t } from "../../shared/i18n";
import { useDocumentMetadata } from "../../shared/seo/useDocumentMetadata";

export function PostsPage() {
  const navigate = useNavigate();
  const { theme, language } = usePreferences();
  const posts = useShowcasePosts();
  const seoKeywords = language === "ru"
    ? "grummm, \u043f\u043e\u0441\u0442\u044b, \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0441\u0442\u0430\u0442\u044c\u0438, \u0440\u0435\u043b\u0438\u0437\u044b, \u043c\u043e\u0434\u0443\u043b\u044c\u043d\u0430\u044f \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430"
    : "grummm, posts, technical articles, release notes, modular platform, showcase posts";

  useDocumentMetadata({
    title: `${t("posts.title", language)} | Grummm`,
    description: t("posts.description", language),
    path: "/posts",
    language,
    keywords: seoKeywords
  });

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
        resolveHref={(projectId) => `/posts/${projectId}`}
        className="portfolio-grid--catalog"
      />
    </section>
  );
}
