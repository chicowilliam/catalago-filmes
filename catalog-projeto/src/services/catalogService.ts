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
