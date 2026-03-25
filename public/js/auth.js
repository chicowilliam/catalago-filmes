import { LOGIN_MIN_LOADING_MS, LOGIN_TRANSITION_MS } from "./config.js";
import { loginForm, loginScreen, loginError, loginButton, guestAccessButton } from "./dom.js";
import { wait, ensureMinimumDelay, showToast } from "./utils.js";
import { loadCatalog, startAutoCatalogRefresh } from "./catalog.js";
import { setupMotionEnhancements } from "./motion.js";
import { initLazyLoading } from "./render.js";

// ---------------------------------------------------------------------------
// Validação do contexto de execução (evita file:// e porta errada)
// ---------------------------------------------------------------------------

export function validateRuntimeContext() {
  const isFileProtocol = window.location.protocol === "file:";
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isWrongLocalPort =
    isLocalhost && window.location.port && window.location.port !== "3000";

  if (isFileProtocol || isWrongLocalPort) {
    if (loginError) {
      loginError.textContent =
        "Abra o projeto em http://localhost:3000. Nao use file:// ou outra porta para o frontend.";
    }
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Animação de saída da tela de login
// ---------------------------------------------------------------------------

async function animateLoginSuccess() {
  loginScreen.classList.add("is-exiting");
  await wait(16);
  document.body.classList.add("app-ready");
  await wait(LOGIN_TRANSITION_MS);
  loginScreen.style.display = "none";
  loginScreen.classList.remove("is-exiting");
}

function setAccessButtonsLoading(activeButton, isLoading) {
  const buttons = [loginButton, guestAccessButton].filter(Boolean);

  buttons.forEach((button) => {
    button.disabled = isLoading;
    button.classList.remove("loading");
  });

  if (isLoading && activeButton) {
    activeButton.classList.add("loading");
  }
}

async function prepareCatalogAccess() {
  initLazyLoading();
  await loadCatalog();
}

async function finishAccessFlow(message, type = "success") {
  await animateLoginSuccess();
  setupMotionEnhancements();
  startAutoCatalogRefresh();
  showToast(message, type);
}

// ---------------------------------------------------------------------------
// Registro do listener de submit do formulário de login
// ---------------------------------------------------------------------------

export function setupLoginForm() {
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateRuntimeContext()) return;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      loginError.textContent = "Usuário e senha são obrigatórios";
      return;
    }

    const loginStartTime = performance.now();
    loginError.textContent = "";
    setAccessButtonsLoading(loginButton, true);
    let loginSucceeded = false;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        loginError.textContent = "Erro do servidor. Tente novamente.";
        return;
      }

      if (!response.ok) {
        loginError.textContent = data && data.message ? data.message : "Erro ao fazer login";
        return;
      }

      await prepareCatalogAccess();
      loginSucceeded = true;
    } catch {
      loginError.textContent =
        "Erro ao conectar com o servidor. Verifique se o backend esta rodando em http://localhost:3000.";
    } finally {
      await ensureMinimumDelay(loginStartTime, LOGIN_MIN_LOADING_MS);
      if (loginSucceeded) {
        await finishAccessFlow("Login realizado com sucesso", "success");
      }
      setAccessButtonsLoading(null, false);
    }
  });

  if (!guestAccessButton) return;

  guestAccessButton.addEventListener("click", async () => {
    if (!validateRuntimeContext()) return;

    const accessStartTime = performance.now();
    loginError.textContent = "";
    setAccessButtonsLoading(guestAccessButton, true);
    let guestAccessSucceeded = false;

    try {
      await prepareCatalogAccess();
      guestAccessSucceeded = true;
    } catch {
      loginError.textContent =
        "Nao foi possivel carregar o catalogo agora. Tente novamente em alguns segundos.";
    } finally {
      await ensureMinimumDelay(accessStartTime, LOGIN_MIN_LOADING_MS);
      if (guestAccessSucceeded) {
        await finishAccessFlow("Acesso visitante liberado", "info");
      }
      setAccessButtonsLoading(null, false);
    }
  });
}
