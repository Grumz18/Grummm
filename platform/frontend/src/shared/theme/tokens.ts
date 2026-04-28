import type { ThemeMode } from "../../public/types";

export const DEFAULT_ACCENT_HUE = 225;

export interface ThemeTokens {
  bg: string;
  bgS: string;
  bgC: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentBg: string;
  accentT: string;
  tag: string;
  tagT: string;
  nav: string;
  cardHov: string;
  shadow: string;
  kindPost: string;
  kindPostBg: string;
  kindProject: string;
  kindProjectBg: string;
  demoBadge: string;
  demoBadgeBg: string;
}

export const DISCIPLINE_ACCENTS = [
  "oklch(0.52 0.14 250)",
  "oklch(0.52 0.14 165)",
  "oklch(0.52 0.14 35)"
] as const;

function clampHue(hue: number): number {
  if (!Number.isFinite(hue)) {
    return DEFAULT_ACCENT_HUE;
  }

  const normalized = Math.round(hue) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function withHue(lightness: number, chroma: number, hue: number): string {
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function createLightTokens(hue: number): ThemeTokens {
  return {
    bg: "#fafaf8",
    bgS: "#f3f3f0",
    bgC: "#ffffff",
    border: "#e4e4df",
    text: "#18181b",
    muted: "#69697a",
    faint: "#b0b0be",
    accent: withHue(0.5, 0.17, hue),
    accentBg: withHue(0.95, 0.04, hue),
    accentT: withHue(0.45, 0.17, hue),
    tag: "#ededea",
    tagT: "#52525e",
    nav: "rgba(250,250,248,0.88)",
    cardHov: "#f7f7f4",
    shadow: "0 4px 20px rgba(0,0,0,0.07)",
    kindPost: "oklch(0.46 0.13 160)",
    kindPostBg: "oklch(0.94 0.04 160)",
    kindProject: "oklch(0.46 0.13 220)",
    kindProjectBg: "oklch(0.94 0.04 220)",
    demoBadge: "oklch(0.5 0.14 40)",
    demoBadgeBg: "oklch(0.95 0.05 40)"
  };
}

function createDarkTokens(hue: number): ThemeTokens {
  return {
    bg: "#0e0e11",
    bgS: "#15151a",
    bgC: "#1c1c22",
    border: "#28282f",
    text: "#e8e8f0",
    muted: "#7878a0",
    faint: "#44445a",
    accent: withHue(0.63, 0.17, hue),
    accentBg: withHue(0.2, 0.07, hue),
    accentT: withHue(0.63, 0.17, hue),
    tag: "#22222c",
    tagT: "#9898c0",
    nav: "rgba(14,14,17,0.88)",
    cardHov: "#202028",
    shadow: "0 4px 20px rgba(0,0,0,0.4)",
    kindPost: "oklch(0.63 0.14 160)",
    kindPostBg: "oklch(0.2 0.06 160)",
    kindProject: "oklch(0.63 0.14 220)",
    kindProjectBg: "oklch(0.2 0.06 220)",
    demoBadge: "oklch(0.63 0.15 40)",
    demoBadgeBg: "oklch(0.2 0.07 40)"
  };
}

export function resolveThemeTokens(theme: ThemeMode, accentHue: number = DEFAULT_ACCENT_HUE): ThemeTokens {
  const hue = clampHue(accentHue);
  return theme === "dark" ? createDarkTokens(hue) : createLightTokens(hue);
}
