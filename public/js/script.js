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

function renderCatalog(items) {
  moviesGrid.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "movie-card";

    card.innerHTML = `
      <div class="movie-media">
        <span class="badge">${item.type}</span>
        <img src="${item.image}" class="movie-image">
      </div>
      <h3 class="movie-title">${item.title}</h3>
    `;

    card.onclick = () => openModal(item);
    moviesGrid.appendChild(card);
  });
}

// ================== MODAL ==================
function openModal(item) {
  modalContent.innerHTML = `
    <button class="modal-close">&times;</button>
    <iframe src="https://www.youtube.com/embed/${item.trailerId}" allowfullscreen></iframe>
    <h3>${item.title}</h3>
    <p>${item.synopsis}</p>
  `;

  modal.classList.add("show");
  document.querySelector(".modal-close").onclick = closeModal;
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