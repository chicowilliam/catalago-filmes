const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// ================== CATÁLOGO ==================
async function loadCatalog(type = "all", search = "") {
  try {
    const res = await fetch(`/api/catalog?type=${type}&search=${search}`);
    
    if (!res.ok) {
      throw new Error(`Erro ao carregar catálogo: ${res.status}`);
    }
    
    const response = await res.json();
    renderCatalog(response.data);
  } catch (err) { 
    console.error("❌ Erro ao carregar catálogo:", err);
    moviesGrid.innerHTML = `
      <p style="color: #e50914; text-align: center; grid-column: 1/-1;">
        Erro ao carregar filmes. Tente recarregar a página.
      </p>
    `;
  } finally {
    // ✅ SEMPRE esconde o loader (sucesso ou erro)
    loader.classList.add("hide");
  }
}

// ✅ FUNÇÃO SEGURA PARA CRIAR CARD
function createMovieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";

  // Cria a div do media
  const mediaDiv = document.createElement("div");
  mediaDiv.className = "movie-media";

  // Cria o badge (tipo de filme/série)
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.type; // ✅ SEGURO - textContent

  // Cria a imagem
  const img = document.createElement("img");
  img.className = "movie-image";
  img.src = item.image;
  img.alt = item.title; // ✅ Melhora acessibilidade

  // Monta o media div
  mediaDiv.appendChild(badge);
  mediaDiv.appendChild(img);

  // Cria o título
  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = item.title; // ✅ SEGURO - textContent

  // Monta o card
  card.appendChild(mediaDiv);
  card.appendChild(title);

  // Adiciona evento de clique
  card.addEventListener("click", () => openModal(item));

  return card;
}

function renderCatalog(items) {
  // ✅ Limpa o grid
  moviesGrid.innerHTML = "";

  // Verifica se há filmes
  if (!items || items.length === 0) {
    moviesGrid.innerHTML = `
      <p style="color: #999; text-align: center; grid-column: 1/-1;">
        Nenhum filme encontrado.
      </p>
    `;
    return;
  }

  // ✅ Cria e insere os cards de forma segura
  items.forEach(item => {
    const card = createMovieCard(item);
    moviesGrid.appendChild(card);
  });
}

// ================== MODAL ==================
// ✅ FUNÇÃO SEGURA PARA CRIAR MODAL
function createModalContent(item) {
  // Limpa o modal
  modalContent.innerHTML = "";

  // Cria o botão de fechar
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "×";
  closeBtn.type = "button";
  closeBtn.addEventListener("click", closeModal);

  // Cria o iframe (seguro pois YouTube ID é controlado)
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

  // Cria o título
  const title = document.createElement("h3");
  title.textContent = item.title; // ✅ SEGURO

  // Cria a sinopse
  const synopsis = document.createElement("p");
  synopsis.textContent = item.synopsis; // ✅ SEGURO

  // Monta tudo
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

// =========================
// LOGIN - VERSÃO MELHORADA
// =========================
const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Validação básica no frontend
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

    // Tenta fazer parsing da resposta
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error("❌ Erro ao fazer parse da resposta:", parseErr);
      loginError.textContent = "Erro do servidor. Tente novamente.";
      return;
    }

    // Verifica se o login foi bem-sucedido
    if (!response.ok) {
      const errorMsg = data?.message || "Erro ao fazer login";
      console.error("❌ Login falhou:", errorMsg);
      loginError.textContent = errorMsg;
      return;
    }

    // ✅ LOGIN OK
    console.log("✅ Login bem-sucedido!");
    loginScreen.style.display = "none";
    loadCatalog();

  } catch (err) {
    console.error("❌ Erro de conexão:", err);
    loginError.textContent = "Erro ao conectar com o servidor. Verifique sua conexão.";
  }
});