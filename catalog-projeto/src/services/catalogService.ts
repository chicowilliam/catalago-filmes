import { apiRequest } from "@/services/apiClient";
import { USE_BACKEND_API } from "@/config/runtime";
import { mockCatalogData } from "@/mocks/catalogData";
import type { CatalogResponse } from "@/types/catalog";

export async function listCatalog(search = "", signal?: AbortSignal) {
  if (!USE_BACKEND_API) {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? mockCatalogData.filter((item) => item.title.toLowerCase().includes(normalizedSearch))
      : mockCatalogData;

    return {
      status: "success",
      source: "local",
      data: filtered,
      count: filtered.length,
      pagination: {
        page: 1,
        pageSize: filtered.length,
        total: filtered.length,
        totalPages: 1,
      },
    } satisfies CatalogResponse;
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
