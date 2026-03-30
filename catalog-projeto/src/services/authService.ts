import { ApiClientError, apiRequest } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import type {
  AuthUser,
  LoginSuccessResponse,
  MeSuccessResponse,
} from "@/types/auth";

const LOCAL_SESSION_KEY = "catalogx.local.auth";

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

  return apiRequest<LoginSuccessResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  if (!USE_BACKEND_API) {
    clearLocalSession();
    return { status: "success", message: "Logout local realizado." };
  }

  return apiRequest<{ status: "success"; message: string }>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
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

  return apiRequest<MeSuccessResponse>("/api/auth/me", {
    method: "GET",
  });
}
