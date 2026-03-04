import { useEffect, useState } from "react";
import type { LocalizedText } from "../types";

const STORAGE_KEY = "platform.landing.content.v1";
const UPDATE_EVENT = "platform:landing:updated";

export interface LandingContent {
  heroEyebrow: LocalizedText;
  heroTitle: LocalizedText;
  heroDescription: LocalizedText;
  aboutTitle: LocalizedText;
  aboutText: LocalizedText;
  portfolioTitle: LocalizedText;
  portfolioText: LocalizedText;
  aboutPhoto?: string;
}

const seedLandingContent: LandingContent = {
  heroEyebrow: {
    ru: "GRUMMM PLATFORM",
    en: "GRUMMM PLATFORM"
  },
  heroTitle: {
    ru: "Платформа, где проекты превращаются в живые демонстрации.",
    en: "A platform where projects become live demonstrations."
  },
  heroDescription: {
    ru: "Grummm.ru — это персональная витрина с публичным портфолио и приватной админ-зоной, где я управляю проектами, шаблонами и контентом.",
    en: "Grummm.ru is a personal showcase with a public portfolio and private admin area where I manage projects, templates, and content."
  },
  aboutTitle: {
    ru: "Обо мне",
    en: "About Me"
  },
  aboutText: {
    ru: "Я создаю прикладные веб-проекты: от идеи и интерфейса до backend-логики и деплоя. На этой странице вы видите мои актуальные работы и подход к архитектуре.",
    en: "I build practical web products end-to-end: from idea and interface to backend logic and deployment. This page shows my latest work and architecture approach."
  },
  portfolioTitle: {
    ru: "Портфолио",
    en: "Portfolio"
  },
  portfolioText: {
    ru: "В портфолио — проекты с разными шаблонами: static, JavaScript, C#, Python. Каждый можно открыть, изучить и оценить в работе.",
    en: "The portfolio includes projects with multiple templates: static, JavaScript, C#, and Python. Each one can be opened, explored, and reviewed in action."
  },
  aboutPhoto: undefined
};

function cloneSeed(): LandingContent {
  return {
    heroEyebrow: { ...seedLandingContent.heroEyebrow },
    heroTitle: { ...seedLandingContent.heroTitle },
    heroDescription: { ...seedLandingContent.heroDescription },
    aboutTitle: { ...seedLandingContent.aboutTitle },
    aboutText: { ...seedLandingContent.aboutText },
    portfolioTitle: { ...seedLandingContent.portfolioTitle },
    portfolioText: { ...seedLandingContent.portfolioText },
    aboutPhoto: seedLandingContent.aboutPhoto
  };
}

function writeLandingContent(next: LandingContent) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function readLandingContent(): LandingContent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneSeed();
      writeLandingContent(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as LandingContent;
    if (!parsed || typeof parsed !== "object") {
      const initial = cloneSeed();
      writeLandingContent(initial);
      return initial;
    }

    return {
      ...cloneSeed(),
      ...parsed
    };
  } catch {
    const initial = cloneSeed();
    writeLandingContent(initial);
    return initial;
  }
}

export function saveLandingContent(content: LandingContent): LandingContent {
  const normalized: LandingContent = {
    ...cloneSeed(),
    ...content
  };
  writeLandingContent(normalized);
  return normalized;
}

export function useLandingContent(): LandingContent {
  const [content, setContent] = useState<LandingContent>(() =>
    typeof window === "undefined" ? cloneSeed() : readLandingContent()
  );

  useEffect(() => {
    const sync = () => setContent(readLandingContent());
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return content;
}

