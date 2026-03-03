import { useEffect, useState } from "react";
import { seedProjects } from "./projects";
import type { PortfolioProject, TemplateType } from "../types";

const STORAGE_KEY = "platform.projects.posts.v1";
const UPDATE_EVENT = "platform:projects:updated";
const PUBLIC_API = "/api/public/projects";
const PRIVATE_API = "/api/app/projects";
const ACCESS_TOKEN_KEY = "platform.auth.accessToken";
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

export interface ProjectUploadBundle {
  templateType: TemplateType;
  frontendFiles: File[];
  backendFiles: File[];
}

function normalizeId(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || `post-${Date.now()}`;
}

function cloneSeed(): PortfolioProject[] {
  return seedProjects.map((project) => ({
    ...project,
    title: { ...project.title },
    summary: { ...project.summary },
    description: { ...project.description },
    tags: [...project.tags],
    heroImage: { ...project.heroImage },
    screenshots: project.screenshots.map((s) => ({ ...s }))
  }));
}

function writeProjects(next: PortfolioProject[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function getAccessToken(): string | null {
  try {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

function parseApiList(payload: unknown): PortfolioProject[] {
  if (Array.isArray(payload)) {
    return payload as PortfolioProject[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: PortfolioProject[] }).items;
  }

  return [];
}

function toApiPayload(input: PortfolioProject): PortfolioProject {
  const template = input.template ?? "None";

  return {
    ...input,
    template,
    frontendPath: input.frontendPath ?? DEFAULT_FRONTEND_PATH[template],
    backendPath: input.backendPath ?? DEFAULT_BACKEND_PATH[template]
  };
}

async function tryMultipartUpsert(
  method: "POST" | "PUT",
  endpoint: string,
  token: string,
  payload: PortfolioProject,
  upload?: ProjectUploadBundle
): Promise<boolean> {
  if (!upload || (upload.frontendFiles.length === 0 && upload.backendFiles.length === 0)) {
    return false;
  }

  const body = new FormData();
  body.append("payload", JSON.stringify(toApiPayload(payload)));
  body.append("templateType", upload.templateType);

  for (const file of upload.frontendFiles) {
    body.append("frontendFiles", file, file.webkitRelativePath || file.name);
  }

  for (const file of upload.backendFiles) {
    body.append("backendFiles", file, file.webkitRelativePath || file.name);
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body
  });

  return response.ok;
}

export function readProjects(): PortfolioProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneSeed();
      writeProjects(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as PortfolioProject[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = cloneSeed();
      writeProjects(initial);
      return initial;
    }

    return parsed;
  } catch {
    const initial = cloneSeed();
    writeProjects(initial);
    return initial;
  }
}

export async function fetchProjectsFromApi(): Promise<PortfolioProject[] | null> {
  try {
    const response = await fetch(PUBLIC_API, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    const projects = parseApiList(payload);
    if (projects.length > 0) {
      writeProjects(projects);
      return projects;
    }
  } catch {
    // offline or API unavailable
  }

  return null;
}

export async function createProject(input: PortfolioProject, upload?: ProjectUploadBundle): Promise<PortfolioProject[]> {
  const current = readProjects();
  const baseId = normalizeId(input.id || input.title.en || input.title.ru);
  let uniqueId = baseId;
  let idx = 1;
  while (current.some((p) => p.id === uniqueId)) {
    uniqueId = `${baseId}-${idx++}`;
  }

  const payload = toApiPayload({ ...input, id: uniqueId });
  const token = getAccessToken();

  if (token) {
    try {
      let responseOk = await tryMultipartUpsert("POST", PRIVATE_API, token, payload, upload);
      if (!responseOk) {
        const response = await fetch(PRIVATE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        responseOk = response.ok;
      }

      if (responseOk) {
        const synced = await fetchProjectsFromApi();
        if (synced) {
          return synced;
        }
      }
    } catch {
      // fallback to local
    }
  }

  const next = [payload, ...current];
  writeProjects(next);
  return next;
}

export async function updateProject(
  projectId: string,
  patch: PortfolioProject,
  upload?: ProjectUploadBundle
): Promise<PortfolioProject[]> {
  const current = readProjects();
  const payload = toApiPayload({ ...patch, id: projectId });
  const token = getAccessToken();

  if (token) {
    try {
      let responseOk = await tryMultipartUpsert("PUT", `${PRIVATE_API}/${projectId}`, token, payload, upload);
      if (!responseOk) {
        const response = await fetch(`${PRIVATE_API}/${projectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        responseOk = response.ok;
      }

      if (responseOk) {
        const synced = await fetchProjectsFromApi();
        if (synced) {
          return synced;
        }
      }
    } catch {
      // fallback to local
    }
  }

  const next = current.map((project) => (project.id === projectId ? payload : project));
  writeProjects(next);
  return next;
}

export async function deleteProject(projectId: string): Promise<PortfolioProject[]> {
  const current = readProjects();
  const token = getAccessToken();

  if (token) {
    try {
      const response = await fetch(`${PRIVATE_API}/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const synced = await fetchProjectsFromApi();
        if (synced) {
          return synced;
        }
      }
    } catch {
      // fallback to local
    }
  }

  const next = current.filter((project) => project.id !== projectId);
  writeProjects(next.length > 0 ? next : cloneSeed());
  return next;
}

export function useProjectPosts(): PortfolioProject[] {
  const [projects, setProjects] = useState<PortfolioProject[]>(() =>
    typeof window === "undefined" ? seedProjects : readProjects()
  );

  useEffect(() => {
    function refresh() {
      setProjects(readProjects());
    }

    void fetchProjectsFromApi().then((items) => {
      if (items) {
        setProjects(items);
      }
    });

    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return projects;
}

export function useProjectPost(projectId?: string): PortfolioProject | undefined {
  const projects = useProjectPosts();
  return projectId ? projects.find((project) => project.id === projectId) : undefined;
}
