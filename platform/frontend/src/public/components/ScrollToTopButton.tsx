import { useEffect, useState } from "react";
import type { Language } from "../types";

interface ScrollToTopButtonProps {
  language: Language;
}

export function ScrollToTopButton({ language }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 450);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsClicked(true);
    window.setTimeout(() => {
      setIsClicked(false);
    }, 150);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ariaLabel = language === "ru" ? "Прокрутить вверх" : "Scroll to top";

  return (
    <button
      type="button"
      className={`scroll-to-top ${isVisible ? "visible" : ""} ${isClicked ? "clicked" : ""}`}
      onClick={scrollToTop}
      aria-label={ariaLabel}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
