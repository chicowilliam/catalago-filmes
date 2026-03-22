import { SECTION_FADE_MS, FILTER_TRANSITION_MS } from "./config.js";
import { prefersReducedMotion } from "./config.js";
import { state } from "./state.js";
import {
  moviesGrid,
  seriesGrid,
  favoritesGrid,
  moviesSection,
  seriesSection,
  favoritesSection,
  aboutSection,
  stackSection,
  heroPanel,
  featuredCard,
  searchMeta,
  countAll,
  countMovies,
  countSeries,
  countFavorites,
} from "./dom.js";
import { favoritesManager, sanitizeUrl, showToast, setSearchFeedback } from "./utils.js";
import {
  animateHeroReveal,
  animateAboutReveal,
  animateStackFoldersReveal,
  setupMotionHoverBindings,
  setupRevealAnimations,
} from "./motion.js";
import { openModal } from "./modal.js";

// ---------------------------------------------------------------------------
// Lazy loading de imagens
// ---------------------------------------------------------------------------

export function initLazyLoading() {
  state.imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const realSrc = img.getAttribute("data-src");
        if (realSrc) {
          img.onload = () => img.classList.add("loaded");
          img.onerror = () => img.classList.add("loaded");
          img.src = realSrc;
          img.removeAttribute("data-src");
          state.imageObserver.unobserve(img);
        }
      });
    },
    { root: null, rootMargin: "120px", threshold: 0.02 }
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading (placeholder enquanto carrega)
// ---------------------------------------------------------------------------

function createSkeletonCard() {
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton-card";
  skeleton.innerHTML = `<div class="skeleton-media"></div><div class="skeleton-title"></div>`;
  return skeleton;
}

export function renderSkeletons() {
  getVisibleGrids().forEach((grid) => {
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < 6; i += 1) {
      grid.appendChild(createSkeletonCard());
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers de grid
// ---------------------------------------------------------------------------

export function getVisibleGrids() {
  const visibilityMap = [
    { section: moviesSection, grid: moviesGrid },
    { section: seriesSection, grid: seriesGrid },
    { section: favoritesSection, grid: favoritesGrid },
  ];

  if (state.currentType === "all") {
    return visibilityMap.map((entry) => entry.grid).filter(Boolean);
  }

  return visibilityMap
    .filter((entry) => entry.section && !entry.section.classList.contains("is-hidden"))
    .map((entry) => entry.grid)
    .filter(Boolean);
}

export function getGridColumnCount(gridElement) {
  if (!gridElement) return 1;
  const template = window.getComputedStyle(gridElement).gridTemplateColumns;
  const columns = template ? template.split(" ").filter(Boolean).length : 1;
  return Math.max(columns, 1);
}

// ---------------------------------------------------------------------------
// Toggle de seção com fade
// ---------------------------------------------------------------------------

export function toggleSection(sectionElement, show, options = {}) {
  if (!sectionElement) return;

  const { immediateHide = false } = options;
  const pendingTimer = state.sectionFadeTimers.get(sectionElement);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    state.sectionFadeTimers.delete(sectionElement);
  }

  if (show) {
    if (sectionElement.classList.contains("is-hidden")) {
      sectionElement.classList.add("section-fade-hidden");
      sectionElement.classList.remove("is-hidden");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          sectionElement.classList.remove("section-fade-hidden");
        });
      });
      return;
    }
    sectionElement.classList.remove("section-fade-hidden");
    return;
  }

  if (sectionElement.classList.contains("is-hidden")) return;

  if (immediateHide) {
    sectionElement.classList.add("section-fade-hidden");
    sectionElement.classList.add("is-hidden");
    return;
  }

  sectionElement.classList.add("section-fade-hidden");
  const timeoutId = window.setTimeout(() => {
    sectionElement.classList.add("is-hidden");
    state.sectionFadeTimers.delete(sectionElement);
  }, SECTION_FADE_MS);
  state.sectionFadeTimers.set(sectionElement, timeoutId);
}

// ---------------------------------------------------------------------------
// Contadores do cabeçalho
// ---------------------------------------------------------------------------

function updateCounters(movies, series, favorites) {
  if (countMovies) countMovies.textContent = String(movies.length);
  if (countSeries) countSeries.textContent = String(series.length);
  if (countFavorites) countFavorites.textContent = String(favorites.length);
  if (countAll) countAll.textContent = String(movies.length + series.length);
}

// ---------------------------------------------------------------------------
// Resumo do resultado da busca
// ---------------------------------------------------------------------------

function updateSearchResultSummary(movies, series, favorites) {
  if (!searchMeta) return;

  if (state.currentType === "about") {
    setSearchFeedback("Visão geral do projeto e da stack", "idle");
    return;
  }

  const totalVisible = movies.length + series.length + favorites.length;
  const hasSearch = Boolean(state.currentSearch);

  if (hasSearch) {
    const plural = totalVisible === 1 ? "resultado" : "resultados";
    setSearchFeedback(`${totalVisible} ${plural} para "${state.currentSearch}"`);
    return;
  }

  setSearchFeedback(`${totalVisible} titulos prontos para explorar`);
}

// ---------------------------------------------------------------------------
// Card de filme/série
// ---------------------------------------------------------------------------

export function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Abrir detalhes de ${item.title}`);
  card.style.setProperty("--card-pop-delay", `${Math.round(Math.random() * 140)}ms`);

  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type === "movie" ? "Filme" : "Série";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.type = "button";
  favoriteBtn.setAttribute("aria-label", "Adicionar ou remover favorito");
  favoriteBtn.classList.add(favoritesManager.isFavorite(item.id) ? "favorited" : "not-favorited");
  favoriteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" class="heart-icon" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  favoriteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (favoritesManager.isFavorite(item.id)) {
      favoritesManager.removeFavorite(item.id);
      showToast("Removido dos favoritos", "info");
    } else {
      favoritesManager.addFavorite(item);
      showToast("Adicionado aos favoritos", "success");
    }
    renderCurrentView();
  });

  const img = document.createElement("img");
  img.className = "movie-image";
  img.setAttribute("data-src", item.image);
  img.src =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%23121422' width='400' height='600'/%3E%3C/svg%3E";
  img.alt = item.title;

  if (state.imageObserver) state.imageObserver.observe(img);

  mediaDiv.appendChild(badge);
  mediaDiv.appendChild(favoriteBtn);
  mediaDiv.appendChild(img);

  const infoDiv = document.createElement("div");
  infoDiv.className = "card-info";

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "movie-meta";
  meta.textContent = item.type === "movie" ? "Filme" : "Serie";

  infoDiv.appendChild(title);
  infoDiv.appendChild(meta);

  card.appendChild(mediaDiv);
  card.appendChild(infoDiv);
  card.addEventListener("click", () => openModal(item));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(item);
    }
  });

  return card;
}

// ---------------------------------------------------------------------------
// Renderização de grid
// ---------------------------------------------------------------------------

export function renderGrid(grid, items, emptyMessage) {
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = `<p class="empty-grid-message">${emptyMessage}</p>`;
    return;
  }
  items.forEach((item) => grid.appendChild(createMovieCard(item)));
}

// ---------------------------------------------------------------------------
// Destaque (featured card)
// ---------------------------------------------------------------------------

export function renderFeatured(movies, series, favorites) {
  const featured = movies[0] || series[0] || favorites[0];

  if (!featured) {
    featuredCard.innerHTML = "<p class='featured-empty'>Nenhum conteúdo disponível no momento.</p>";
    return;
  }

  const safeImageUrl = sanitizeUrl(featured.image);
  if (safeImageUrl) {
    featuredCard.style.setProperty("--featured-image", `url('${safeImageUrl}')`);
    featuredCard.classList.remove("featured-no-image");
  } else {
    featuredCard.style.setProperty("--featured-image", "none");
    featuredCard.classList.add("featured-no-image");
  }
  featuredCard.innerHTML = "";

  const tag = document.createElement("span");
  tag.className = "featured-tag";
  tag.textContent = `Destaque • ${state.currentCatalogSource === "tmdb" ? "TMDB" : "Local"}`;

  const title = document.createElement("h3");
  title.textContent = featured.title || "Titulo indisponivel";

  const synopsis = document.createElement("p");
  synopsis.textContent = featured.synopsis || "Sinopse indisponivel.";

  const actionBtn = document.createElement("button");
  actionBtn.className = "featured-action";
  actionBtn.type = "button";
  actionBtn.textContent = "Assistir trailer";
  actionBtn.addEventListener("click", () => openModal(featured));

  const contentWrap = document.createElement("div");
  contentWrap.className = "featured-motion-content";
  contentWrap.appendChild(tag);
  contentWrap.appendChild(title);
  contentWrap.appendChild(synopsis);
  contentWrap.appendChild(actionBtn);
  featuredCard.appendChild(contentWrap);

  animateHeroReveal();
}

// ---------------------------------------------------------------------------
// Transição de filtro
// ---------------------------------------------------------------------------

export function applyFilterState(nextType) {
  state.currentType = nextType;
  renderCurrentView();
}

export function applyFilterWithTransition(nextType) {
  if (nextType === state.currentType) return;

  if (prefersReducedMotion) {
    applyFilterState(nextType);
    return;
  }

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(() => applyFilterState(nextType));
    return;
  }

  if (state.filterTransitionTimer) clearTimeout(state.filterTransitionTimer);

  document.body.classList.add("is-filter-transitioning");
  state.filterTransitionTimer = setTimeout(() => {
    applyFilterState(nextType);
    document.body.classList.remove("is-filter-transitioning");
    state.filterTransitionTimer = null;
  }, FILTER_TRANSITION_MS);
}

// ---------------------------------------------------------------------------
// Renderização principal — orquestra todas as seções
// ---------------------------------------------------------------------------

export function renderCurrentView() {
  const movies = state.allItems.filter((item) => item.type === "movie");
  const series = state.allItems.filter((item) => item.type === "series");
  const favorites = favoritesManager
    .getFavorites()
    .filter((item) => item.title.toLowerCase().includes(state.currentSearch.toLowerCase()));

  const isAboutView = state.currentType === "about";
  document.body.classList.toggle("about-view-active", isAboutView);

  updateCounters(movies, series, favorites);
  updateSearchResultSummary(movies, series, favorites);

  if (isAboutView) {
    toggleSection(heroPanel, false, { immediateHide: true });
    toggleSection(aboutSection, true);
    toggleSection(stackSection, true);
    toggleSection(moviesSection, false);
    toggleSection(seriesSection, false);
    toggleSection(favoritesSection, false);
    window.requestAnimationFrame(() => {
      animateAboutReveal();
      animateStackFoldersReveal();
      setupMotionHoverBindings();
    });
    return;
  }

  toggleSection(heroPanel, true);
  renderFeatured(movies, series, favorites);
  toggleSection(aboutSection, false);
  toggleSection(stackSection, false);

  if (state.currentType === "movie") {
    toggleSection(moviesSection, true);
    toggleSection(seriesSection, false);
    toggleSection(favoritesSection, false);
    renderGrid(moviesGrid, movies, "Nenhum filme encontrado.");
    return;
  }

  if (state.currentType === "series") {
    toggleSection(moviesSection, false);
    toggleSection(seriesSection, true);
    toggleSection(favoritesSection, false);
    renderGrid(seriesGrid, series, "Nenhuma série encontrada.");
    return;
  }

  if (state.currentType === "favorites") {
    toggleSection(moviesSection, false);
    toggleSection(seriesSection, false);
    toggleSection(favoritesSection, true);
    renderGrid(favoritesGrid, favorites, "Você ainda não adicionou favoritos.");
    return;
  }

  toggleSection(moviesSection, true);
  toggleSection(seriesSection, true);
  toggleSection(favoritesSection, true);
  renderGrid(moviesGrid, movies, "Nenhum filme encontrado.");
  renderGrid(seriesGrid, series, "Nenhuma série encontrada.");
  renderGrid(favoritesGrid, favorites, "Você ainda não adicionou favoritos.");
  setupRevealAnimations();
}
