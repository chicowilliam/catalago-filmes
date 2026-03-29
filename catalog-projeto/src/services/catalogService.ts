import { apiRequest } from "@/services/apiClient";
import type { CatalogResponse } from "@/types/catalog";

export async function listCatalog(search = "", signal?: AbortSignal) {
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
