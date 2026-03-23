/**
 * script.js - Entry point da aplicacao
 *
 * Este arquivo apenas importa os modulos e registra os event listeners globais.
 * Toda a logica esta dividida nos arquivos abaixo:
 *
 *  config.js          - constantes e configuracoes
 *  state.js           - estado mutavel compartilhado
 *  dom.js             - referencias aos elementos do DOM
 *  utils.js           - utilitarios, storage, FavoritesManager, RatingManager
 *  motion.js          - animacoes GSAP, reveal, parallax
 *  modal.js           - abertura/fechamento de modais
 *  render.js          - criacao de cards, grids, featured, secoes
 *  catalog.js         - chamadas a API e auto-refresh
 *  auth.js            - formulario de login
 *  settings.js        - tema
 *  portfolio-sections.js - dados e UI da stack de tecnologias
 */

import { renderStackFolders, setupFilterControls } from "./portfolio-sections.js";
import { state } from "./state.js";
import { searchInput, stackFoldersContainer, themeToggle, modal, loader } from "./dom.js";
import { setSearchFeedback } from "./utils.js";
import { loadCatalog, stopAutoCatalogRefresh, updateCatalogSourceIndicator } from "./catalog.js";
import { applyFilterWithTransition, getGridColumnCount, setupGridInteractions } from "./render.js";
import { openStackModal, closeModal } from "./modal.js";
import { setupMotionEnhancements, setupMotionHoverBindings } from "./motion.js";
import {
  applyTheme,
  getInitialTheme,
  hasExplicitThemePreference,
  setupThemeToggle,
  disableLegacyPerformanceMode,
} from "./settings.js";
import { validateRuntimeContext, setupLoginForm } from "./auth.js";

// ---------------------------------------------------------------------------
// Controles de filtro (navbar)
// ---------------------------------------------------------------------------

const filterGroup = document.querySelector(".filter-group");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
setupFilterControls(filterGroup, filterButtons, applyFilterWithTransition);

// ---------------------------------------------------------------------------
// Busca com debounce
// ---------------------------------------------------------------------------

searchInput.addEventListener("input", (event) => {
  const searchValue = event.target.value.trim();
  setSearchFeedback("Buscando no catalogo...", "loading");
  if (state.debounceTimer) clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    state.currentSearch = searchValue;
    loadCatalog(state.currentSearch);
  }, 350);
});

// ---------------------------------------------------------------------------
// Fechar modal ao clicar no fundo
// ---------------------------------------------------------------------------

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// ---------------------------------------------------------------------------
// Atalhos de teclado
// ---------------------------------------------------------------------------

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
    return;
  }

  if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) {
    const activeCard = document.activeElement;
    if (activeCard && activeCard.classList.contains("movie-card")) {
      event.preventDefault();
      const parentGrid = activeCard.closest(".movies-grid");
      const cards = parentGrid ? Array.from(parentGrid.querySelectorAll(".movie-card")) : [];
      const currentIndex = cards.indexOf(activeCard);
      if (currentIndex === -1) return;

      const columns = getGridColumnCount(parentGrid);
      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = Math.min(cards.length - 1, currentIndex + 1);
      if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
      if (event.key === "ArrowDown") nextIndex = Math.min(cards.length - 1, currentIndex + columns);
      if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - columns);
      cards[nextIndex].focus();
      return;
    }
  }

  if (event.key === "Escape") closeModal();
});

// ---------------------------------------------------------------------------
// Inicializacao ao carregar a pagina
// ---------------------------------------------------------------------------

let hasInitializedUi = false;

function initializeUi() {
  if (hasInitializedUi) return;
  hasInitializedUi = true;

  renderStackFolders(stackFoldersContainer, openStackModal);
  disableLegacyPerformanceMode();
  applyTheme(getInitialTheme());
  validateRuntimeContext();
  updateCatalogSourceIndicator(state.currentCatalogSource);
  setSearchFeedback("Catalogo pronto para explorar");
  loader.classList.add("hide");
  setupMotionEnhancements();
  setupMotionHoverBindings();
  setupGridInteractions();
  setupThemeToggle(themeToggle);
  setupLoginForm();
}

document.addEventListener("DOMContentLoaded", initializeUi);
window.addEventListener("load", initializeUi);

window.addEventListener("beforeunload", stopAutoCatalogRefresh);

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (hasExplicitThemePreference()) {
      return;
    }
    applyTheme(event.matches ? "dark" : "light");
  });
}
