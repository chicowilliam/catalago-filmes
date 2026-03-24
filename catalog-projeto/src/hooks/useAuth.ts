import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/services/apiClient";
import * as authService from "@/services/authService";
import type { AuthUser } from "@/types/auth";

type AuthStatus = "checking" | "authenticated" | "guest";

interface LoginInput {
  username: string;
  password: string;
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setStatus("checking");
    try {
      const response = await authService.me();
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUser(null);
        setStatus("guest");
        return;
      }

      setUser(null);
      setStatus("guest");
      setError("Nao foi possivel validar sua sessao no servidor.");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const login = useCallback(async ({ username, password }: LoginInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      setStatus("authenticated");
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao fazer login.");
      }

      setStatus("guest");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Mesmo com erro de rede, limpamos o estado local para nao travar UI.
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  return useMemo(
    () => ({
      status,
      user,
      error,
      isSubmitting,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      retrySessionCheck: checkSession,
    }),
    [status, user, error, isSubmitting, login, logout, checkSession]
  );
}
