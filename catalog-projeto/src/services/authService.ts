import { ApiClientError, apiRequest } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import type {
  AuthUser,
  LoginSuccessResponse,
  MeSuccessResponse,
} from "@/types/auth";

const LOCAL_SESSION_KEY = "catalogx.local.auth";
const BACKEND_SESSION_HINT_KEY = "catalogx.backend.session.hint";
const GUEST_SESSION_KEY = "catalogx.guest.session";

function hasBackendSessionHint() {
  try {
    return localStorage.getItem(BACKEND_SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function setBackendSessionHint() {
  try {
    localStorage.setItem(BACKEND_SESSION_HINT_KEY, "1");
  } catch {
    // ignora falha de storage
  }
}

function clearBackendSessionHint() {
  try {
    localStorage.removeItem(BACKEND_SESSION_HINT_KEY);
  } catch {
    // ignora falha de storage
  }
}

export function hasGuestSession(): boolean {
  try {
    return localStorage.getItem(GUEST_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuestSession(): void {
  try {
    localStorage.setItem(GUEST_SESSION_KEY, "1");
  } catch {
    // ignora falha de storage
  }
}

export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // ignora falha de storage
  }
}

function readLocalSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || typeof parsed.username !== "string") return null;
    return { username: parsed.username, role: "admin" };
  } catch {
    return null;
  }
}

function writeLocalSession(user: AuthUser) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignora falha de storage para nao quebrar UX
  }
}

function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignora falha de storage
  }
}

export async function login(username: string, password: string) {
  if (!USE_BACKEND_API) {
    const cleanUser = username.trim();
    if (!cleanUser || !password.trim()) {
      throw new ApiClientError("Informe usuario e senha.", 400, "INVALID_CREDENTIALS");
    }

    const user: AuthUser = { username: cleanUser, role: "admin" };
    writeLocalSession(user);

    const response: LoginSuccessResponse = {
      status: "success",
      message: "Login local realizado com sucesso.",
      user,
    };
    return response;
  }

  const response = await apiRequest<LoginSuccessResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setBackendSessionHint();
  return response;
}

export async function logout() {
  if (!USE_BACKEND_API) {
    clearLocalSession();
    clearBackendSessionHint();
    clearGuestSession();
    return { status: "success", message: "Logout local realizado." };
  }

  try {
    return await apiRequest<{ status: "success"; message: string }>(
      "/api/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
  } finally {
    clearBackendSessionHint();
    clearGuestSession();
  }
}

export async function me() {
  if (!USE_BACKEND_API) {
    const user = readLocalSession();
    if (!user) {
      throw new ApiClientError("Nao autenticado.", 401, "UNAUTHORIZED");
    }

    const response: MeSuccessResponse = { status: "success", user };
    return response;
  }

  // Evita chamada inicial ao /me quando ainda nao houve login nesta instancia.
  if (!hasBackendSessionHint()) {
    throw new ApiClientError("Nao autenticado.", 401, "UNAUTHORIZED");
  }

  try {
    return await apiRequest<MeSuccessResponse>("/api/auth/me", {
      method: "GET",
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      clearBackendSessionHint();
    }
    throw err;
  }
}
