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
  if (state.imageObserver) {
    state.imageObserver.disconnect();
  }

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
    if (state.disableSectionFade) {
      sectionElement.classList.remove("is-hidden");
      sectionElement.classList.remove("section-fade-hidden");
      return;
    }

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

  if (immediateHide || state.disableSectionFade) {
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
  card.dataset.itemId = String(item.id);
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
  favoriteBtn.setAttribute("data-action", "toggle-favorite");
  favoriteBtn.setAttribute("aria-label", "Adicionar ou remover favorito");
  favoriteBtn.classList.add(favoritesManager.isFavorite(item.id) ? "favorited" : "not-favorited");
  favoriteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" class="heart-icon" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  const img = document.createElement("img");
  img.className = "movie-image";
  img.setAttribute("data-src", item.image);
  img.loading = "lazy";
  img.decoding = "async";
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

  return card;
}

function getItemById(itemId) {
  const fromCatalog = state.allItems.find((item) => String(item.id) === String(itemId));
  if (fromCatalog) return fromCatalog;
  return favoritesManager.getFavorites().find((item) => String(item.id) === String(itemId)) || null;
}

export function setupGridInteractions() {
  if (state.gridInteractionsReady) return;

  const grids = [moviesGrid, seriesGrid, favoritesGrid].filter(Boolean);

  const onClick = (event) => {
    const favoriteButton = event.target.closest(".favorite-btn");
    const card = event.target.closest(".movie-card");
    if (!card) return;

    const item = getItemById(card.dataset.itemId);
    if (!item) return;

    if (favoriteButton) {
      event.stopPropagation();
      if (favoritesManager.isFavorite(item.id)) {
        favoritesManager.removeFavorite(item.id);
        showToast("Removido dos favoritos", "info");
      } else {
        favoritesManager.addFavorite(item);
        showToast("Adicionado aos favoritos", "success");
      }
      renderCurrentView();
      return;
    }

    openModal(item);
  };

  const onKeydown = (event) => {
    const card = event.target.closest(".movie-card");
    if (!card) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    const item = getItemById(card.dataset.itemId);
    if (!item) return;

    event.preventDefault();
    openModal(item);
  };

  grids.forEach((grid) => {
    grid.addEventListener("click", onClick);
    grid.addEventListener("keydown", onKeydown);
  });

  state.gridInteractionsReady = true;
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

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.appendChild(createMovieCard(item)));
  grid.appendChild(fragment);
}

// ---------------------------------------------------------------------------
// Destaque (slider de filmes em destaque)
// ---------------------------------------------------------------------------

const SLIDER_INTERVAL_MS = 6000;
let _cleanupSlider = null;

function buildFeaturedSlider(candidates) {
  if (_cleanupSlider) {
    _cleanupSlider();
    _cleanupSlider = null;
  }

  featuredCard.innerHTML = "";
  featuredCard.className = "featured-card";
  featuredCard.style.removeProperty("--featured-image");

  const slider = document.createElement("div");
  slider.className = "featured-slider";

  const track = document.createElement("div");
  track.className = "featured-slides-track";

  const slides = candidates.map((item, index) => {
    const slide = document.createElement("div");
    slide.className = "featured-slide" + (index === 0 ? " is-active" : "");

    const safeImg = sanitizeUrl(item.image);
    const bannerImg = safeImg
      ? safeImg.replace("/w500/", "/w1280/").replace("/w780/", "/w1280/")
      : "";
    slide.style.setProperty("--slide-image", bannerImg ? `url('${bannerImg}')` : "none");
    if (!safeImg) slide.classList.add("featured-no-image");

    const posterLayer = document.createElement("div");
    posterLayer.className = "featured-poster-layer";
    slide.appendChild(posterLayer);

    const content = document.createElement("div");
    content.className = "featured-motion-content";

    const tag = document.createElement("span");
    tag.className = "featured-tag";
    tag.textContent = `${item.type === "movie" ? "Filme" : "Série"} • ${
      state.currentCatalogSource === "tmdb" ? "TMDB" : "Local"
    }`;

    const title = document.createElement("h3");
    title.textContent = item.title || "Titulo indisponivel";

    const synopsis = document.createElement("p");
    synopsis.textContent = item.synopsis || "Sinopse indisponivel.";

    const actionBtn = document.createElement("button");
    actionBtn.className = "featured-action";
    actionBtn.type = "button";
    actionBtn.textContent = "Assistir trailer";
    actionBtn.addEventListener("click", () => openModal(item));

    content.appendChild(tag);
    content.appendChild(title);
    content.appendChild(synopsis);
    content.appendChild(actionBtn);
    slide.appendChild(content);
    return slide;
  });

  slides.forEach((slide) => track.appendChild(slide));
  slider.appendChild(track);

  // Controles de navegação
  const controls = document.createElement("div");
  controls.className = "slider-controls";

  const prevBtn = document.createElement("button");
  prevBtn.className = "slider-btn slider-prev";
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Slide anterior");
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`;

  const dotsWrap = document.createElement("div");
  dotsWrap.className = "slider-dots";

  const dots = candidates.map((_, i) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot" + (i === 0 ? " active" : "");
    dot.type = "button";
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    return dot;
  });
  dots.forEach((d) => dotsWrap.appendChild(d));

  const nextBtn = document.createElement("button");
  nextBtn.className = "slider-btn slider-next";
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Próximo slide");
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;

  controls.appendChild(prevBtn);
  controls.appendChild(dotsWrap);
  controls.appendChild(nextBtn);
  slider.appendChild(controls);
  featuredCard.appendChild(slider);

  // Lógica do slider
  let current = 0;
  const total = candidates.length;

  function goTo(index) {
    const prev = current;
    current = ((index % total) + total) % total;
    if (current === prev) return;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides[prev].classList.remove("is-active");
    dots[prev].classList.remove("active");
    slides[current].classList.add("is-active");
    dots[current].classList.add("active");
  }

  function startAuto() {
    if (state.sliderAutoTimer) clearInterval(state.sliderAutoTimer);
    state.sliderAutoTimer = setInterval(() => goTo(current + 1), SLIDER_INTERVAL_MS);
  }

  function stopAuto() {
    if (state.sliderAutoTimer) {
      clearInterval(state.sliderAutoTimer);
      state.sliderAutoTimer = null;
    }
  }

  nextBtn.addEventListener("click", () => { goTo(current + 1); stopAuto(); startAuto(); });
  prevBtn.addEventListener("click", () => { goTo(current - 1); stopAuto(); startAuto(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { goTo(i); stopAuto(); startAuto(); }));

  const onEnter = () => stopAuto();
  const onLeave = () => startAuto();
  featuredCard.addEventListener("mouseenter", onEnter);
  featuredCard.addEventListener("mouseleave", onLeave);

  _cleanupSlider = () => {
    stopAuto();
    featuredCard.removeEventListener("mouseenter", onEnter);
    featuredCard.removeEventListener("mouseleave", onLeave);
  };

  startAuto();
}

export function renderFeatured(movies, series, favorites) {
  if (_cleanupSlider) {
    _cleanupSlider();
    _cleanupSlider = null;
  }

  // Intercalar filmes e séries, máximo 5 itens no slider
  const candidates = [];
  let mi = 0;
  let si = 0;
  while (candidates.length < 5) {
    let added = false;
    if (mi < movies.length) { candidates.push(movies[mi++]); added = true; }
    if (candidates.length < 5 && si < series.length) { candidates.push(series[si++]); added = true; }
    if (!added) break;
  }
  if (!candidates.length) candidates.push(...favorites.slice(0, 5));

  if (!candidates.length) {
    featuredCard.innerHTML = "<p class='featured-empty'>Nenhum conteúdo disponível no momento.</p>";
    return;
  }

  buildFeaturedSlider(candidates);
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
  if (nextType === state.currentType && !state.isFilterTransitioning) return;

  if (prefersReducedMotion) {
    document.body.classList.remove("is-filter-transitioning", "tab-exit-active", "tab-enter-active");
    state.isFilterTransitioning = false;
    applyFilterState(nextType);
    return;
  }

  if (state.filterTransitionTimer) clearTimeout(state.filterTransitionTimer);
  if (state.filterTransitionEnterTimer) clearTimeout(state.filterTransitionEnterTimer);

  const runId = state.filterTransitionRunId + 1;
  state.filterTransitionRunId = runId;
  state.isFilterTransitioning = true;

  const totalMs = Math.max(FILTER_TRANSITION_MS, 380);
  const exitMs = Math.round(totalMs * 0.36);
  const enterMs = Math.max(totalMs - exitMs, 220);

  document.body.classList.remove("tab-enter-active");
  document.body.classList.add("is-filter-transitioning", "tab-exit-active");

  state.filterTransitionTimer = setTimeout(() => {
    if (runId !== state.filterTransitionRunId) return;

    state.disableSectionFade = true;
    applyFilterState(nextType);
    state.disableSectionFade = false;

    document.body.classList.remove("tab-exit-active");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (runId !== state.filterTransitionRunId) return;

        document.body.classList.add("tab-enter-active");
        state.filterTransitionEnterTimer = setTimeout(() => {
          if (runId !== state.filterTransitionRunId) return;

          document.body.classList.remove("is-filter-transitioning", "tab-enter-active");
          state.isFilterTransitioning = false;
          state.filterTransitionEnterTimer = null;
        }, enterMs);
      });
    });

    state.filterTransitionTimer = null;
  }, exitMs);
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

  const isHomeView = state.currentType === "all";
  toggleSection(heroPanel, isHomeView, { immediateHide: true });
  if (isHomeView) renderFeatured(movies, series, favorites);
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
