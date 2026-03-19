const moviesGrid = document.getElementById("moviesGrid");
const seriesGrid = document.getElementById("seriesGrid");
const favoritesGrid = document.getElementById("favoritesGrid");
const moviesSection = document.getElementById("moviesSection");
const seriesSection = document.getElementById("seriesSection");
const favoritesSection = document.getElementById("favoritesSection");
const featuredCard = document.getElementById("featuredCard");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const countAll = document.getElementById("countAll");
const countMovies = document.getElementById("countMovies");
const countSeries = document.getElementById("countSeries");
const countFavorites = document.getElementById("countFavorites");

let currentType = "all";
let currentSearch = "";
let debounceTimer = null;
let imageObserver = null;
let allItems = [];
let currentCatalogSource = "local";
let hasShownFallbackToast = false;
const REQUEST_TIMEOUT_MS = 12000;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const LOGIN_MIN_LOADING_MS = 1000;
const LOGIN_TRANSITION_MS = 320;
const FILTER_TRANSITION_MS = 200;
const PERFORMANCE_STORAGE_KEY = "performanceMode";
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let autoRefreshTimer = null;
let revealObserver = null;
let heroParallaxRaf = null;
let heroParallax = { x: 0, y: 0 };
let scrollProgressReady = false;
let isPerformanceMode = false;
let filterTransitionTimer = null;

class FavoritesManager {
  constructor() {
    this.favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  }

  addFavorite(movie) {
    if (!this.isFavorite(movie.id)) {
      this.favorites.push(movie);
      this.save();
      return true;
    }
    return false;
  }

  removeFavorite(movieId) {
    this.favorites = this.favorites.filter((fav) => fav.id !== movieId);
    this.save();
  }

  isFavorite(movieId) {
    return this.favorites.some((fav) => fav.id === movieId);
  }

  save() {
    localStorage.setItem("favorites", JSON.stringify(this.favorites));
  }

  getFavorites() {
    return this.favorites;
  }
}

const favoritesManager = new FavoritesManager();

class RatingManager {
  constructor() {
    this.ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  }

  setRating(movieId, rating) {
    if (rating >= 1 && rating <= 5) {
      this.ratings[movieId] = rating;
      localStorage.setItem("ratings", JSON.stringify(this.ratings));
      return true;
    }
    return false;
  }

  getRating(movieId) {
    return this.ratings[movieId] || 0;
  }
}

const ratingManager = new RatingManager();

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function initLazyLoading() {
  imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const img = entry.target;
        const realSrc = img.getAttribute("data-src");

        if (realSrc) {
          img.onload = () => img.classList.add("loaded");
          img.onerror = () => img.classList.add("loaded");
          img.src = realSrc;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      });
    },
    {
      root: null,
      rootMargin: "120px",
      threshold: 0.02
    }
  );
}

function createSkeletonCard() {
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton-card";
  skeleton.innerHTML = `
    <div class="skeleton-media"></div>
    <div class="skeleton-title"></div>
  `;
  return skeleton;
}

function renderSkeletons() {
  [moviesGrid, seriesGrid, favoritesGrid].forEach((grid) => {
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    for (let i = 0; i < 6; i += 1) {
      grid.appendChild(createSkeletonCard());
    }
  });
}

function updateCatalogSourceIndicator(source) {
  const heroKicker = document.querySelector(".hero-kicker");
  if (!heroKicker) {
    return;
  }

  const sourceLabel = source === "tmdb" ? "TMDB" : "Local";
  heroKicker.textContent = `Streaming Portfolio • Fonte: ${sourceLabel}`;
}

function startAutoCatalogRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }

  autoRefreshTimer = setInterval(() => {
    loadCatalog(currentSearch, { showLoading: false });
  }, AUTO_REFRESH_MS);
}

function stopAutoCatalogRefresh() {
  if (!autoRefreshTimer) {
    return;
  }

  clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function updateScrollProgress() {
  const root = document.documentElement;
  const scrollTop = root.scrollTop || document.body.scrollTop;
  const scrollHeight = root.scrollHeight - root.clientHeight;
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  root.style.setProperty("--scroll-progress", progress.toFixed(4));
}

function loadPerformancePreference() {
  return localStorage.getItem(PERFORMANCE_STORAGE_KEY) === "on";
}

function updatePerformanceToggleLabel() {
  if (!performanceToggle) {
    return;
  }

  performanceToggle.textContent = `Performance: ${isPerformanceMode ? "On" : "Off"}`;
  performanceToggle.setAttribute("aria-pressed", String(isPerformanceMode));
}

function resetHeroParallaxState() {
  heroParallax.x = 0;
  heroParallax.y = 0;

  if (featuredCard) {
    featuredCard.style.setProperty("--parallax-x", "0px");
    featuredCard.style.setProperty("--parallax-y", "0px");
  }
}

function applyPerformanceMode(enabled) {
  isPerformanceMode = Boolean(enabled);

  if (isPerformanceMode) {
    document.documentElement.setAttribute("data-performance", "on");
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, "on");

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    resetHeroParallaxState();
  } else {
    document.documentElement.removeAttribute("data-performance");
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, "off");
  }

  updatePerformanceToggleLabel();
}

function setupScrollProgress() {
  if (prefersReducedMotion || isPerformanceMode || scrollProgressReady) {
    return;
  }

  scrollProgressReady = true;

  let ticking = false;

  const onScroll = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollProgress();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollProgress();
}

function setupRevealAnimations() {
  if (prefersReducedMotion || isPerformanceMode) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("reveal-visible");
    });

    return;
  }

  if (revealObserver) {
    revealObserver.disconnect();
  }

  const revealTargets = Array.from(document.querySelectorAll(".hero-copy, .featured-card, .section-block, .movie-card, .footer"));

  revealTargets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 28, 240)}ms`);
  });

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.14
    }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
}

function setupHeroParallax() {
  if (prefersReducedMotion || isPerformanceMode || !featuredCard || featuredCard.dataset.parallaxBound === "true") {
    return;
  }

  featuredCard.dataset.parallaxBound = "true";

  const maxMove = 10;

  const animate = () => {
    featuredCard.style.setProperty("--parallax-x", `${heroParallax.x.toFixed(2)}px`);
    featuredCard.style.setProperty("--parallax-y", `${heroParallax.y.toFixed(2)}px`);
    heroParallaxRaf = null;
  };

  const onMove = (event) => {
    const rect = featuredCard.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    heroParallax.x = x * maxMove;
    heroParallax.y = y * maxMove;

    if (!heroParallaxRaf) {
      heroParallaxRaf = window.requestAnimationFrame(animate);
    }
  };

  const onLeave = () => {
    heroParallax.x = 0;
    heroParallax.y = 0;

    if (!heroParallaxRaf) {
      heroParallaxRaf = window.requestAnimationFrame(animate);
    }
  };

  featuredCard.addEventListener("pointermove", onMove);
  featuredCard.addEventListener("pointerleave", onLeave);
}

function setupMotionEnhancements() {
  setupScrollProgress();
  setupRevealAnimations();
  setupHeroParallax();
}

function applyFilterState(nextType) {
  currentType = nextType;
  renderCurrentView();
}

function applyFilterWithTransition(nextType) {
  if (nextType === currentType) {
    return;
  }

  if (prefersReducedMotion || isPerformanceMode) {
    applyFilterState(nextType);
    return;
  }

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(() => {
      applyFilterState(nextType);
    });
    return;
  }

  if (filterTransitionTimer) {
    clearTimeout(filterTransitionTimer);
  }

  document.body.classList.add("is-filter-transitioning");
  filterTransitionTimer = setTimeout(() => {
    applyFilterState(nextType);
    document.body.classList.remove("is-filter-transitioning");
    filterTransitionTimer = null;
  }, FILTER_TRANSITION_MS);
}

async function ensureMinimumDelay(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = minimumMs - elapsed;

  if (remaining > 0) {
    await wait(remaining);
  }
}

async function animateLoginSuccess() {
  document.body.classList.add("app-ready");
  loginScreen.classList.add("is-exiting");
  await wait(LOGIN_TRANSITION_MS);
  loginScreen.style.display = "none";
  loginScreen.classList.remove("is-exiting");
}

async function loadCatalog(search = "", options = {}) {
  const { showLoading = true } = options;
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const loaderFailSafe = setTimeout(() => {
    if (showLoading) {
      loader.classList.add("hide");
    }
  }, REQUEST_TIMEOUT_MS + 1000);

  try {
    if (showLoading) {
      loader.classList.remove("hide");
      renderSkeletons();
    }

    const res = await fetch(`/api/catalog?type=all&search=${encodeURIComponent(search)}`, {
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`Erro ao carregar catálogo: ${res.status}`);
    }

    const response = await res.json();
    allItems = Array.isArray(response.data) ? response.data : [];
    currentCatalogSource = response.source || "local";
    updateCatalogSourceIndicator(currentCatalogSource);

    if (currentCatalogSource === "local-fallback" && !hasShownFallbackToast) {
      showToast("TMDB indisponivel no momento. Carregando catalogo local.", "info");
      hasShownFallbackToast = true;
    }

    if (currentCatalogSource === "tmdb") {
      hasShownFallbackToast = false;
    }

    renderCurrentView();
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("Timeout ao carregar catálogo.");
    } else {
      console.error("Erro ao carregar catálogo:", err);
    }

    [moviesGrid, seriesGrid, favoritesGrid].forEach((grid) => {
      if (grid) {
        grid.innerHTML = "<p class='empty-grid-message'>Erro ao carregar catálogo. Tente novamente.</p>";
      }
    });
    showToast("Nao foi possivel carregar o catalogo agora.", "error");
  } finally {
    clearTimeout(requestTimeout);
    clearTimeout(loaderFailSafe);
    if (showLoading) {
      loader.classList.add("hide");
    }
  }
}

function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.style.setProperty("--card-pop-delay", isPerformanceMode ? "0ms" : `${Math.round(Math.random() * 140)}ms`);

  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type === "movie" ? "Filme" : "Série";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.type = "button";
  favoriteBtn.setAttribute("aria-label", "Adicionar ou remover favorito");

  const isFav = favoritesManager.isFavorite(item.id);
  favoriteBtn.classList.add(isFav ? "favorited" : "not-favorited");
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
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%23121422' width='400' height='600'/%3E%3C/svg%3E";
  img.alt = item.title;

  if (imageObserver) {
    imageObserver.observe(img);
  }

  mediaDiv.appendChild(badge);
  mediaDiv.appendChild(favoriteBtn);
  mediaDiv.appendChild(img);

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = item.title;

  card.appendChild(mediaDiv);
  card.appendChild(title);
  card.addEventListener("click", () => openModal(item));

  return card;
}

function renderGrid(grid, items, emptyMessage) {
  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `<p class="empty-grid-message">${emptyMessage}</p>`;
    return;
  }

  items.forEach((item) => {
    grid.appendChild(createMovieCard(item));
  });
}

function toggleSection(sectionElement, show) {
  sectionElement.classList.toggle("is-hidden", !show);
}

function updateCounters(movies, series, favorites) {
  countMovies.textContent = String(movies.length);
  countSeries.textContent = String(series.length);
  countFavorites.textContent = String(favorites.length);
  countAll.textContent = String(movies.length + series.length);
}

function renderFeatured(movies, series, favorites) {
  const featured = movies[0] || series[0] || favorites[0];

  if (!featured) {
    featuredCard.innerHTML = "<p class='featured-empty'>Nenhum conteúdo disponível no momento.</p>";
    return;
  }

  featuredCard.style.setProperty("--featured-image", `url('${featured.image}')`);
  featuredCard.innerHTML = `
    <span class="featured-tag">Destaque da semana</span>
    <h3>${featured.title}</h3>
    <p>${featured.synopsis}</p>
    <button class="featured-action" type="button">Assistir trailer</button>
  `;

  const actionBtn = featuredCard.querySelector(".featured-action");
  if (actionBtn) {
    actionBtn.addEventListener("click", () => openModal(featured));
  }
}

function renderCurrentView() {
  const movies = allItems.filter((item) => item.type === "movie");
  const series = allItems.filter((item) => item.type === "series");
  const favorites = favoritesManager
    .getFavorites()
    .filter((item) => item.title.toLowerCase().includes(currentSearch.toLowerCase()));

  updateCounters(movies, series, favorites);
  renderFeatured(movies, series, favorites);

  if (currentType === "movie") {
    toggleSection(moviesSection, true);
    toggleSection(seriesSection, false);
    toggleSection(favoritesSection, false);
    renderGrid(moviesGrid, movies, "Nenhum filme encontrado.");
    return;
  }

  if (currentType === "series") {
    toggleSection(moviesSection, false);
    toggleSection(seriesSection, true);
    toggleSection(favoritesSection, false);
    renderGrid(seriesGrid, series, "Nenhuma série encontrada.");
    return;
  }

  if (currentType === "favorites") {
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

const filterGroup = document.querySelector(".filter-group");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

function setActiveFilter(selectedBtn) {
  filterButtons.forEach((btn) => {
    const isActive = btn === selectedBtn;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
  });
}

filterGroup.addEventListener("click", (event) => {
  const filterBtn = event.target.closest(".filter-btn");
  if (!filterBtn) {
    return;
  }

  const nextType = filterBtn.getAttribute("data-type") || "all";
  setActiveFilter(filterBtn);
  applyFilterWithTransition(nextType);
});

filterGroup.addEventListener("keydown", (event) => {
  const currentIndex = filterButtons.indexOf(document.activeElement);
  if (currentIndex === -1) {
    return;
  }

  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
    return;
  }

  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (currentIndex + direction + filterButtons.length) % filterButtons.length;
  filterButtons[nextIndex].focus();
  filterButtons[nextIndex].click();
});

searchInput.addEventListener("input", (event) => {
  const searchValue = event.target.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    currentSearch = searchValue;
    loadCatalog(currentSearch);
  }, 350);
});

function createModalContent(item) {
  modalContent.innerHTML = "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.type = "button";
  closeBtn.addEventListener("click", closeModal);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const synopsis = document.createElement("p");
  synopsis.textContent = item.synopsis;

  const ratingDiv = document.createElement("div");
  ratingDiv.className = "rating-container";

  const ratingLabel = document.createElement("p");
  ratingLabel.className = "rating-label";
  ratingLabel.textContent = "Sua avaliação:";

  const starsContainer = document.createElement("div");
  starsContainer.className = "stars-container";

  const currentRating = ratingManager.getRating(item.id);
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";

    if (i <= currentRating) {
      star.classList.add("filled");
    }

    star.textContent = "\u2B50";
    star.addEventListener("click", () => {
      ratingManager.setRating(item.id, i);
      document.querySelectorAll(".star").forEach((s, index) => {
        s.classList.toggle("filled", index < i);
      });
      showToast(`Você avaliou ${i}/5`, "success");
    });

    starsContainer.appendChild(star);
  }

  ratingDiv.appendChild(ratingLabel);
  ratingDiv.appendChild(starsContainer);

  modalContent.appendChild(closeBtn);

  if (item.trailerId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${item.trailerId}`;
    iframe.allowFullscreen = true;
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    modalContent.appendChild(iframe);
  } else {
    const noTrailer = document.createElement("div");
    noTrailer.className = "modal-no-trailer";
    noTrailer.textContent = "Trailer não disponível para este título.";
    modalContent.appendChild(noTrailer);
  }

  modalContent.appendChild(title);
  modalContent.appendChild(synopsis);
  modalContent.appendChild(ratingDiv);
}

function openModal(item) {
  createModalContent(item);
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginError = document.getElementById("loginError");
const loginButton = loginForm.querySelector(".login-btn");

function validateRuntimeContext() {
  const isFileProtocol = window.location.protocol === "file:";
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isWrongLocalPort = isLocalhost && window.location.port && window.location.port !== "3000";

  if (isFileProtocol || isWrongLocalPort) {
    loginError.textContent = "Abra o projeto em http://localhost:3000. Nao use file:// ou outra porta para o frontend.";
    return false;
  }

  return true;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateRuntimeContext()) {
    return;
  }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    loginError.textContent = "Usuário e senha são obrigatórios";
    return;
  }

  const loginStartTime = performance.now();
  loginError.textContent = "";
  loginButton.classList.add("loading");
  loginButton.disabled = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (parseError) {
      loginError.textContent = "Erro do servidor. Tente novamente.";
      return;
    }

    if (!response.ok) {
      loginError.textContent = data && data.message ? data.message : "Erro ao fazer login";
      return;
    }

    initLazyLoading();
    await loadCatalog();
    await ensureMinimumDelay(loginStartTime, LOGIN_MIN_LOADING_MS);
    await animateLoginSuccess();
    setupMotionEnhancements();
    startAutoCatalogRefresh();
    showToast("Login realizado com sucesso", "success");
  } catch (err) {
    loginError.textContent = "Erro ao conectar com o servidor. Verifique se o backend esta rodando em http://localhost:3000.";
  } finally {
    loginButton.classList.remove("loading");
    loginButton.disabled = false;
  }
});

const themeToggle = document.getElementById("themeToggle");
const performanceToggle = document.getElementById("performanceToggle");
const htmlElement = document.documentElement;

function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme;
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    return;
  }

  htmlElement.removeAttribute("data-theme");
  localStorage.setItem("theme", "light");
}

function toggleTheme() {
  const currentTheme = htmlElement.getAttribute("data-theme") || "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

themeToggle.addEventListener("click", toggleTheme);

if (performanceToggle) {
  performanceToggle.addEventListener("click", () => {
    applyPerformanceMode(!isPerformanceMode);
    setupMotionEnhancements();
    setupRevealAnimations();
    renderCurrentView();
  });
}

window.addEventListener("load", () => {
  applyPerformanceMode(loadPerformancePreference());
  applyTheme(getInitialTheme());
  validateRuntimeContext();
  updateCatalogSourceIndicator(currentCatalogSource);
  loader.classList.add("hide");
  setupMotionEnhancements();
});

window.addEventListener("beforeunload", stopAutoCatalogRefresh);

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    applyTheme(event.matches ? "dark" : "light");
  });
}
