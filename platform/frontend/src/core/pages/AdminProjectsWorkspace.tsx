import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createProject,
  deleteProject,
  updateProject,
  useProjectPosts
} from "../../public/data/project-store";
import type { PortfolioProject } from "../../public/types";

interface DraftProject {
  id: string;
  titleEn: string;
  titleRu: string;
  summaryEn: string;
  summaryRu: string;
  descriptionEn: string;
  descriptionRu: string;
  tags: string;
  heroLight: string;
  heroDark: string;
  screenshots: string[];
  videoUrl: string;
}

function emptyDraft(): DraftProject {
  return {
    id: "",
    titleEn: "",
    titleRu: "",
    summaryEn: "",
    summaryRu: "",
    descriptionEn: "",
    descriptionRu: "",
    tags: "",
    heroLight: "",
    heroDark: "",
    screenshots: [],
    videoUrl: ""
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function toDraft(project: PortfolioProject): DraftProject {
  return {
    id: project.id,
    titleEn: project.title.en,
    titleRu: project.title.ru,
    summaryEn: project.summary.en,
    summaryRu: project.summary.ru,
    descriptionEn: project.description.en,
    descriptionRu: project.description.ru,
    tags: project.tags.join(", "),
    heroLight: project.heroImage.light,
    heroDark: project.heroImage.dark,
    screenshots: project.screenshots.map((s) => s.light),
    videoUrl: project.videoUrl ?? ""
  };
}

function fromDraft(draft: DraftProject): PortfolioProject {
  const tags = draft.tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const fallbackCover =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><rect width='800' height='450' fill='#0f7b95'/><text x='40' y='90' font-size='48' fill='white'>Project Cover</text></svg>"
    );

  const coverLight = draft.heroLight || fallbackCover;
  const coverDark = draft.heroDark || coverLight;

  return {
    id: draft.id,
    title: {
      en: draft.titleEn || "Untitled",
      ru: draft.titleRu || draft.titleEn || "Без названия"
    },
    summary: {
      en: draft.summaryEn || "No summary yet.",
      ru: draft.summaryRu || draft.summaryEn || "Нет краткого описания."
    },
    description: {
      en: draft.descriptionEn || "No description yet.",
      ru: draft.descriptionRu || draft.descriptionEn || "Нет подробного описания."
    },
    tags,
    heroImage: {
      light: coverLight,
      dark: coverDark
    },
    screenshots: draft.screenshots.length
      ? draft.screenshots.map((image) => ({ light: image, dark: image }))
      : [{ light: coverLight, dark: coverDark }],
    videoUrl: draft.videoUrl || undefined
  };
}

export function AdminProjectsWorkspace() {
  const projects = useProjectPosts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProject>(() => emptyDraft());
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => [...projects].sort((a, b) => a.title.en.localeCompare(b.title.en)), [projects]);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function startEdit(project: PortfolioProject) {
    setEditingId(project.id);
    setDraft(toDraft(project));
  }

  async function handleSingleImage(event: ChangeEvent<HTMLInputElement>, field: "heroLight" | "heroDark") {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setDraft((current) => ({ ...current, [field]: dataUrl }));
  }

  async function handleScreenshots(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const dataUrls = await Promise.all(files.map((f) => fileToDataUrl(f)));
    setDraft((current) => ({ ...current, screenshots: dataUrls }));
  }

  async function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setDraft((current) => ({ ...current, videoUrl: dataUrl }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    const project = fromDraft(draft);
    if (editingId) {
      await updateProject(editingId, project);
    } else {
      await createProject(project);
    }

    setBusy(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function handleDelete(projectId: string) {
    if (!window.confirm("Delete this project post?")) {
      return;
    }
    await deleteProject(projectId);
    if (editingId === projectId) {
      setEditingId(null);
      setDraft(emptyDraft());
    }
  }

  return (
    <section className="admin-projects">
      <header className="admin-card">
        <h1>Projects Workspace</h1>
        <p>Manage project posts shown in public `/projects` and `/projects/:id`.</p>
        <button type="button" onClick={startCreate}>
          New Project Post
        </button>
      </header>

      <div className="admin-projects__grid">
        <article className="admin-card">
          <h2>{editingId ? "Edit Post" : "Create Post"}</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Slug (optional for create)
              <input
                value={draft.id}
                onChange={(e) => setDraft((c) => ({ ...c, id: e.target.value }))}
                placeholder="finance-tracker"
              />
            </label>
            <label>
              Title (EN)
              <input
                required
                value={draft.titleEn}
                onChange={(e) => setDraft((c) => ({ ...c, titleEn: e.target.value }))}
              />
            </label>
            <label>
              Title (RU)
              <input
                value={draft.titleRu}
                onChange={(e) => setDraft((c) => ({ ...c, titleRu: e.target.value }))}
              />
            </label>
            <label>
              Summary (EN)
              <textarea
                rows={2}
                value={draft.summaryEn}
                onChange={(e) => setDraft((c) => ({ ...c, summaryEn: e.target.value }))}
              />
            </label>
            <label>
              Summary (RU)
              <textarea
                rows={2}
                value={draft.summaryRu}
                onChange={(e) => setDraft((c) => ({ ...c, summaryRu: e.target.value }))}
              />
            </label>
            <label>
              Description (EN)
              <textarea
                rows={4}
                value={draft.descriptionEn}
                onChange={(e) => setDraft((c) => ({ ...c, descriptionEn: e.target.value }))}
              />
            </label>
            <label>
              Description (RU)
              <textarea
                rows={4}
                value={draft.descriptionRu}
                onChange={(e) => setDraft((c) => ({ ...c, descriptionRu: e.target.value }))}
              />
            </label>
            <label>
              Tags (comma separated)
              <input
                value={draft.tags}
                onChange={(e) => setDraft((c) => ({ ...c, tags: e.target.value }))}
                placeholder="React, TypeScript, API"
              />
            </label>
            <label>
              Cover Image (Light)
              <input type="file" accept="image/*" onChange={(e) => void handleSingleImage(e, "heroLight")} />
            </label>
            <label>
              Cover Image (Dark)
              <input type="file" accept="image/*" onChange={(e) => void handleSingleImage(e, "heroDark")} />
            </label>
            <label>
              Screenshots (multiple)
              <input type="file" accept="image/*" multiple onChange={(e) => void handleScreenshots(e)} />
            </label>
            <label>
              Video
              <input type="file" accept="video/*" onChange={(e) => void handleVideo(e)} />
            </label>
            <button type="submit" disabled={busy}>
              {editingId ? "Save Changes" : "Create Post"}
            </button>
          </form>
        </article>

        <article className="admin-card">
          <h2>Existing Posts</h2>
          <div className="admin-projects__list">
            {sorted.map((project) => (
              <div key={project.id} className="admin-projects__item">
                <div>
                  <strong>{project.title.en}</strong>
                  <p>{project.id}</p>
                </div>
                <div className="admin-chip-nav">
                  <button type="button" onClick={() => startEdit(project)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => void handleDelete(project.id)}>
                    Delete
                  </button>
                  <Link to={`/projects/${project.id}`}>View</Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
