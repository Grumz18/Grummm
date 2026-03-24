import { HeroMorphTitle } from "./HeroMorphTitle";
import type { Language } from "../types";

interface LandingHeroSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  highlightsLabel: string;
  highlights: string[];
  language: Language;
}

export function LandingHeroSection({
  eyebrow,
  title,
  description,
  highlightsLabel: _highlightsLabel,
  highlights: _highlights,
  language
}: LandingHeroSectionProps) {
  return (
    <section className="hero liquid-glass" data-gsap="reveal">
      <div className="hero__backdrop" aria-hidden="true">
        <div className="hero__backdrop-grid" />
        <div className="hero__backdrop-glow hero__backdrop-glow--left" />
        <div className="hero__backdrop-glow hero__backdrop-glow--right" />
      </div>

      <div className="liquid-glass__sheen" aria-hidden="true" />
      <div className="liquid-glass__grain" aria-hidden="true" />

      <div className="liquid-glass__content hero__shell">
        <aside className="hero__scene" aria-hidden="true">
          <div className="hero__scene-stage" data-gsap-hero-parallax>
            <div className="hero__scene-glow" />
            <div className="hero__scene-cube" />
            <div className="hero__scene-spark hero__scene-spark--one" />
            <div className="hero__scene-spark hero__scene-spark--two" />
            <div className="hero__scene-spark hero__scene-spark--three" />
            <div className="hero__scene-spark hero__scene-spark--four" />
          </div>
        </aside>

        <div className="hero__content">
          <div className="hero__copy">
            <p className="hero__eyebrow">{eyebrow}</p>
            <HeroMorphTitle title={title} language={language} />
          </div>

          <div className="hero__details">
            <p className="hero__lead">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
