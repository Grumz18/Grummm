import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const distDir = path.join(workspaceRoot, "dist");
const sourceProjectsPath = path.join(workspaceRoot, "src", "public", "data", "projects.ts");
const siteUrl = "https://grummm.ru";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeTsString(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSeedArray(source) {
  const marker = "export const seedProjects";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error("Could not find seedProjects export.");
  }

  const equalsIndex = source.indexOf("=", markerIndex);
  const openIndex = source.indexOf("[", equalsIndex);
  if (openIndex < 0) {
    throw new Error("Could not find seedProjects array start.");
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, index);
      }
    }
  }

  throw new Error("Could not find seedProjects array end.");
}

function splitTopLevelObjects(arraySource) {
  const objects = [];
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  let startIndex = -1;

  for (let index = 0; index < arraySource.length; index += 1) {
    const char = arraySource[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        startIndex = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && startIndex >= 0) {
        objects.push(arraySource.slice(startIndex, index + 1));
        startIndex = -1;
      }
    }
  }

  return objects;
}

function extractField(block, pattern) {
  const match = block.match(pattern);
  return match ? decodeTsString(match[1]) : "";
}

function extractTags(block) {
  const match = block.match(/tags:\s*\[([\s\S]*?)\]/);
  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => decodeTsString(item[1])).filter(Boolean);
}

function extractParagraphs(block) {
  const match = block.match(/contentBlocks:\s*\[([\s\S]*?)\],\s*tags:/);
  if (!match) {
    return [];
  }

  return Array.from(
    match[1].matchAll(/type:\s*"paragraph"[\s\S]*?content:\s*\{[\s\S]*?en:\s*"([^"]*)"/g),
    (item) => decodeTsString(item[1])
  ).filter(Boolean);
}

function loadEntries() {
  return fs.readFile(sourceProjectsPath, "utf8").then((source) => {
    const arraySource = extractSeedArray(source);
    return splitTopLevelObjects(arraySource).map((block) => ({
      id: extractField(block, /id:\s*"([^"]+)"/),
      kind: extractField(block, /kind:\s*"([^"]+)"/) || "project",
      title: extractField(block, /title:\s*\{[\s\S]*?en:\s*"([^"]*)"/),
      summary: extractField(block, /summary:\s*\{[\s\S]*?en:\s*"([^"]*)"/),
      description: extractField(block, /description:\s*\{[\s\S]*?en:\s*"([^"]*)"/),
      publishedAt: extractField(block, /publishedAt:\s*"([^"]+)"/),
      tags: extractTags(block),
      paragraphs: extractParagraphs(block)
    })).filter((entry) => entry.id && entry.title);
  });
}

function trimDescription(...parts) {
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= 155) {
    return text;
  }
  return `${text.slice(0, 152).replace(/\s+\S*$/, "")}...`;
}

function formatPublished(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildKeywords(entry) {
  return Array.from(
    new Set(["grummm", entry.kind, entry.title, ...entry.tags].map((item) => item.trim()).filter(Boolean))
  ).join(", ");
}

function entryPath(entry) {
  return entry.kind === "post" ? `/posts/${entry.id}` : `/projects/${entry.id}`;
}

function linkList(entries) {
  if (entries.length === 0) {
    return "<p>No entries published yet.</p>";
  }

  return `<ul>${entries
    .map((entry) => `<li><a href="${entryPath(entry)}">${escapeHtml(entry.title)}</a> - ${escapeHtml(entry.summary)}</li>`)
    .join("")}</ul>`;
}

function mainNav() {
  return `<nav aria-label="Semantic navigation"><p><a href="/">Home</a> | <a href="/posts">Posts</a> | <a href="/projects">Projects</a> | <a href="/login">Admin workspace</a></p></nav>`;
}

function renderHomeShell(entries) {
  const posts = entries.filter((entry) => entry.kind === "post");
  const projects = entries.filter((entry) => entry.kind === "project");

  return `<main class="seo-shell">
    ${mainNav()}
    <section id="overview">
      <h1>Grummm: posts, projects and runtime demos</h1>
      <p>Grummm publishes editorial posts and runtime-ready projects inside one modular product. The site is structured so each post and each project can be discovered, read, and revisited through direct routes instead of being trapped inside a single client-side screen.</p>
      <p>Visitors can open articles that explain architecture and product decisions, then move into project pages and runtime demos that show how those ideas are implemented. This gives the site a stronger crawl surface, clearer internal linking, and separate pages for separate topics.</p>
    </section>
    <section id="posts">
      <h2>Published posts</h2>
      ${linkList(posts)}
    </section>
    <section id="projects">
      <h2>Published projects</h2>
      ${linkList(projects)}
    </section>
  </main>`;
}

function renderListingShell(kind, entries) {
  const title = kind === "post" ? "Grummm posts" : "Grummm projects";
  const intro = kind === "post"
    ? "This page lists editorial posts published on Grummm. Each post is a dedicated entry with its own summary, publication date, and direct URL."
    : "This page lists runtime-ready projects published on Grummm. Each project has a dedicated page with its own summary, tags, and direct URL.";

  return `<main class="seo-shell">
    ${mainNav()}
    <section id="overview">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(intro)}</p>
      <p>Browse the entries below to open the full page for each published ${kind === "post" ? "post" : "project"}.</p>
    </section>
    <section id="entries">
      <h2>${kind === "post" ? "All posts" : "All projects"}</h2>
      ${linkList(entries)}
    </section>
  </main>`;
}

function renderDetailShell(entry, related) {
  const published = entry.kind === "post" && entry.publishedAt ? `<p>Published on ${escapeHtml(formatPublished(entry.publishedAt))}</p>` : "";
  const paragraphs = entry.paragraphs.length > 0
    ? entry.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
    : `<p>${escapeHtml(entry.description)}</p>`;
  const tags = entry.tags.length > 0 ? `<p>Topics: ${escapeHtml(entry.tags.join(", "))}</p>` : "";
  const relatedLinks = related.length > 0
    ? `<ul>${related.map((item) => `<li><a href="${entryPath(item)}">${escapeHtml(item.title)}</a></li>`).join("")}</ul>`
    : "<p>No related entries published yet.</p>";

  return `<main class="seo-shell">
    ${mainNav()}
    <article id="entry">
      <h1>${escapeHtml(entry.title)}</h1>
      <p>${escapeHtml(entry.summary)}</p>
      ${published}
      ${paragraphs}
      ${tags}
    </article>
    <section id="related">
      <h2>${entry.kind === "post" ? "Related posts and projects" : "Related projects and posts"}</h2>
      ${relatedLinks}
    </section>
  </main>`;
}

function updateMeta(html, { title, description, keywords, url }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${escapeHtml(keywords)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
}

function updateShell(html, shellMarkup) {
  return html.replace(/<main class="seo-shell">[\s\S]*?<\/main>/, shellMarkup);
}

async function writeRoutePage(route, html) {
  if (route === "/") {
    await fs.writeFile(path.join(distDir, "index.html"), html, "utf8");
    return;
  }

  const routeDir = path.join(distDir, route.replace(/^\//, ""));
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(path.join(routeDir, "index.html"), html, "utf8");
}

function renderPage(baseHtml, page) {
  return updateShell(
    updateMeta(baseHtml, {
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      url: `${siteUrl}${page.route}`
    }),
    page.shell
  );
}

function buildSitemap(entries) {
  const routes = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/posts", changefreq: "daily", priority: "0.9" },
    { path: "/projects", changefreq: "daily", priority: "0.9" },
    ...entries.map((entry) => ({
      path: entryPath(entry),
      changefreq: entry.kind === "post" ? "weekly" : "monthly",
      priority: entry.kind === "post" ? "0.85" : "0.8"
    }))
  ];

  const xml = routes
    .map((route) => `  <url>\n    <loc>${siteUrl}${route.path}</loc>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`;
}

async function main() {
  const [baseHtml, entries] = await Promise.all([
    fs.readFile(path.join(distDir, "index.html"), "utf8"),
    loadEntries()
  ]);

  const posts = entries.filter((entry) => entry.kind === "post");
  const projects = entries.filter((entry) => entry.kind === "project");

  const homeDescription = "Grummm publishes editorial posts, runtime projects, and modular demos with direct pages that search engines can index.";
  const homeKeywords = "grummm, posts, projects, runtime demos, modular platform, showcase, admin workspace";

  await writeRoutePage("/", renderPage(baseHtml, {
    route: "/",
    title: "Grummm: posts, projects and runtime demos",
    description: homeDescription,
    keywords: homeKeywords,
    shell: renderHomeShell(entries)
  }));

  await writeRoutePage("/posts", renderPage(baseHtml, {
    route: "/posts",
    title: "Grummm posts | technical articles and notes",
    description: trimDescription("Browse editorial posts on Grummm.", "Read technical articles, platform notes, release updates, and architectural explanations published on the site."),
    keywords: "grummm, posts, technical articles, release notes, architecture, modular platform",
    shell: renderListingShell("post", posts)
  }));

  await writeRoutePage("/projects", renderPage(baseHtml, {
    route: "/projects",
    title: "Grummm projects | runtime modules and demos",
    description: trimDescription("Browse runtime-ready projects on Grummm.", "Open showcase modules, template-based applications, and runtime demos published on the platform."),
    keywords: "grummm, projects, runtime demos, modules, templates, showcase projects",
    shell: renderListingShell("project", projects)
  }));

  for (const entry of entries) {
    const related = entries.filter((item) => item.id !== entry.id).slice(0, 4);
    const route = entryPath(entry);
    const title = entry.kind === "post" ? `${entry.title} | Grummm post` : `${entry.title} | Grummm project`;
    const description = trimDescription(entry.summary, entry.description, ...entry.paragraphs.slice(0, 1));
    const keywords = buildKeywords(entry);

    await writeRoutePage(route, renderPage(baseHtml, {
      route,
      title,
      description,
      keywords,
      shell: renderDetailShell(entry, related)
    }));
  }

  await fs.writeFile(path.join(distDir, "sitemap.xml"), buildSitemap(entries), "utf8");
}

main().catch((error) => {
  console.error("[prerender-seo]", error);
  process.exitCode = 1;
});
