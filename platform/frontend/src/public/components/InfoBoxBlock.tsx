import type { Language } from "../types";
import { t } from "../../shared/i18n";

type InfoBoxVariant = "tip" | "warning" | "important" | "note";

const VARIANT_ICONS: Record<InfoBoxVariant, string> = {
  tip: "\u{1F4A1}",
  warning: "\u26A0\uFE0F",
  important: "\u2757",
  note: "\u{1F4DD}"
};

interface InfoBoxBlockProps {
  variant: InfoBoxVariant;
  text: string;
  language: Language;
}

export function InfoBoxBlock({ variant, text, language }: InfoBoxBlockProps) {
  const icon = VARIANT_ICONS[variant] ?? VARIANT_ICONS.note;
  const label = t(`blocks.infoBox.${variant}`, language);

  return (
    <div className={`info-box info-box--${variant}`} role="note">
      <div className="info-box__sidebar" aria-hidden="true">
        <span className="info-box__icon">{icon}</span>
      </div>
      <div className="info-box__body">
        <span className="info-box__label">{label}</span>
        <p className="info-box__text">{text}</p>
      </div>
    </div>
  );
}
