import { useState } from "react";
import type { Language, LocalizedText } from "../types";
import { t } from "../../shared/i18n";

function localized(text: LocalizedText | undefined, language: Language): string {
  if (!text) return "";
  return (language === "ru" ? text.ru : text.en) || text.en || text.ru || "";
}

interface QuizBlockProps {
  question: string;
  options: LocalizedText[];
  correctIndex: number;
  explanation?: LocalizedText;
  language: Language;
}

export function QuizBlock({ question, options, correctIndex, explanation, language }: QuizBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && selected === correctIndex;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  function handleReset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className={`quiz-block ${submitted ? (isCorrect ? "quiz-block--correct" : "quiz-block--wrong") : ""}`}>
      <div className="quiz-block__header">
        <span className="quiz-block__icon" aria-hidden="true">?</span>
        <span className="quiz-block__label">{t("blocks.quiz.title", language)}</span>
      </div>
      <p className="quiz-block__question">{question}</p>
      <div className="quiz-block__options" role="radiogroup">
        {options.map((option, i) => {
          const optionText = localized(option, language);
          const isSelected = selected === i;
          const showResult = submitted;
          let optionClass = "quiz-block__option";
          if (showResult && i === correctIndex) optionClass += " quiz-block__option--correct";
          if (showResult && isSelected && i !== correctIndex) optionClass += " quiz-block__option--wrong";
          if (!showResult && isSelected) optionClass += " quiz-block__option--selected";

          return (
            <button
              key={i}
              type="button"
              className={optionClass}
              role="radio"
              aria-checked={isSelected}
              disabled={submitted}
              onClick={() => setSelected(i)}
            >
              <span className="quiz-block__option-marker">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="quiz-block__option-text">{optionText}</span>
            </button>
          );
        })}
      </div>
      <div className="quiz-block__actions">
        {!submitted ? (
          <button
            type="button"
            className="quiz-block__submit"
            disabled={selected === null}
            onClick={handleSubmit}
          >
            {t("blocks.quiz.check", language)}
          </button>
        ) : (
          <button type="button" className="quiz-block__reset" onClick={handleReset}>
            {t("blocks.quiz.tryAgain", language)}
          </button>
        )}
      </div>
      {submitted && explanation ? (
        <div className={`quiz-block__explanation ${isCorrect ? "quiz-block__explanation--correct" : "quiz-block__explanation--wrong"}`}>
          <strong>{isCorrect ? t("blocks.quiz.correct", language) : t("blocks.quiz.wrong", language)}</strong>
          {" "}
          {localized(explanation, language)}
        </div>
      ) : null}
    </div>
  );
}
