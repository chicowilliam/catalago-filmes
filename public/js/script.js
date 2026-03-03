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

// ✅ NOVO: Gerenciador de Ratings
class RatingManager {
  constructor() {
    // ✅ Pega ratings salvos no localStorage
    this.ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  }

  // ✅ Salvar avaliação de um filme
  setRating(movieId, rating) {
    if (rating >= 1 && rating <= 5) {
      this.ratings[movieId] = rating;
      localStorage.setItem("ratings", JSON.stringify(this.ratings));
      console.log(`⭐ Você avaliou ${rating}/5`);
      return true;
    }
    return false;
  }

  // ✅ Pegar avaliação de um filme
  getRating(movieId) {
    return this.ratings[movieId] || 0;
  }
}

// ✅ Cria uma instância global
const ratingManager = new RatingManager();

// ✅ NOVO: Gerenciador de Favoritos
class FavoritesManager {
  constructor() {
    // ✅ Pega favoritos salvos no localStorage ou começa com array vazio
    this.favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  }

  // ✅ Adicionar um filme aos favoritos
  addFavorite(movie) {
    // Verifica se já não está na lista
    if (!this.isFavorite(movie.id)) {
      this.favorites.push(movie);
      this.save();
      console.log(`❤️ Adicionado aos favoritos: ${movie.title}`);
      return true; // Retorna true se foi adicionado
    }
    return false;
  }

  // ✅ Remover um filme dos favoritos
  removeFavorite(movieId) {
    // Filter remove o filme com esse ID
    this.favorites = this.favorites.filter(fav => fav.id !== movieId);
    this.save();
    console.log(`💔 Removido dos favoritos (ID: ${movieId})`);
  }

  // ✅ Verificar se um filme já está nos favoritos
  isFavorite(movieId) {
    return this.favorites.some(fav => fav.id === movieId);
  }

  // ✅ Salvar favoritos no localStorage
  save() {
    localStorage.setItem("favorites", JSON.stringify(this.favorites));
  }

  // ✅ Pegar todos os favoritos
  getFavorites() {
    return this.favorites;
  }
}

// ✅ Cria uma instância global
const favoritesManager = new FavoritesManager();

// ================== LAZY LOADING - INTERSECTION OBSERVER ==================
/**
 * EXPLICAÇÃO: Intersection Observer
 * 
 * Detecta quando uma imagem entra na viewport (tela do usuário)
 * 
 * Vantagens:
 * - Eficiente (não precisa de scroll listeners)
 * - Nativo do navegador
 * - Melhor performance
 */
function initLazyLoading() {
  const options = {
    root: null,           // Usa viewport como raiz
    rootMargin: "50px",   // Começa a carregar 50px antes de aparecer
    threshold: 0.01       // Carrega quando 1% visível
  };

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // ✅ Pega a URL real guardada em data-src
        const realSrc = img.getAttribute("data-src");
        
        if (realSrc) {
          console.log(`📷 Carregando imagem: ${realSrc}`);
          
          // ✅ Carrega a imagem
          img.src = realSrc;
          
          // ✅ Remove o placeholder
          img.removeAttribute("data-src");
          
          // ✅ Adiciona classe para fade-in
          img.classList.add("loaded");
          
          // ✅ Para de observar (já foi carregada)
          imageObserver.unobserve(img);
        }
      }
    });
  }, options);
}

// ================== SKELETON LOADING ==================
/**
 * EXPLICAÇÃO: Skeleton Card
 * 
 * Cria um "esqueleto" do card que mostra enquanto carrega
 * Mantém o layout estável (sem jumping)
 */
function createSkeletonCard() {
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton-card";
  
  skeleton.innerHTML = `
    <div class="skeleton-media"></div>
    <div class="skeleton-title"></div>
  `;
  
  return skeleton;
}

// ================== TOAST NOTIFICATIONS ==================
/**
 * EXPLICAÇÃO: Toast é uma mensagem que aparece e some automaticamente
 * 
 * Exemplos:
 * - "Filme adicionado aos favoritos ❤️"
 * - "Erro ao buscar filmes 🚨"
 * 
 * Por que importa:
 * - Feedback visual para o usuário
 * - Muito usado em apps profissionais (Uber, Spotify, etc)
 * - Recrutadores adoram ver
 */

function showToast(message, type = "info") {
  // ✅ Cria um container pra cada toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  // ✅ Define o ícone baseado no tipo
  const icons = {
    success: "✅",
    error: "🚨",
    info: "ℹ️",
    warning: "⚠️"
  };
  
  toast.textContent = `${icons[type]} ${message}`;
  
  // ✅ Adiciona o toast ao topo da página
  document.body.appendChild(toast);
  
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // ✅ Anima a entrada
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // ✅ Remove depois de 3 segundos
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ================== CATÁLOGO ==================
async function loadCatalog(type = "all", search = "") {
  try {
    // ✅ Mostra loader e skeletons
    loader.classList.remove("hide");
    
    // ✅ Mostra 6 skeletons enquanto carrega
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
    renderCatalog(response.data);

  } catch (err) { 
    console.error("❌ Erro ao carregar catálogo:", err);
    moviesGrid.innerHTML = `
      <p style="color: #e50914; text-align: center; grid-column: 1/-1;">
        Erro ao carregar filmes. Tente recarregar a página.
      </p>
    `;
  } finally {
    loader.classList.add("hide");
  }
}

// ✅ FUNÇÃO SEGURA PARA CRIAR CARD COM LAZY LOADING
function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type;

  // ✅ NOVO: Botão de favoritar (coração)
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.type = "button";
  
  // ✅ Verifica se já está nos favoritos para colocar o ícone correto
  const isFav = favoritesManager.isFavorite(item.id);
  favoriteBtn.classList.add(isFav ? "favorited" : "not-favorited");
  favoriteBtn.title = isFav ? "Remover dos favoritos" : "Adicionar aos favoritos";
  
  // ✅ Ícone do coração (SVG)
  favoriteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" class="heart-icon">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  // ✅ Evento: Clica no coração para favoritar/desfavoritar
  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // ✅ Para não abrir o modal
    
    if (favoritesManager.isFavorite(item.id)) {
      // ✅ Já está favorito, então remove
      favoritesManager.removeFavorite(item.id);
      favoriteBtn.classList.remove("favorited");
      favoriteBtn.classList.add("not-favorited");
      favoriteBtn.title = "Adicionar aos favoritos";
      showToast("Removido dos favoritos 💔", "info");
    } else {
      // ✅ Não está favorito, então adiciona
      favoritesManager.addFavorite(item);
      favoriteBtn.classList.remove("not-favorited");
      favoriteBtn.classList.add("favorited");
      favoriteBtn.title = "Remover dos favoritos";
      showToast("Adicionado aos favoritos ❤️", "success");
    }
  });

  mediaDiv.appendChild(badge);
  mediaDiv.appendChild(favoriteBtn); // ✅ Adiciona o botão
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
    moviesGrid.innerHTML = `
      <p style="color: #999; text-align: center; grid-column: 1/-1;">
        Nenhum filme encontrado.
      </p>
    `;
    return;
  }

  // ✅ Cria e insere os cards
  items.forEach(item => {
    const card = createMovieCard(item);
    moviesGrid.appendChild(card);
  });
}

// ================== FILTRO POR TIPO ==================
const filterGroup = document.querySelector(".filter-group");

filterGroup.addEventListener("click", (event) => {
  if (event.target.classList.contains("filter-btn")) {
    const filterBtn = event.target;
    const selectedType = filterBtn.getAttribute("data-type");
    
    console.log(`🎬 Filtrando por: ${selectedType}`);
    
    currentType = selectedType;
    
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    
    filterBtn.classList.add("active");
    
    // ✅ Se é favoritos, mostra apenas favoritos
    if (selectedType === "favorites") {
      console.log(`❤️ Mostrando favoritos (${favoritesManager.getFavorites().length})`);
      renderCatalog(favoritesManager.getFavorites());
    } else {
      // ✅ Senão, faz a busca normal
      loadCatalog(currentType, currentSearch);
    }
  }
});

// ================== BUSCA DINÂMICA ==================
searchInput.addEventListener("input", (event) => {
  const searchValue = event.target.value.trim();
  
  console.log(`🔍 Digitou: "${searchValue}"`);
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    console.log(`🔍 Buscando por: "${searchValue}"`);
    
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
  iframe.style.width = "100%";
  iframe.style.maxWidth = "720px";
  iframe.style.aspectRatio = "16 / 9";
  iframe.style.borderRadius = "14px";
  iframe.style.display = "block";
  iframe.style.margin = "0 auto 16px";

  const title = document.createElement("h3");
  title.textContent = item.title;

  const synopsis = document.createElement("p");
  synopsis.textContent = item.synopsis;

  // ✅ NOVO: Sistema de Rating
  const ratingDiv = document.createElement("div");
  ratingDiv.className = "rating-container";
  
  const ratingLabel = document.createElement("p");
  ratingLabel.className = "rating-label";
  ratingLabel.textContent = "Sua avaliação:";
  
  const starsContainer = document.createElement("div");
  starsContainer.className = "stars-container";
  
  // ✅ Cria 5 estrelas
  const currentRating = ratingManager.getRating(item.id);
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";
    
    // ✅ Se foi avaliado, preenche as estrelas
    if (i <= currentRating) {
      star.classList.add("filled");
    }
    
    star.textContent = "⭐";
    
    // ✅ Evento: Clica na estrela para salvar rating
    star.addEventListener("click", () => {
      ratingManager.setRating(item.id, i);
      
      // ✅ Atualiza o visual das estrelas
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
  modalContent.appendChild(ratingDiv); // ✅ Adiciona o rating
}

// =========================
// LOGIN
// =========================
const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    loginError.textContent = "Username e senha são obrigatórios";
    return;
  }

  try {
    console.log("🔄 Tentando fazer login...");

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
      console.error("❌ Erro ao fazer parse da resposta:", parseErr);
      loginError.textContent = "Erro do servidor. Tente novamente.";
      return;
    }

    if (!response.ok) {
      const errorMsg = data?.message || "Erro ao fazer login";
      console.error("❌ Login falhou:", errorMsg);
      loginError.textContent = errorMsg;
      return;
    }

    console.log("✅ Login bem-sucedido!");
    loginScreen.style.display = "none";
    
    // ✅ Inicializa lazy loading APÓS login
    initLazyLoading();
    
    loadCatalog();

  } catch (err) {
    console.error("❌ Erro de conexão:", err);
    loginError.textContent = "Erro ao conectar com o servidor. Verifique sua conexão.";
  }
});

// ... SEU CÓDIGO ANTERIOR FICA AQUI ...

// =========================
// DARK/LIGHT MODE THEME
// =========================
/**
 * EXPLICAÇÃO: Dark Mode com localStorage
 * 
 * 1. Detecta tema do sistema (preferência do usuário)
 * 2. Salva no localStorage
 * 3. Aplica ao recarregar página
 * 4. Toggle troca entre os temas
 */

const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

// ✅ Pega o tema salvo ou detecta do sistema
function getInitialTheme() {
  // Verifica localStorage primeiro
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    console.log(`🎨 Tema salvo: ${savedTheme}`);
    return savedTheme;
  }
  
  // Detecta preferência do sistema
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    console.log("🌙 Preferência do sistema: Dark Mode");
    return "dark";
  }
  
  console.log("☀️ Preferência do sistema: Light Mode");
  return "light";
}

// ✅ Aplica o tema
function applyTheme(theme) {
  if (theme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
    // ✅ Removeu emoji, agora usa SVG que muda automaticamente
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.removeAttribute("data-theme");
    // ✅ Removeu emoji
    localStorage.setItem("theme", "light");
  }
  
  console.log(`🎨 Tema aplicado: ${theme}`);
}

// ✅ Toggle entre temas
function toggleTheme() {
  const currentTheme = htmlElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

// ✅ Event Listener do botão
themeToggle.addEventListener("click", toggleTheme);

// ✅ Aplica tema inicial na página
window.addEventListener("load", () => {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
});

// ✅ Detecta mudança do sistema (se usuário trocar no SO)
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const newTheme = e.matches ? "dark" : "light";
    applyTheme(newTheme);
  });
}