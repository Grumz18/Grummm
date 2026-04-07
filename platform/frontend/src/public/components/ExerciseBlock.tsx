import { useState } from "react";
import type { Language, LocalizedText } from "../types";
import { t } from "../../shared/i18n";

function localized(text: LocalizedText | undefined, language: Language): string {
  if (!text) return "";
  return (language === "ru" ? text.ru : text.en) || text.en || text.ru || "";
}

interface ExerciseBlockProps {
  text: string;
  hints: LocalizedText[];
  language: Language;
}

export function ExerciseBlock({ text, hints, language }: ExerciseBlockProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  const hasMoreHints = revealedCount < hints.length;

  return (
    <div className="exercise-block">
      <div className="exercise-block__header">
        <span className="exercise-block__icon" aria-hidden="true">{"\u{1F3AF}"}</span>
        <span className="exercise-block__label">{t("blocks.exercise.title", language)}</span>
      </div>
      <p className="exercise-block__text">{text}</p>
      {hints.length > 0 ? (
        <div className="exercise-block__hints">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <div key={i} className="exercise-block__hint">
              <span className="exercise-block__hint-number">
                {t("blocks.exercise.hint", language)} {i + 1}:
              </span>
              <span>{localized(hint, language)}</span>
            </div>
          ))}
          {hasMoreHints ? (
            <button
              type="button"
              className="exercise-block__reveal"
              onClick={() => setRevealedCount((c) => c + 1)}
            >
              {revealedCount === 0
                ? t("blocks.exercise.showHint", language)
                : t("blocks.exercise.showNextHint", language)}
              {" "}
              ({revealedCount}/{hints.length})
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
