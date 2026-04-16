import { useState, useEffect } from 'react';
import { t } from '../../shared/i18n'; 
import type { Language } from '../types'; 

interface ScrollToTopButtonProps {
  language: Language;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ language }) => {
  
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 450);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 150);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`scroll-to-top ${isVisible ? 'visible' : ''} ${isClicked ? 'clicked' : ''}`}
      onClick={scrollToTop}
      aria-label={t("public.scroll.top", language)}
      type="button"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};