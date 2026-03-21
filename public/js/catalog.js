import { REQUEST_TIMEOUT_MS, AUTO_REFRESH_MS } from "./config.js";
import { state } from "./state.js";
import { loader } from "./dom.js";
import { showToast, setSearchFeedback } from "./utils.js";
import { renderCurrentView, renderSkeletons, getVisibleGrids } from "./render.js";

// ---------------------------------------------------------------------------
// Indicador de fonte do catálogo (TMDB vs Local)
// ---------------------------------------------------------------------------

export function updateCatalogSourceIndicator(source) {
  const heroKicker = document.querySelector(".hero-kicker");
  if (!heroKicker) return;
  heroKicker.textContent = `Streaming Portfolio • Fonte: ${source === "tmdb" ? "TMDB" : "Local"}`;
}

// ---------------------------------------------------------------------------
// Retry inline (aparece no grid quando a API falha)
// ---------------------------------------------------------------------------

function renderInlineRetry(grid, message) {
  if (!grid) return;
  grid.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "grid-feedback";

  const text = document.createElement("p");
  text.className = "empty-grid-message";
  text.textContent = message;

  const retryBtn = document.createElement("button");
  retryBtn.className = "inline-retry-btn";
  retryBtn.type = "button";
  retryBtn.textContent = "Tentar novamente";
  retryBtn.addEventListener("click", () => loadCatalog(state.currentSearch, { showLoading: true }));

  wrapper.appendChild(text);
  wrapper.appendChild(retryBtn);
  grid.appendChild(wrapper);
}

// ---------------------------------------------------------------------------
// Carregamento do catálogo via API
// ---------------------------------------------------------------------------

export async function loadCatalog(search = "", options = {}) {
  const { showLoading = true } = options;
  const requestId = ++state.latestCatalogRequestId;

  if (state.activeCatalogController) state.activeCatalogController.abort();

  const controller = new AbortController();
  state.activeCatalogController = controller;

  const requestTimeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const loaderFailSafe = setTimeout(() => {
    if (showLoading) loader.classList.add("hide");
  }, REQUEST_TIMEOUT_MS + 1000);

  try {
    setSearchFeedback("Buscando no catalogo...", "loading");

    if (showLoading) {
      loader.classList.remove("hide");
      renderSkeletons();
    }

    const res = await fetch(`/api/catalog?type=all&search=${encodeURIComponent(search)}`, {
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Erro ao carregar catálogo: ${res.status}`);

    const response = await res.json();
    if (requestId !== state.latestCatalogRequestId) return;

    state.allItems = Array.isArray(response.data) ? response.data : [];
    state.currentCatalogSource = response.source || "local";
    updateCatalogSourceIndicator(state.currentCatalogSource);

    if (state.currentCatalogSource === "local-fallback" && !state.hasShownFallbackToast) {
      showToast("TMDB indisponivel no momento. Carregando catalogo local.", "info");
      state.hasShownFallbackToast = true;
    }

    if (state.currentCatalogSource === "tmdb") state.hasShownFallbackToast = false;

    if (state.currentCatalogSource === "tmdb" && state.allItems.length === 0) {
      console.warn("⚠ TMDB retornou 0 itens - verifique a chave de API ou ausência de poster_path.");
      showToast("⚠ Catalogo TMDB vazio - revise sua chave de API", "warning");
    }

    renderCurrentView();
  } catch (err) {
    if (requestId !== state.latestCatalogRequestId) return;
    if (err.name === "AbortError") return;

    console.error("Erro ao carregar catálogo:", err);
    getVisibleGrids().forEach((grid) => {
      renderInlineRetry(grid, "Erro ao carregar catalogo. Tente novamente.");
    });
    setSearchFeedback("Erro ao buscar. Clique em tentar novamente.", "error");
    showToast("Nao foi possivel carregar o catalogo agora.", "error");
  } finally {
    clearTimeout(requestTimeout);
    clearTimeout(loaderFailSafe);
    if (state.activeCatalogController === controller) state.activeCatalogController = null;
    if (showLoading) loader.classList.add("hide");
  }
}

// ---------------------------------------------------------------------------
// Auto-refresh do catálogo a cada AUTO_REFRESH_MS
// ---------------------------------------------------------------------------

export function startAutoCatalogRefresh() {
  if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
  state.autoRefreshTimer = setInterval(() => {
    loadCatalog(state.currentSearch, { showLoading: false });
  }, AUTO_REFRESH_MS);
}

export function stopAutoCatalogRefresh() {
  if (!state.autoRefreshTimer) return;
  clearInterval(state.autoRefreshTimer);
  state.autoRefreshTimer = null;
}
