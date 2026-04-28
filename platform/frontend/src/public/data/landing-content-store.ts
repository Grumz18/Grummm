import type { LocalizedText } from "../types";

export interface LandingContent {
  heroEyebrow: LocalizedText;
  heroTitle: LocalizedText;
  heroDescription: LocalizedText;
  aboutTitle: LocalizedText;
  aboutSubtitle: LocalizedText;
  aboutText: LocalizedText;
  portfolioTitle: LocalizedText;
  portfolioText: LocalizedText;
  aboutPhoto?: string;
}

const STATIC_LANDING_CONTENT: LandingContent = {
  heroEyebrow: {
    ru: "IT, AI, \u043f\u0440\u043e\u0435\u043a\u0442\u044b \u0438 \u0433\u0430\u0439\u0434\u044b",
    en: "IT, AI, projects and guides"
  },
  heroTitle: {
    ru: "Grummm - IT, AI \u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u044b",
    en: "Grummm - IT, AI and projects"
  },
  heroDescription: {
    ru: "\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u043e \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0435: \u043c\u044b\u0441\u043b\u0438 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u0430, \u043e\u0431\u0443\u0447\u0430\u044e\u0449\u0438\u0435 \u043f\u043e\u0441\u0442\u044b, \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0433\u0430\u0439\u0434\u044b, \u0440\u0430\u0437\u0431\u043e\u0440\u044b AI-\u0442\u0440\u0435\u043d\u0434\u043e\u0432 \u0438 \u0436\u0438\u0432\u044b\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b, \u043f\u043e \u043a\u043e\u0442\u043e\u0440\u044b\u043c \u0432\u0438\u0434\u0435\u043d \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0439 \u043f\u043e\u0434\u0445\u043e\u0434.",
    en: "A development site with engineering notes, learning posts, practical guides, AI trend breakdowns, and live projects that make the technical approach visible."
  },
  aboutTitle: {
    ru: "\u0418\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u043a\u0443\u0441",
    en: "Engineering focus"
  },
  aboutSubtitle: {
    ru: "Fullstack, LLM-workflow \u0438 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432\u043e\u0435 \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435",
    en: "Fullstack, LLM workflows, and product thinking"
  },
  aboutText: {
    ru: "\u0417\u0434\u0435\u0441\u044c \u044f \u043f\u0438\u0448\u0443 \u043a\u0430\u043a fullstack-\u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a \u0438 AI-\u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442: \u043a\u0430\u043a \u043f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u0443\u044e \u0444\u0438\u0447\u0438, \u0441\u043e\u0431\u0438\u0440\u0430\u044e \u0441\u0435\u0440\u0432\u0438\u0441\u044b, \u0432\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u044e LLM \u0432 \u0440\u0430\u0431\u043e\u0447\u0438\u0435 \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u044b, \u0432\u0435\u0434\u0443 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u044e \u0438 \u0434\u043e\u0432\u043e\u0436\u0443 \u0438\u0434\u0435\u0438 \u0434\u043e \u0440\u0430\u0431\u043e\u0447\u0435\u0433\u043e \u0434\u0435\u043c\u043e.",
    en: "I write here as a fullstack developer and AI specialist: how I design features, build services, integrate LLMs into engineering workflows, maintain documentation, and turn ideas into working demos."
  },
  portfolioTitle: {
    ru: "\u041f\u0440\u043e\u0435\u043a\u0442\u044b \u043a\u0430\u043a \u0434\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e",
    en: "Projects as proof"
  },
  portfolioText: {
    ru: "\u0410\u043a\u0446\u0435\u043d\u0442 \u043d\u0430 \u0430\u0440\u0442\u0435\u0444\u0430\u043a\u0442\u0430\u0445: \u043f\u043e\u0441\u0442\u0430\u0445, \u0433\u0430\u0439\u0434\u0430\u0445, \u0434\u0435\u043c\u043e, \u0430\u0440\u0445\u0438\u0442\u0435\u043a\u0442\u0443\u0440\u043d\u044b\u0445 \u0440\u0430\u0437\u0431\u043e\u0440\u0430\u0445 \u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u0445, \u0433\u0434\u0435 \u0432\u0438\u0434\u043d\u043e, \u043a\u0430\u043a AI-\u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u043f\u043e\u043c\u043e\u0433\u0430\u044e\u0442 \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u0438 \u0442\u043e\u0447\u043d\u0435\u0435.",
    en: "The focus is on artifacts: posts, guides, demos, architecture notes, and projects that show how AI tools help engineering work move faster and with better control."
  },
  aboutPhoto: "/src/images/profile-main.jpeg"
};

function cloneStaticContent(): LandingContent {
  return {
    heroEyebrow: { ...STATIC_LANDING_CONTENT.heroEyebrow },
    heroTitle: { ...STATIC_LANDING_CONTENT.heroTitle },
    heroDescription: { ...STATIC_LANDING_CONTENT.heroDescription },
    aboutTitle: { ...STATIC_LANDING_CONTENT.aboutTitle },
    aboutSubtitle: { ...STATIC_LANDING_CONTENT.aboutSubtitle },
    aboutText: { ...STATIC_LANDING_CONTENT.aboutText },
    portfolioTitle: { ...STATIC_LANDING_CONTENT.portfolioTitle },
    portfolioText: { ...STATIC_LANDING_CONTENT.portfolioText },
    aboutPhoto: STATIC_LANDING_CONTENT.aboutPhoto
  };
}

export function readLandingContent(): LandingContent {
  return cloneStaticContent();
}

export function saveLandingContent(_content: LandingContent): LandingContent {
  return cloneStaticContent();
}

export interface LandingMutationOptions {
  serverOnly?: boolean;
}

export async function fetchLandingContentFromApi(): Promise<LandingContent | null> {
  return cloneStaticContent();
}

export async function saveLandingContentToServer(
  _content: LandingContent,
  _options: LandingMutationOptions = {}
): Promise<LandingContent> {
  throw new Error("Landing content editing is disabled.");
}

export function useLandingContent(): LandingContent {
  return cloneStaticContent();
}
