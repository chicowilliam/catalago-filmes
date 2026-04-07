import { apiRequest } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import type { Locale } from "@/i18n/translations";
import type { CatalogResponse } from "@/types/catalog";

function mapLocaleToApiLang(locale: Locale) {
  return locale === "en" ? "en-US" : "pt-BR";
}

export async function listCatalog(search = "", signal?: AbortSignal, locale: Locale = "pt-BR") {
  if (!USE_BACKEND_API) {
    throw new Error("Catalogo local removido. Habilite o backend para carregar os titulos.");
  }

  const params = new URLSearchParams({
    type: "all",
    search,
    lang: mapLocaleToApiLang(locale),
  });

  return apiRequest<CatalogResponse>(`/api/catalog?${params.toString()}`, {
    method: "GET",
    signal,
    retry: true,
  });
}

export async function getTrailer(item: { id: number | string; type: string }, locale: Locale = "pt-BR"): Promise<string | null> {
  if (!USE_BACKEND_API) return null;
  try {
    const result = await apiRequest<{ status: string; trailerId: string | null }>(
      `/api/catalog/${String(item.id)}/trailer?type=${encodeURIComponent(item.type)}&lang=${encodeURIComponent(mapLocaleToApiLang(locale))}`,
      { method: "GET", retry: true }
    );
    return result.trailerId ?? null;
  } catch {
    return null;
  }
}

export async function getFeatured(locale: Locale = "pt-BR"): Promise<{ data: import("@/types/catalog").CatalogItem[] }> {
  if (!USE_BACKEND_API) return { data: [] };
  try {
    return await apiRequest<{ data: import("@/types/catalog").CatalogItem[] }>(
      `/api/catalog/featured?lang=${encodeURIComponent(mapLocaleToApiLang(locale))}`,
      { method: "GET", retry: true }
    );
  } catch {
    return { data: [] };
  }
}
