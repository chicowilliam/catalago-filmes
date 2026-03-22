import { htmlElement } from "./dom.js";

// ---------------------------------------------------------------------------
// Tema (dark / light)
// ---------------------------------------------------------------------------

export function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function hasExplicitThemePreference() {
  const savedTheme = localStorage.getItem("theme");
  return savedTheme === "dark" || savedTheme === "light";
}

export function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  if (normalizedTheme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    return;
  }
  htmlElement.removeAttribute("data-theme");
  localStorage.setItem("theme", "light");
}

export function setupThemeToggle(themeToggleEl) {
  if (!themeToggleEl) return;
  if (themeToggleEl.dataset.bound === "true") return;
  themeToggleEl.dataset.bound = "true";
  themeToggleEl.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme") || "light";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

export function disableLegacyPerformanceMode() {
  document.documentElement.removeAttribute("data-performance");
  localStorage.removeItem("performanceMode");
}
