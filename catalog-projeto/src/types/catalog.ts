export type CatalogType = "all" | "movie" | "series" | "favorites" | "about";

export interface CatalogItem {
  id: number;
  title: string;
  image: string;
  type: "movie" | "series";
  synopsis: string;
  trailerId?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CatalogResponse {
  status: "success";
  source: "local" | "tmdb" | "local-fallback" | "tmdb-stale";
  warning?: string;
  data: CatalogItem[];
  count: number;
  pagination: PaginationInfo;
}
