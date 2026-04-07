import { useMemo } from "react";
import type { Language } from "../types";

interface Token {
  type: "keyword" | "string" | "comment" | "number" | "punctuation" | "text";
  value: string;
}

const KEYWORDS: Record<string, Set<string>> = {
  javascript: new Set([
    "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "class", "import", "export", "from", "default", "new", "this", "async",
    "await", "try", "catch", "throw", "typeof", "instanceof", "true", "false",
    "null", "undefined", "switch", "case", "break", "continue", "of", "in"
  ]),
  python: new Set([
    "def", "class", "return", "if", "elif", "else", "for", "while", "import",
    "from", "as", "try", "except", "raise", "with", "lambda", "yield", "pass",
    "break", "continue", "and", "or", "not", "in", "is", "True", "False",
    "None", "self", "print", "range", "len", "list", "dict", "set", "tuple"
  ]),
  csharp: new Set([
    "using", "namespace", "class", "public", "private", "protected", "static",
    "void", "int", "string", "bool", "var", "new", "return", "if", "else",
    "for", "foreach", "while", "switch", "case", "break", "try", "catch",
    "throw", "async", "await", "null", "true", "false", "this", "base",
    "override", "virtual", "abstract", "sealed", "readonly", "const", "record"
  ]),
  html: new Set([
    "html", "head", "body", "div", "span", "p", "a", "img", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "form", "input", "button", "script",
    "style", "link", "meta", "title", "section", "nav", "header", "footer",
    "main", "article", "class", "id", "src", "href", "type", "rel"
  ]),
  css: new Set([
    "display", "position", "margin", "padding", "border", "background", "color",
    "font", "width", "height", "flex", "grid", "align", "justify", "gap",
    "top", "left", "right", "bottom", "transform", "transition", "animation",
    "opacity", "overflow", "z-index", "none", "block", "inline", "relative",
    "absolute", "fixed", "sticky", "auto", "inherit", "important"
  ])
};

function tokenize(code: string, language: string): Token[] {
  const keywords = KEYWORDS[language] ?? KEYWORDS["javascript"]!;
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Single-line comments
    if (
      (code[i] === "/" && code[i + 1] === "/") ||
      (code[i] === "#" && (language === "python" || language === "css"))
    ) {
      const end = code.indexOf("\n", i);
      const commentEnd = end === -1 ? code.length : end;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }

    // Multi-line comments
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const commentEnd = end === -1 ? code.length : end + 2;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }

    // HTML comments
    if (code[i] === "<" && code.slice(i, i + 4) === "<!--") {
      const end = code.indexOf("-->", i + 4);
      const commentEnd = end === -1 ? code.length : end + 3;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i]!;
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i]!)) {
      let j = i;
      while (j < code.length && /[\d.xXa-fA-F]/.test(code[j]!)) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Words (keywords or plain text)
    if (/[a-zA-Z_$]/.test(code[i]!)) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j]!)) j++;
      const word = code.slice(i, j);
      tokens.push({
        type: keywords.has(word) ? "keyword" : "text",
        value: word
      });
      i = j;
      continue;
    }

    // Punctuation and operators
    if (/[{}()\[\];:.,<>=+\-*/%!&|^~?@]/.test(code[i]!)) {
      tokens.push({ type: "punctuation", value: code[i]! });
      i++;
      continue;
    }

    // Whitespace and anything else
    tokens.push({ type: "text", value: code[i]! });
    i++;
  }

  return tokens;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  csharp: "C#",
  html: "HTML",
  css: "CSS"
};

interface CodeSnippetBlockProps {
  code: string;
  language: string;
  uiLanguage: Language;
}

export function CodeSnippetBlock({ code, language }: CodeSnippetBlockProps) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  const lines = code.split("\n");
  const label = LANGUAGE_LABELS[language] ?? language;

  return (
    <div className="code-snippet">
      <div className="code-snippet__header">
        <span className="code-snippet__lang">{label}</span>
      </div>
      <div className="code-snippet__body">
        <div className="code-snippet__lines" aria-hidden="true">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre className="code-snippet__code">
          <code>
            {tokens.map((token, i) => (
              <span key={i} className={`code-snippet__token--${token.type}`}>
                {token.value}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
