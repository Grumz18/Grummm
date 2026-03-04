import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useDropzone, type DropEvent } from "react-dropzone";
import { Link } from "react-router-dom";
import {
  createProjectWithOptions,
  deleteProject,
  updateProject,
  useProjectPosts,
  type ProjectUploadBundle
} from "../../public/data/project-store";
import {
  readLandingContent,
  saveLandingContent,
  type LandingContent
} from "../../public/data/landing-content-store";
import type { PortfolioProject, TemplateType } from "../../public/types";

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
  templateType: TemplateType;
  frontendFiles: File[];
  backendFiles: File[];
}

interface LandingDraft extends LandingContent {}

const TEMPLATE_OPTIONS: Array<{ value: TemplateType; label: string }> = [
  { value: "None", label: "Без шаблона" },
  { value: "Static", label: "Статический" },
  { value: "CSharp", label: "C#" },
  { value: "Python", label: "Python" },
  { value: "JavaScript", label: "JavaScript" }
];

const TEMPLATE_INSTRUCTIONS: Record<Exclude<TemplateType, "None">, { frontend: string; backend: string }> = {
  Static: {
    frontend: "Перетащите сюда папку dist (обязательно index.html + assets).",
    backend: "Не требуется. Для статического шаблона backend-файлы запрещены."
  },
  CSharp: {
    frontend: "Перетащите сюда frontend-сборку (обычно dist для клиентской части).",
    backend: "Загрузите собранные DLL + .deps.json (и .runtimeconfig.json при необходимости)."
  },
  Python: {
    frontend: "Перетащите сюда frontend-сборку (если есть клиентская часть).",
    backend: "Загрузите Python-файлы сервиса: app.py, requirements.txt и остальные .py."
  },
  JavaScript: {
    frontend: "Перетащите сюда frontend-сборку (dist/index.html + assets).",
    backend: "Загрузите backend-файлы Node.js, включая package.json."
  }
};

const DEFAULT_FRONTEND_PATH: Record<TemplateType, string | undefined> = {
  None: undefined,
  Static: "/templates/static",
  CSharp: "/templates/csharp",
  Python: "/templates/python",
  JavaScript: "/templates/js"
};

const DEFAULT_BACKEND_PATH: Record<TemplateType, string | undefined> = {
  None: undefined,
  Static: "/services/static",
  CSharp: "/services/csharp",
  Python: "/services/python",
  JavaScript: "/services/js"
};

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
    videoUrl: "",
    templateType: "None",
    frontendFiles: [],
    backendFiles: []
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

function readFileEntry(entry: {
  file: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
}): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readDirectoryEntries(reader: {
  readEntries: (success: (entries: unknown[]) => void, error?: (error: DOMException) => void) => void;
}): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });
}

async function flattenEntry(entry: unknown): Promise<File[]> {
  const item = entry as { isFile?: boolean; isDirectory?: boolean; file?: unknown; createReader?: () => unknown };

  if (item.isFile && typeof item.file === "function") {
    return [await readFileEntry(item as { file: (success: (file: File) => void, error?: (error: DOMException) => void) => void })];
  }

  if (!item.isDirectory || typeof item.createReader !== "function") {
    return [];
  }

  const reader = item.createReader() as {
    readEntries: (success: (entries: unknown[]) => void, error?: (error: DOMException) => void) => void;
  };
  const result: File[] = [];

  while (true) {
    const chunk = await readDirectoryEntries(reader);
    if (chunk.length === 0) {
      break;
    }

    const nested = await Promise.all(chunk.map(flattenEntry));
    nested.forEach((files) => result.push(...files));
  }

  return result;
}

async function getFilesRecursively(event: DropEvent): Promise<File[]> {
  const dragEvent = event as DragEvent;
  const items = Array.from(dragEvent.dataTransfer?.items ?? []);
  const entries = items
    .map((item) =>
      (item as DataTransferItem & { webkitGetAsEntry?: () => unknown }).webkitGetAsEntry?.() ?? null
    )
    .filter(Boolean);

  if (entries.length > 0) {
    const nested = await Promise.all(entries.map(flattenEntry));
    return nested.flat();
  }

  const fallbackFiles = Array.from(dragEvent.dataTransfer?.files ?? []);
  if (fallbackFiles.length > 0) {
    return fallbackFiles;
  }

  const maybeInput = event as Event;
  const target = maybeInput.target as HTMLInputElement | null;
  return Array.from(target?.files ?? []);
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
    videoUrl: project.videoUrl ?? "",
    templateType: project.template ?? "None",
    frontendFiles: [],
    backendFiles: []
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
    videoUrl: draft.videoUrl || undefined,
    template: draft.templateType,
    frontendPath: DEFAULT_FRONTEND_PATH[draft.templateType],
    backendPath: DEFAULT_BACKEND_PATH[draft.templateType]
  };
}

interface TemplateDropzoneProps {
  title: string;
  hint: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

function TemplateDropzone({ title, hint, files, onFilesChange }: TemplateDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: (accepted) => {
      if (accepted.length === 0) {
        return;
      }

      const merged = [...files, ...accepted];
      const unique = new Map<string, File>();
      merged.forEach((file) => unique.set(`${file.webkitRelativePath || file.name}:${file.size}`, file));
      onFilesChange(Array.from(unique.values()));
    },
    multiple: true,
    useFsAccessApi: true,
    getFilesFromEvent: getFilesRecursively
  });

  return (
    <section className="admin-dropzone-wrap">
      <strong>{title}</strong>
      <p className="admin-muted">{hint}</p>
      <div className={`admin-dropzone ${isDragActive ? "is-active" : ""}`} {...getRootProps()}>
        <input {...getInputProps()} />
        <p>{isDragActive ? "Отпустите, чтобы загрузить файлы" : "Перетащите файлы/папку или нажмите для выбора"}</p>
      </div>
      <p className="admin-muted">Выбрано файлов: {files.length}</p>
      {files.length > 0 ? (
        <ul className="admin-file-list">
          {files.slice(0, 6).map((file) => (
            <li key={`${file.webkitRelativePath || file.name}:${file.size}`}>{file.webkitRelativePath || file.name}</li>
          ))}
          {files.length > 6 ? <li>...и еще {files.length - 6}</li> : null}
        </ul>
      ) : null}
      {files.length > 0 ? (
        <button type="button" onClick={() => onFilesChange([])}>
          Очистить файлы
        </button>
      ) : null}
    </section>
  );
}

export function AdminProjectsWorkspace() {
  const projects = useProjectPosts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProject>(() => emptyDraft());
  const [landingDraft, setLandingDraft] = useState<LandingDraft>(() => readLandingContent());
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string>("");

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

  async function handleLandingPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setLandingDraft((current) => ({ ...current, aboutPhoto: dataUrl }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setServerError("");

    const project = fromDraft(draft);
    const upload: ProjectUploadBundle = {
      templateType: draft.templateType,
      frontendFiles: draft.frontendFiles,
      backendFiles: draft.backendFiles
    };

    try {
      if (editingId) {
        await updateProject(editingId, project, upload, { serverOnly: true });
      } else {
        await createProjectWithOptions(project, upload, { serverOnly: true });
      }

      setEditingId(null);
      setDraft(emptyDraft());
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ошибка синхронизации с сервером.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!window.confirm("Удалить этот пост проекта?")) {
      return;
    }
    setServerError("");
    try {
      await deleteProject(projectId, { serverOnly: true });
      if (editingId === projectId) {
        setEditingId(null);
        setDraft(emptyDraft());
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ошибка удаления на сервере.");
    }
  }

  function handleLandingSave(event: FormEvent) {
    event.preventDefault();
    const saved = saveLandingContent(landingDraft);
    setLandingDraft(saved);
  }

  const templateDetails = draft.templateType === "None" ? null : TEMPLATE_INSTRUCTIONS[draft.templateType];

  return (
    <section className="admin-projects">
      <article className="admin-projects__workspace">
        <header className="admin-projects__hero">
          <h1>Рабочее пространство проектов</h1>
          <p>Управляйте публикациями и шаблонами: создавайте посты, загружайте сборки и открывайте результат в `/app/&lt;slug&gt;`.</p>
          {serverError ? <p className="admin-error">{serverError}</p> : null}
        </header>

        <div className="admin-projects__workspace-grid">
          <section className="admin-card admin-projects__actions admin-projects__nav-panel">
            <h2>Действия</h2>
            <button type="button" onClick={startCreate}>Новый пост проекта</button>
            <p className="admin-muted">Нажмите кнопку, чтобы очистить форму и начать создание нового проекта.</p>
          </section>

          <article className="admin-card admin-projects__editor">
          <h2>{editingId ? "Редактирование поста" : "Создание поста"}</h2>
          <p className="admin-muted">
            Как загрузить проект: 
            <br />1) выберите тип шаблона, 
            <br />2) заполните тексты и медиа, 
            <br />3) добавьте файлы frontend/backend,
            <br />4) нажмите «{editingId ? "Сохранить изменения" : "Создать пост"}». 
            <br />После сохранения frontend доступен по`/app/&lt;slug&gt;/index.html`.
          </p>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Slug (для нового поста можно оставить пустым)
              <input
                value={draft.id}
                onChange={(e) => setDraft((c) => ({ ...c, id: e.target.value }))}
                placeholder="finance-tracker"
              />
            </label>
            <label>
              Тип шаблона
              <select
                data-testid="template-type-select"
                value={draft.templateType}
                onChange={(e) => setDraft((c) => ({ ...c, templateType: e.target.value as TemplateType }))}
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {templateDetails ? (
              <section className="admin-template-accordion" data-testid="template-instructions">
                <details open>
                  <summary>Инструкции по загрузке шаблона</summary>
                  <TemplateDropzone
                    title="Frontend пакет"
                    hint={templateDetails.frontend}
                    files={draft.frontendFiles}
                    onFilesChange={(files) => setDraft((current) => ({ ...current, frontendFiles: files }))}
                  />
                  <TemplateDropzone
                    title="Backend пакет"
                    hint={templateDetails.backend}
                    files={draft.backendFiles}
                    onFilesChange={(files) => setDraft((current) => ({ ...current, backendFiles: files }))}
                  />
                </details>
              </section>
            ) : null}

            <label>
              Заголовок (EN)
              <input required value={draft.titleEn} onChange={(e) => setDraft((c) => ({ ...c, titleEn: e.target.value }))} />
            </label>
            <label>
              Заголовок (RU)
              <input value={draft.titleRu} onChange={(e) => setDraft((c) => ({ ...c, titleRu: e.target.value }))} />
            </label>
            <label>
              Краткое описание (EN)
              <textarea rows={2} value={draft.summaryEn} onChange={(e) => setDraft((c) => ({ ...c, summaryEn: e.target.value }))} />
            </label>
            <label>
              Краткое описание (RU)
              <textarea rows={2} value={draft.summaryRu} onChange={(e) => setDraft((c) => ({ ...c, summaryRu: e.target.value }))} />
            </label>
            <label>
              Полное описание (EN)
              <textarea rows={4} value={draft.descriptionEn} onChange={(e) => setDraft((c) => ({ ...c, descriptionEn: e.target.value }))} />
            </label>
            <label>
              Полное описание (RU)
              <textarea rows={4} value={draft.descriptionRu} onChange={(e) => setDraft((c) => ({ ...c, descriptionRu: e.target.value }))} />
            </label>
            <label>
              Теги (через запятую)
              <input
                value={draft.tags}
                onChange={(e) => setDraft((c) => ({ ...c, tags: e.target.value }))}
                placeholder="React, TypeScript, API"
              />
            </label>
            <label>
              Обложка (светлая тема)
              <input type="file" accept="image/*" onChange={(e) => void handleSingleImage(e, "heroLight")} />
            </label>
            <label>
              Обложка (темная тема)
              <input type="file" accept="image/*" onChange={(e) => void handleSingleImage(e, "heroDark")} />
            </label>
            <label>
              Скриншоты (можно несколько)
              <input type="file" accept="image/*" multiple onChange={(e) => void handleScreenshots(e)} />
            </label>
            <label>
              Видео
              <input type="file" accept="video/*" onChange={(e) => void handleVideo(e)} />
            </label>
            <button type="submit" disabled={busy} data-testid="project-submit">
              {editingId ? "Сохранить изменения" : "Создать пост"}
            </button>
          </form>
          </article>
        </div>

        <article className="admin-card admin-landing-editor">
          <h2>Контент главной страницы</h2>
          <p className="admin-muted">
            Здесь вы настраиваете первый экран и блок «Обо мне» на двух языках. Изменения сразу применяются на `/`.
          </p>
          <form className="admin-form" onSubmit={handleLandingSave}>
            <label>
              Hero (RU): надзаголовок
              <input
                value={landingDraft.heroEyebrow.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroEyebrow: { ...current.heroEyebrow, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Hero (EN): eyebrow
              <input
                value={landingDraft.heroEyebrow.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroEyebrow: { ...current.heroEyebrow, en: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Hero (RU): заголовок
              <textarea
                rows={2}
                value={landingDraft.heroTitle.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroTitle: { ...current.heroTitle, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Hero (EN): title
              <textarea
                rows={2}
                value={landingDraft.heroTitle.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroTitle: { ...current.heroTitle, en: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Hero (RU): описание
              <textarea
                rows={3}
                value={landingDraft.heroDescription.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroDescription: { ...current.heroDescription, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Hero (EN): description
              <textarea
                rows={3}
                value={landingDraft.heroDescription.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    heroDescription: { ...current.heroDescription, en: e.target.value }
                  }))
                }
              />
            </label>

            <label>
              Обо мне (RU): заголовок
              <input
                value={landingDraft.aboutTitle.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    aboutTitle: { ...current.aboutTitle, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              About me (EN): title
              <input
                value={landingDraft.aboutTitle.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    aboutTitle: { ...current.aboutTitle, en: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Обо мне (RU): текст
              <textarea
                rows={3}
                value={landingDraft.aboutText.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    aboutText: { ...current.aboutText, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              About me (EN): text
              <textarea
                rows={3}
                value={landingDraft.aboutText.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    aboutText: { ...current.aboutText, en: e.target.value }
                  }))
                }
              />
            </label>

            <label>
              Портфолио (RU): заголовок
              <input
                value={landingDraft.portfolioTitle.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    portfolioTitle: { ...current.portfolioTitle, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Portfolio (EN): title
              <input
                value={landingDraft.portfolioTitle.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    portfolioTitle: { ...current.portfolioTitle, en: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Портфолио (RU): текст
              <textarea
                rows={3}
                value={landingDraft.portfolioText.ru}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    portfolioText: { ...current.portfolioText, ru: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Portfolio (EN): text
              <textarea
                rows={3}
                value={landingDraft.portfolioText.en}
                onChange={(e) =>
                  setLandingDraft((current) => ({
                    ...current,
                    portfolioText: { ...current.portfolioText, en: e.target.value }
                  }))
                }
              />
            </label>
            <label>
              Фото для блока «Обо мне»
              <input type="file" accept="image/*" onChange={(e) => void handleLandingPhoto(e)} />
            </label>
            {landingDraft.aboutPhoto ? (
              <img className="admin-landing-editor__preview" src={landingDraft.aboutPhoto} alt="about-preview" />
            ) : null}
            <button type="submit">Сохранить контент главной</button>
          </form>
        </article>
      </article>

      <aside className="admin-card admin-projects__posts-panel admin-projects__nav-panel">
        <h2>Существующие посты</h2>
        <div className="admin-projects__list admin-projects__list--sidebar">
          {sorted.map((project) => (
            <div key={project.id} className="admin-projects__item admin-projects__item--sidebar">
              <div>
                <strong>{project.title.en}</strong>
                <p>{project.id}</p>
              </div>
              <div className="admin-chip-nav">
                <button type="button" onClick={() => startEdit(project)}>Редактировать</button>
                <button type="button" onClick={() => void handleDelete(project.id)}>Удалить</button>
                <Link to={`/projects/${project.id}`}>Открыть</Link>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
