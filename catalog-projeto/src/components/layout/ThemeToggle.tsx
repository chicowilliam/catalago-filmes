import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Ambiente sem localStorage disponível.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { text } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("theme-transition");
    html.setAttribute("data-theme", theme);
    const timer = window.setTimeout(() => html.classList.remove("theme-transition"), 350);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignora falha de persistência para não quebrar UX.
    }
    return () => window.clearTimeout(timer);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? text.activateDarkMode : text.activateLightMode}
      aria-pressed={isLight}
      type="button"
      title={isLight ? text.darkMode : text.lightMode}
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
