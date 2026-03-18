const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// ================== ESTADO GLOBAL ==================
let currentType = "all";
let currentSearch = "";
let debounceTimer = null;
let imageObserver = null;

// ✅ Favoritos Manager
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
    this.favorites = this.favorites.filter(fav => fav.id !== movieId);
    this.save();
  }

  isFavorite(movieId) {
    return this.favorites.some(fav => fav.id === movieId);
  }

  save() {
    localStorage.setItem("favorites", JSON.stringify(this.favorites));
  }

  getFavorites() {
    return this.favorites;
  }
}

const favoritesManager = new FavoritesManager();

// ✅ Rating Manager
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

// ================== TOAST NOTIFICATIONS ==================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================== LAZY LOADING ==================
function initLazyLoading() {
  const options = {
    root: null,
    rootMargin: "50px",
    threshold: 0.01
  };

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const realSrc = img.getAttribute("data-src");
        
        if (realSrc) {
          img.src = realSrc;
          img.removeAttribute("data-src");
          img.classList.add("loaded");
          imageObserver.unobserve(img);
        }
      }
    });
  }, options);
}

// ================== SKELETON LOADING ==================
function createSkeletonCard() {
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton-card";
  skeleton.innerHTML = `
    <div class="skeleton-media"></div>
    <div class="skeleton-title"></div>
  `;
  return skeleton;
}

// ================== CATÁLOGO ==================
async function loadCatalog(type = "all", search = "") {
  try {
    loader.classList.remove("hide");
    
    moviesGrid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      moviesGrid.appendChild(createSkeletonCard());
    }
    
    const res = await fetch(`/api/catalog?type=${type}&search=${search}`);
    
    if (!res.ok) {
      throw new Error(`Erro ao carregar catálogo: ${res.status}`);
    }
    
    const response = await res.json();
    console.log(`✅ ${response.count} filmes carregados`);
    
    // ✅ CORREÇÃO: Passa response.data (não response)
    renderCatalog(response.data);

  } catch (err) { 
    console.error("❌ Erro ao carregar catálogo:", err);
    moviesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Erro ao carregar filmes. Tente recarregar a página.</p>`;
  } finally {
    loader.classList.add("hide");
  }
}

// ✅ CRIAR CARD COM HEART BUTTON
function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type;

  // ✅ Heart Button (Translúcido)
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.type = "button";
  
  const isFav = favoritesManager.isFavorite(item.id);
  favoriteBtn.classList.add(isFav ? "favorited" : "not-favorited");
  
  favoriteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" class="heart-icon">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    if (favoritesManager.isFavorite(item.id)) {
      favoritesManager.removeFavorite(item.id);
      favoriteBtn.classList.remove("favorited");
      favoriteBtn.classList.add("not-favorited");
      showToast("Removido dos favoritos 💔", "info");
    } else {
      favoritesManager.addFavorite(item);
      favoriteBtn.classList.remove("not-favorited");
      favoriteBtn.classList.add("favorited");
      showToast("Adicionado aos favoritos ❤️", "success");
    }
  });

  // ✅ Lazy Loading Image
  const img = document.createElement("img");
  img.className = "movie-image";
  img.setAttribute("data-src", item.image);
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%23222' width='400' height='600'/%3E%3C/svg%3E";
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

function renderCatalog(items) {
  moviesGrid.innerHTML = "";

  if (!items || items.length === 0) {
    moviesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-tertiary);">Nenhum filme encontrado.</p>`;
    return;
  }

  items.forEach(item => {
    const card = createMovieCard(item);
    moviesGrid.appendChild(card);
  });
}

// ================== FILTROS ==================
const filterGroup = document.querySelector(".filter-group");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

function setActiveFilter(selectedBtn) {
  filterButtons.forEach(btn => {
    const isActive = btn === selectedBtn;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
  });
}


filterGroup.addEventListener("click", (event) => {
  const filterBtn = event.target.closest(".filter-btn");
  if (!filterBtn) return;

  const selectedType = filterBtn.getAttribute("data-type");
  currentType = selectedType;

  setActiveFilterButton(filterBtn);

  if (selectedType === "favorites") {
    renderCatalog(favoritesManager.getFavorites());
  } else {
    loadCatalog(currentType, currentSearch);
  }
});

// Navegção por teclado entre tabs (setinhas esquerda/direita)
filterGroup.addEventListener ("keydown", (event) => {
  const currentIndex = filterButtons.indexOf(document.activeElement)
  if (currentIndex === -1) return;

  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();

  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nxtIndex =(currentIndex + direction + filterButtons.length) % filterButtons.lenght;
  filterButtons[nextIndex].focus()
  filterButtons[nextIndex].click()
});

// ================== BUSCA ==================
searchInput.addEventListener("input", (event) => {
  const searchValue = event.target.value.trim();
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    currentSearch = searchValue;
    loadCatalog(currentType, currentSearch);
  }, 500);
});

// ================== MODAL ==================
function createModalContent(item) {
  modalContent.innerHTML = "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "×";
  closeBtn.type = "button";
  closeBtn.addEventListener("click", closeModal);

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${item.trailerId}`;
  iframe.allowFullscreen = true;
  iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");

  const title = document.createElement("h3");
  title.textContent = item.title;

  const synopsis = document.createElement("p");
  synopsis.textContent = item.synopsis;

  // ✅ Rating System
  const ratingDiv = document.createElement("div");
  ratingDiv.className = "rating-container";
  
  const ratingLabel = document.createElement("p");
  ratingLabel.className = "rating-label";
  ratingLabel.textContent = "Sua avaliação:";
  
  const starsContainer = document.createElement("div");
  starsContainer.className = "stars-container";
  
  const currentRating = ratingManager.getRating(item.id);
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";
    
    if (i <= currentRating) {
      star.classList.add("filled");
    }
    
    star.textContent = "⭐";
    
    star.addEventListener("click", () => {
      ratingManager.setRating(item.id, i);
      
      document.querySelectorAll(".star").forEach((s, index) => {
        if (index < i) {
          s.classList.add("filled");
        } else {
          s.classList.remove("filled");
        }
      });
      
      showToast(`Você avaliou ${i}/5 ⭐`, "success");
    });
    
    starsContainer.appendChild(star);
  }
  
  ratingDiv.appendChild(ratingLabel);
  ratingDiv.appendChild(starsContainer);

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(iframe);
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

// ================== LOGIN ==================
const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    loginError.textContent = "Usuário e senha são obrigatórios";
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      loginError.textContent = "Erro do servidor. Tente novamente.";
      return;
    }

    if (!response.ok) {
      const errorMsg = data?.message || "Erro ao fazer login";
      loginError.textContent = errorMsg;
      return;
    }

    loginScreen.style.display = "none";
    initLazyLoading();
    loadCatalog();
    showToast("Login realizado com sucesso! 🎉", "success");

  } catch (err) {
    loginError.textContent = "Erro ao conectar com o servidor.";
  }
});

// ================== DARK MODE ==================
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) return savedTheme;
  
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  
  return "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  }
}

function toggleTheme() {
  const currentTheme = htmlElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

themeToggle.addEventListener("click", toggleTheme);

window.addEventListener("load", () => {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
});

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const newTheme = e.matches ? "dark" : "light";
    applyTheme(newTheme);
  });
}