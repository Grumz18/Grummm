import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Language, ThemeMode } from "../../public/types";
import { DEFAULT_ACCENT_HUE, resolveThemeTokens } from "./tokens";

const THEME_KEY = "grummm-theme";
const LANGUAGE_KEY = "grummm-lang";
const HUE_KEY = "grummm-hue";

const LEGACY_THEME_KEY = "platform.ui.theme";
const LEGACY_LANGUAGE_KEY = "platform.ui.language";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function isLanguage(value: string | null): value is Language {
  return value === "ru" || value === "en";
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function safeTheme(): ThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readTheme(): ThemeMode {
  const stored = readStorage(THEME_KEY);
  if (isThemeMode(stored)) {
    return stored;
  }

  const legacy = readStorage(LEGACY_THEME_KEY);
  if (isThemeMode(legacy)) {
    return legacy;
  }

  return safeTheme();
}

export function readStoredLanguage(): Language {
  const stored = readStorage(LANGUAGE_KEY);
  if (isLanguage(stored)) {
    return stored;
  }

  const legacy = readStorage(LEGACY_LANGUAGE_KEY);
  if (isLanguage(legacy)) {
    return legacy;
  }

  const locale = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase();
  return locale.startsWith("ru") ? "ru" : "en";
}

function readAccentHue(): number {
  const raw = readStorage(HUE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_ACCENT_HUE;
}

function syncCssVariables(theme: ThemeMode, language: Language, accentHue: number): void {
  const tokens = resolveThemeTokens(theme, accentHue);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.lang = language;
  root.style.colorScheme = theme;

  root.style.setProperty("--gr-bg", tokens.bg);
  root.style.setProperty("--gr-bg-surface", tokens.bgS);
  root.style.setProperty("--gr-bg-card", tokens.bgC);
  root.style.setProperty("--gr-border", tokens.border);
  root.style.setProperty("--gr-text", tokens.text);
  root.style.setProperty("--gr-muted", tokens.muted);
  root.style.setProperty("--gr-faint", tokens.faint);
  root.style.setProperty("--gr-accent", tokens.accent);
  root.style.setProperty("--gr-accent-bg", tokens.accentBg);
  root.style.setProperty("--gr-accent-text", tokens.accentT);
  root.style.setProperty("--gr-tag", tokens.tag);
  root.style.setProperty("--gr-tag-text", tokens.tagT);
  root.style.setProperty("--gr-nav", tokens.nav);
  root.style.setProperty("--gr-card-hover", tokens.cardHov);
  root.style.setProperty("--gr-card-shadow", tokens.shadow);
  root.style.setProperty("--gr-kind-post", tokens.kindPost);
  root.style.setProperty("--gr-kind-post-bg", tokens.kindPostBg);
  root.style.setProperty("--gr-kind-project", tokens.kindProject);
  root.style.setProperty("--gr-kind-project-bg", tokens.kindProjectBg);
  root.style.setProperty("--gr-demo-badge", tokens.demoBadge);
  root.style.setProperty("--gr-demo-badge-bg", tokens.demoBadgeBg);
  root.style.setProperty("--gr-accent-hue", String(accentHue));

  root.style.setProperty("--font-sans", "\"IBM Plex Sans\", sans-serif");
  root.style.setProperty("--font-mono", "\"IBM Plex Mono\", monospace");

  // Backward-compatible bridge for current style variables.
  root.style.setProperty("--bg", tokens.bg);
  root.style.setProperty("--bg-elevated", tokens.bgS);
  root.style.setProperty("--surface", tokens.bgC);
  root.style.setProperty("--surface-solid", tokens.bgC);
  root.style.setProperty("--surface-border", tokens.border);
  root.style.setProperty("--line", tokens.border);
  root.style.setProperty("--line-strong", tokens.border);
  root.style.setProperty("--text", tokens.text);
  root.style.setProperty("--text-muted", tokens.muted);
  root.style.setProperty("--text-soft", tokens.faint);
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--accent-strong", tokens.accentT);
  root.style.setProperty("--accent-soft", tokens.accentBg);
  root.style.setProperty("--radius-sm", "8px");
  root.style.setProperty("--radius-md", "10px");
  root.style.setProperty("--radius-lg", "12px");
  root.style.setProperty("--radius-pill", "999px");
  root.style.setProperty("--shadow-soft", tokens.shadow);
  root.style.setProperty("--shadow-card", tokens.shadow);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  themeColorMeta?.setAttribute("content", theme === "dark" ? "#0e0e11" : "#fafaf8");
}

export interface ThemeContextValue {
  theme: ThemeMode;
  language: Language;
  accentHue: number;
  setTheme: (value: ThemeMode) => void;
  setLanguage: (value: Language) => void;
  setAccentHue: (value: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage());
  const [accentHue, setAccentHue] = useState<number>(() => readAccentHue());

  useEffect(() => {
    syncCssVariables(theme, language, accentHue);
    writeStorage(THEME_KEY, theme);
    writeStorage(LEGACY_THEME_KEY, theme);
    writeStorage(LANGUAGE_KEY, language);
    writeStorage(LEGACY_LANGUAGE_KEY, language);
    writeStorage(HUE_KEY, String(accentHue));
  }, [theme, language, accentHue]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      language,
      accentHue,
      setTheme,
      setLanguage,
      setAccentHue
    }),
    [theme, language, accentHue]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return context;
}

export const themeStorageKeys = {
  theme: THEME_KEY,
  language: LANGUAGE_KEY,
  accentHue: HUE_KEY
};
