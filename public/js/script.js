const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// ================== CATÁLOGO ==================
async function loadCatalog(type = "all", search = "") {
  const res = await fetch(`/api/catalog?type=${type}&search=${search}`);
  const data = await res.json();

  renderCatalog(data);

  // ✅ ESCONDE O LOADER
  loader.classList.add("hide");
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
  card.onclick = () => openModal(item);

  return card;
}

function renderCatalog(items) {
  // ✅ Limpa o grid (isso é seguro)
  moviesGrid.innerHTML = "";

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
  closeBtn.onclick = closeModal;

  // Cria o iframe (seguro pois YouTube ID é controlado)
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${item.trailerId}`;
  iframe.allowFullscreen = true;
  iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");

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
// LOGIN
// =========================
const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const data = await response.json();
      loginError.textContent = data.message || "Erro no login";
      return;
    }

    // ✅ LOGIN OK
    loginScreen.style.display = "none";
    loadCatalog();

    console.log("✅ Logado como admin");

  } catch (err) {
    loginError.textContent = "Erro ao conectar com o servidor";
  }
});