import type { CatalogType } from "@/types/catalog";

export interface CatalogFilterOption {
  value: CatalogType;
  label: string;
}

export const CATALOG_FILTERS: CatalogFilterOption[] = [
  { value: "all", label: "Início" },
  { value: "movie", label: "Filmes" },
  { value: "series", label: "Séries" },
  { value: "favorites", label: "Favoritos" },
  { value: "about", label: "Sobre" },
];
