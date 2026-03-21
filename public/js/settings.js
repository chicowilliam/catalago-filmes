import { PERFORMANCE_STORAGE_KEY } from "./config.js";
import { state } from "./state.js";
import { htmlElement, performanceToggle } from "./dom.js";
import { resetHeroParallaxState, setupMotionEnhancements, setupRevealAnimations } from "./motion.js";
import { renderCurrentView } from "./render.js";

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

// ---------------------------------------------------------------------------
// Modo performance (desabilita animações pesadas)
// ---------------------------------------------------------------------------

function updatePerformanceToggleLabel() {
  if (!performanceToggle) return;
  performanceToggle.textContent = `Performance: ${state.isPerformanceMode ? "On" : "Off"}`;
  performanceToggle.setAttribute("aria-pressed", String(state.isPerformanceMode));
}

export function loadPerformancePreference() {
  const value = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
  if (value !== "on" && value !== "off" && value !== null) {
    localStorage.removeItem(PERFORMANCE_STORAGE_KEY);
  }
  return value === "on";
}

export function applyPerformanceMode(enabled) {
  state.isPerformanceMode = Boolean(enabled);

  if (state.isPerformanceMode) {
    document.documentElement.setAttribute("data-performance", "on");
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, "on");
    if (state.revealObserver) {
      state.revealObserver.disconnect();
      state.revealObserver = null;
    }
    resetHeroParallaxState();
  } else {
    document.documentElement.removeAttribute("data-performance");
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, "off");
  }

  updatePerformanceToggleLabel();
}

export function setupPerformanceToggle() {
  if (!performanceToggle) return;
  if (performanceToggle.dataset.bound === "true") return;
  performanceToggle.dataset.bound = "true";
  performanceToggle.addEventListener("click", () => {
    applyPerformanceMode(!state.isPerformanceMode);
    setupMotionEnhancements();
    setupRevealAnimations();
    renderCurrentView();
  });
}
