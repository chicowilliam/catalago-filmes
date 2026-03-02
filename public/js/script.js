const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// ================== ESTADO GLOBAL ==================
let currentType = "all";
let currentSearch = "";
let debounceTimer = null;
let imageObserver = null; // Para lazy loading

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

  // ✅ LAZY LOADING: Usa data-src em vez de src
  const img = document.createElement("img");
  img.className = "movie-image";
  img.setAttribute("data-src", item.image); // Guarda a URL real aqui
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%23222' width='400' height='600'/%3E%3C/svg%3E"; // Placeholder SVG
  img.alt = item.title;
  
  // ✅ Observa essa imagem para lazy loading
  if (imageObserver) {
    imageObserver.observe(img);
  }

  mediaDiv.appendChild(badge);
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
    
    loadCatalog(currentType, currentSearch);
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

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(iframe);
  modalContent.appendChild(title);
  modalContent.appendChild(synopsis);
}

function openModal(item) {
  createModalContent(item);
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

// ✅ Fechar modal ao clicar fora
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// ✅ Fechar modal com tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

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
    themeToggle.querySelector(".theme-icon").textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.removeAttribute("data-theme");
    themeToggle.querySelector(".theme-icon").textContent = "🌙";
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