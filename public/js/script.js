const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// ================== ESTADO GLOBAL ==================
// Armazenam o filtro/busca atual (estado da aplicação)
let currentType = "all";
let currentSearch = "";
let debounceTimer = null;

// ================== CATÁLOGO ==================
async function loadCatalog(type = "all", search = "") {
  try {
    // Mostra loader
    loader.classList.remove("hide");
    
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

// ✅ FUNÇÃO SEGURA PARA CRIAR CARD
function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type;

  const img = document.createElement("img");
  img.className = "movie-image";
  img.src = item.image;
  img.alt = item.title;

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

  items.forEach(item => {
    const card = createMovieCard(item);
    moviesGrid.appendChild(card);
  });
}

// ================== FILTRO POR TIPO (Filmes/Séries) ==================
/**
 * EXPLICAÇÃO: Event Delegation
 * 
 * Em vez de adicionar um listener em CADA botão de filtro,
 * adicionamos UMA VEZ no container pai (.filter-group)
 * e deixamos as cliques "borbulharem" até lá.
 * 
 * Vantagem: Menos código, melhor performance
 */

// Pega o container que contém todos os botões
const filterGroup = document.querySelector(".filter-group");

filterGroup.addEventListener("click", (event) => {
  // Verifica se foi clicado em um botão
  if (event.target.classList.contains("filter-btn")) {
    const filterBtn = event.target;
    
    // ✅ Pega o tipo selecionado (all, movie, series)
    const selectedType = filterBtn.getAttribute("data-type");
    
    console.log(`🎬 Filtrando por: ${selectedType}`);
    
    // ✅ Atualiza o estado global
    currentType = selectedType;
    
    // ✅ Remove classe "active" de todos os botões
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    
    // ✅ Adiciona classe "active" ao botão clicado
    filterBtn.classList.add("active");
    
    // ✅ Carrega o catálogo com o novo filtro
    loadCatalog(currentType, currentSearch);
  }
});

// ================== BUSCA DINÂMICA (Debounce) ==================
/**
 * EXPLICAÇÃO: Debounce (Anti-spam)
 * 
 * Problema: A cada caractere digitado, envia uma requisição à API
 * Solução: Aguardar o usuário parar de digitar por 500ms
 * 
 * Fluxo:
 * 1. Usuário digita "M"      → aguarda 500ms
 * 2. Usuário digita "Ma"     → cancela timer anterior, aguarda 500ms
 * 3. Usuário digita "Mat"    → cancela timer anterior, aguarda 500ms
 * 4. Usuário para de digitar → Após 500ms: faz a requisição com "Mat"
 * 
 * Resultado: 1 requisição em vez de 3!
 */

searchInput.addEventListener("input", (event) => {
  // ✅ Pega o valor digitado
  const searchValue = event.target.value.trim();
  
  console.log(`🔍 Digitou: "${searchValue}"`);
  
  // ✅ Cancela o timer anterior (se existir)
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // ✅ Cria um novo timer
  debounceTimer = setTimeout(() => {
    console.log(`🔍 Buscando por: "${searchValue}"`);
    
    // ✅ Atualiza o estado global
    currentSearch = searchValue;
    
    // ✅ Carrega o catálogo com a nova busca
    loadCatalog(currentType, currentSearch);
    
  }, 500); // Aguarda 500ms
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
    loadCatalog();

  } catch (err) {
    console.error("❌ Erro de conexão:", err);
    loginError.textContent = "Erro ao conectar com o servidor. Verifique sua conexão.";
  }
});