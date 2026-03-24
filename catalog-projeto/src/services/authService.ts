import { apiRequest } from "@/services/apiClient";
import type {
  LoginSuccessResponse,
  MeSuccessResponse,
} from "@/types/auth";

export async function login(username: string, password: string) {
  return apiRequest<LoginSuccessResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return apiRequest<{ status: "success"; message: string }>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

export async function me() {
  return apiRequest<MeSuccessResponse>("/api/auth/me", {
    method: "GET",
  });
}
