export type Language = "en" | "ru";
export type ThemeMode = "light" | "dark";

export interface LocalizedText {
  en: string;
  ru: string;
}

export interface ThemedAsset {
  light: string;
  dark: string;
}

export type TemplateType = "None" | "Static" | "CSharp" | "Python" | "JavaScript";

export interface PortfolioProject {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  tags: string[];
  heroImage: ThemedAsset;
  screenshots: ThemedAsset[];
  videoUrl?: string;
  template?: TemplateType;
  frontendPath?: string;
  backendPath?: string;
}
