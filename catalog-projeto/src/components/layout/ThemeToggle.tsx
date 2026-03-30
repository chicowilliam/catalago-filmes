import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("theme-transition");
    html.setAttribute("data-theme", theme);
    const timer = window.setTimeout(() => html.classList.remove("theme-transition"), 350);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    return () => window.clearTimeout(timer);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle-switch"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      aria-pressed={isLight}
      type="button"
    >
      <span className="theme-toggle-icon">{isLight ? "☀️" : "🌙"}</span>
      <motion.div
        className="theme-toggle-handle"
        layout
        transition={{ type: "spring", visualDuration: 0.2, bounce: 0.2 }}
      />
    </button>
  );
}
