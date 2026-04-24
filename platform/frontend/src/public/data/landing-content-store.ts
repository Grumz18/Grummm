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
    ru: "\u0414\u041b\u042f \u0417\u0410\u041a\u0410\u0417\u0427\u0418\u041a\u041e\u0412 \u0418 \u041a\u041e\u041c\u0410\u041d\u0414",
    en: "FOR CLIENTS AND TEAMS"
  },
  heroTitle: {
    ru: "\u0411\u044b\u0441\u0442\u0440\u043e \u043f\u043e\u0439\u043c\u0438\u0442\u0435, \u043f\u043e\u0434\u0445\u043e\u0436\u0443 \u043b\u0438 \u044f \u0432\u0430\u0448\u0435\u043c\u0443 \u043f\u0440\u043e\u0435\u043a\u0442\u0443",
    en: "Quickly see if I am the right fit for your project"
  },
  heroDescription: {
    ru: "\u041d\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435 \u0441\u043e\u0431\u0440\u0430\u043d\u044b \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u043a\u0435\u0439\u0441\u044b, \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u0438 \u0440\u0430\u0431\u043e\u0447\u0438\u0439 \u043f\u043e\u0434\u0445\u043e\u0434, \u0447\u0442\u043e\u0431\u044b \u0432\u044b \u0437\u0430 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u043c\u0438\u043d\u0443\u0442 \u043e\u0446\u0435\u043d\u0438\u043b\u0438 \u043c\u043e\u0439 \u043e\u043f\u044b\u0442 \u0438 \u0432\u044b\u0431\u0440\u0430\u043b\u0438 \u0443\u0434\u043e\u0431\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u0430.",
    en: "This platform brings together real cases, outcomes, and my working approach so you can evaluate my experience in minutes and choose a collaboration format that fits your goals."
  },
  aboutTitle: {
    ru: "\u041e\u0431\u043e \u043c\u043d\u0435",
    en: "About Me"
  },
  aboutSubtitle: {
    ru: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0438 \u044d\u043a\u0441\u043f\u0435\u0440\u0442\u0438\u0437\u0430",
    en: "Profile and expertise"
  },
  aboutText: {
    ru: "Fullstack-\u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a \u0441 \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u043e\u0439 \u0441\u0430\u043c\u043e\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0439 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432, \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 CI/CD \u0438 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u043a\u043e\u043c\u0430\u043d\u0434\u043d\u043e\u0439 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0438. \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e LLM \u043a\u0430\u043a \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0439 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u043b\u044f \u0434\u0435\u043a\u043e\u043c\u043f\u043e\u0437\u0438\u0446\u0438\u0438 \u0437\u0430\u0434\u0430\u0447, \u043f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f, \u0432\u0435\u0434\u0435\u043d\u0438\u044f \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u0438 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0438 \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u043e\u0439 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u0438.",
    en: "Fullstack developer with hands-on experience in independent product delivery, CI/CD setup, and team-oriented development workflows. I use LLMs as an engineering tool for task decomposition, solution design, project state management, and technical documentation."
  },
  portfolioTitle: {
    ru: "\u041f\u0440\u043e\u0435\u043a\u0442\u044b",
    en: "Projects"
  },
  portfolioText: {
    ru: "GRUMMM / grummm.ru \u2014 \u0441\u043e\u0431\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u0438 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u0430\u044f \u0441\u0440\u0435\u0434\u0430 \u0434\u043b\u044f \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u043e\u0432 \u0438 \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432. mobile-network-policy-lab \u2014 end-to-end \u043f\u0440\u043e\u0435\u043a\u0442 \u0432 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0439 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0435 \u0441 AI-assisted workflow \u0438 checkpoint-\u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u0435\u0439.",
    en: "GRUMMM / grummm.ru is my own platform and engineering environment for publishing materials and evolving products. mobile-network-policy-lab is an active end-to-end project where I use an AI-assisted workflow with checkpoint documentation and controlled delivery."
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
