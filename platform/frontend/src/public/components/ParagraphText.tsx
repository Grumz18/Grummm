import { Fragment } from "react";

interface ParagraphTextProps {
  text: string;
  className?: string;
}

function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function ParagraphText({ text, className }: ParagraphTextProps) {
  const paragraphs = toParagraphs(text);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph, paragraphIdx) => (
        <p key={paragraphIdx} className={className}>
          {paragraph.split("\n").map((line, lineIdx) => (
            <Fragment key={lineIdx}>
              {line}
              {lineIdx < paragraph.split("\n").length - 1 ? <br /> : null}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
