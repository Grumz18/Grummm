import { useEffect } from "react";

interface DocumentMetadataOptions {
  title: string;
  description: string;
  path: string;
  language?: string;
  keywords?: string;
}

const BASE_URL = "https://grummm.ru";
const DEFAULT_KEYWORDS = "grummm, modular platform, posts, projects, runtime demos, admin workspace, analytics, showcase";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") {
    return;
  }

  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") {
    return;
  }

  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export function useDocumentMetadata({ title, description, path, language, keywords = DEFAULT_KEYWORDS }: DocumentMetadataOptions) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const canonicalUrl = new URL(path, BASE_URL).toString();
    document.title = title;

    if (language) {
      document.documentElement.lang = language;
    }

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", "index,follow,max-image-preview:large");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertLink("canonical", canonicalUrl);
  }, [description, keywords, language, path, title]);
}
