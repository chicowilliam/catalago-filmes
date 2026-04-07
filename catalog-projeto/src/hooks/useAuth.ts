import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import { useLanguage } from "@/i18n/LanguageContext";
import * as authService from "@/services/authService";
import type { AuthUser } from "@/types/auth";

type AuthStatus = "checking" | "authenticated" | "guest" | "unauthenticated";

interface LoginInput {
  username: string;
  password: string;
}

export function useAuth() {
  const { text } = useLanguage();
  const [status, setStatus] = useState<AuthStatus>(() =>
    authService.hasGuestSession() ? "guest" : "checking"
  );
  const [catalogIntroToken, setCatalogIntroToken] = useState(0);
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
        setStatus("unauthenticated");
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
      setError(
        USE_BACKEND_API
          ? text.validateServerSession
          : text.validateLocalSession
      );
    }
  }, [text.validateLocalSession, text.validateServerSession]);

  useEffect(() => {
    if (authService.hasGuestSession()) return; // já restaurado do localStorage
    void checkSession();
  }, [checkSession]);

  const login = useCallback(async ({ username, password }: LoginInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      setStatus("authenticated");
      setCatalogIntroToken((current) => current + 1);
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(text.loginUnexpectedError);
      }

      setStatus("unauthenticated");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [text.loginUnexpectedError]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Mesmo com erro de rede, limpamos o estado local para nao travar UI.
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const enterAsGuest = useCallback(() => {
    authService.markGuestSession();
    setUser(null);
    setError(null);
    setStatus("guest");
    setCatalogIntroToken((current) => current + 1);
  }, []);

  return useMemo(
    () => ({
      status,
      user,
      error,
      isSubmitting,
      catalogIntroToken,
      isAuthenticated: status === "authenticated",
      isGuest: status === "guest",
      login,
      logout,
      enterAsGuest,
      retrySessionCheck: checkSession,
    }),
    [status, user, error, isSubmitting, catalogIntroToken, login, logout, enterAsGuest, checkSession]
  );
}
