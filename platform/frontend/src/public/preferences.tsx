import {
  createContext,
  useContext,
  useMemo,
  type ReactNode
} from "react";
import type { Language, ThemeMode } from "./types";
import { useTheme } from "../shared/theme/ThemeContext";

interface PreferencesContextValue {
  theme: ThemeMode;
  language: Language;
  setTheme: (value: ThemeMode) => void;
  setLanguage: (value: Language) => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme, language, setTheme, setLanguage } = useTheme();

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      language,
      setTheme,
      setLanguage,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark")
    }),
    [theme, language, setTheme, setLanguage]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }
  return context;
}
