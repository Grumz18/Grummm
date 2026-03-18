import type { Language } from "./types";

function parsePublishedAt(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPublishedDate(value: string | undefined, language: Language): string | null {
  const date = parsePublishedAt(value);
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatPublishedMeta(value: string | undefined, language: Language): string | null {
  const formatted = formatPublishedDate(value, language);
  if (!formatted) {
    return null;
  }

  return language === "ru"
    ? `\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043E ${formatted}`
    : `Published ${formatted}`;
}
