import { apiRequest } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import type { CatalogResponse } from "@/types/catalog";

export async function listCatalog(search = "", signal?: AbortSignal) {
  if (!USE_BACKEND_API) {
    throw new Error("Catalogo local removido. Habilite o backend para carregar os titulos.");
  }

  const params = new URLSearchParams({
    type: "all",
    search,
  });

  return apiRequest<CatalogResponse>(`/api/catalog?${params.toString()}`, {
    method: "GET",
    signal,
    retry: true,
  });
}

export async function getTrailer(item: { id: number | string; type: string }): Promise<string | null> {
  if (!USE_BACKEND_API) return null;
  try {
    const result = await apiRequest<{ status: string; trailerId: string | null }>(
      `/api/catalog/${String(item.id)}/trailer?type=${encodeURIComponent(item.type)}`,
      { method: "GET", retry: false }
    );
    return result.trailerId ?? null;
  } catch {
    return null;
  }
}

export async function getFeatured(): Promise<{ data: import("@/types/catalog").CatalogItem[] }> {
  if (!USE_BACKEND_API) return { data: [] };
  try {
    return await apiRequest<{ data: import("@/types/catalog").CatalogItem[] }>(
      "/api/catalog/featured",
      { method: "GET", retry: true }
    );
  } catch {
    return { data: [] };
  }
}
