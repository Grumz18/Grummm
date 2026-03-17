import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "../types";

interface HeroMorphTitleProps {
  title: string;
  language: Language;
}

const MORPH_TIME = 0.9;
const COOLDOWN_TIME = 1.75;
const STATIC_BRAND = "Grummm";

function cleanPhrase(value: string): string {
  return value.replace(/[.,!?]+$/u, "").replace(/\s+/gu, " ").trim();
}

function stripBrand(value: string): string {
  return value.replace(/^grummm\s+/iu, "").trim();
}

function getHeroSuffixes(title: string, language: Language): string[] {
  const cleaned = stripBrand(cleanPhrase(title));
  const defaults = language === "ru"
    ? [
        "оживляет проекты",
        "запускает демо",
        "собирает платформы"
      ]
    : [
        "brings projects to life",
        "launches live demos",
        "powers modular platforms"
      ];

  const primary = cleaned.length > 0 && cleaned.length <= 30 ? cleaned : defaults[0];
  return Array.from(new Set([primary, ...defaults]));
}

export function HeroMorphTitle({ title, language }: HeroMorphTitleProps) {
  const fromRef = useRef<HTMLSpanElement | null>(null);
  const toRef = useRef<HTMLSpanElement | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const suffixes = useMemo(() => getHeroSuffixes(title, language), [language, title]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileViewport = window.matchMedia("(max-width: 959.98px)");

    const syncAnimationMode = () => {
      setShouldAnimate(!reducedMotion.matches && !mobileViewport.matches && suffixes.length > 1);
    };

    syncAnimationMode();
    reducedMotion.addEventListener("change", syncAnimationMode);
    mobileViewport.addEventListener("change", syncAnimationMode);

    return () => {
      reducedMotion.removeEventListener("change", syncAnimationMode);
      mobileViewport.removeEventListener("change", syncAnimationMode);
    };
  }, [suffixes.length]);

  useEffect(() => {
    const from = fromRef.current;
    const to = toRef.current;
    if (!from || !to || !shouldAnimate || suffixes.length <= 1) {
      return;
    }

    let textIndex = 0;
    let morph = 0;
    let cooldown = COOLDOWN_TIME;
    let lastTime = performance.now();
    let frameId = 0;

    const setTextPair = () => {
      from.textContent = suffixes[textIndex % suffixes.length];
      to.textContent = suffixes[(textIndex + 1) % suffixes.length];
    };

    const doCooldown = () => {
      from.style.opacity = "1";
      from.style.filter = "blur(0px)";
      from.style.transform = "translate3d(0, 0, 0)";

      to.style.opacity = "0";
      to.style.filter = "blur(8px)";
      to.style.transform = "translate3d(0, 0.14em, 0)";
    };

    const setMorph = (fraction: number) => {
      const clamped = Math.min(Math.max(fraction, 0), 1);
      const inverse = 1 - clamped;

      from.style.opacity = `${Math.max(0, 1 - Math.pow(clamped, 1.18))}`;
      from.style.filter = `blur(${(clamped * 8).toFixed(2)}px)`;
      from.style.transform = `translate3d(0, ${(-0.05 * clamped).toFixed(3)}em, 0)`;

      to.style.opacity = `${Math.min(1, 0.12 + Math.pow(clamped, 0.92))}`;
      to.style.filter = `blur(${(inverse * 8).toFixed(2)}px)`;
      to.style.transform = `translate3d(0, ${(0.14 * inverse).toFixed(3)}em, 0)`;
    };

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const wasCoolingDown = cooldown > 0;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (wasCoolingDown) {
          morph = 0;
          setTextPair();
        }

        morph += dt;
        const fraction = morph / MORPH_TIME;

        if (fraction >= 1) {
          textIndex = (textIndex + 1) % suffixes.length;
          setTextPair();
          doCooldown();
          morph = 0;
          cooldown = COOLDOWN_TIME;
        } else {
          setMorph(fraction);
        }
      } else {
        doCooldown();
      }

      frameId = window.requestAnimationFrame(animate);
    };

    setTextPair();
    doCooldown();
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shouldAnimate, suffixes]);

  const primarySuffix = suffixes[0];
  const longestSuffix = suffixes.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    primarySuffix
  );
  const ariaLabel = `${STATIC_BRAND} ${primarySuffix}`;

  if (!shouldAnimate) {
    return (
      <h1 aria-label={ariaLabel}>
        <span className="hero-morph__brand">{STATIC_BRAND}</span>
        <span className="hero-morph__static">{primarySuffix}</span>
      </h1>
    );
  }

  return (
    <h1 aria-label={ariaLabel}>
      <span className="hero-morph__brand">{STATIC_BRAND}</span>
      <span className="hero-morph" aria-hidden="true">
        <span className="hero-morph__measure">{longestSuffix}</span>
        <span className="hero-morph__stack">
          <span ref={fromRef} className="hero-morph__text hero-morph__text--from" />
          <span ref={toRef} className="hero-morph__text hero-morph__text--to" />
        </span>
      </span>
    </h1>
  );
}