import { useCallback, useEffect, useMemo, useState } from "react";

import { listCatalog } from "@/services/catalogService";
import type { CatalogItem, CatalogType } from "@/types/catalog";

function readFavoriteIds() {
  try {
    const raw = localStorage.getItem("favorites");
    if (!raw) return new Set<number>();
    const parsed = JSON.parse(raw) as CatalogItem[];
    const ids = parsed
      .map((item) => item?.id)
      .filter((id): id is number => Number.isInteger(id));
    return new Set(ids);
  } catch {
    return new Set<number>();
  }
}

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<CatalogType>("all");
  const [source, setSource] = useState<string>("local");
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCatalog = useCallback(async (searchValue = "", silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await listCatalog(searchValue);
      setItems(response.data);
      setSource(response.source);
      setLastUpdated(new Date());
    } catch {
      setError("Nao foi possivel carregar o catalogo agora.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    void fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchCatalog(search, true);
    }, 300000);

    return () => window.clearInterval(timer);
  }, [fetchCatalog, search]);

  const visibleItems = useMemo(() => {
    if (activeType === "favorites") {
      return items.filter((item) => favoriteIds.has(item.id));
    }

    if (activeType === "movie" || activeType === "series") {
      return items.filter((item) => item.type === activeType);
    }

    return items;
  }, [items, favoriteIds, activeType]);

  const counts = useMemo(() => {
    const movies = items.filter((item) => item.type === "movie").length;
    const series = items.filter((item) => item.type === "series").length;
    const favorites = items.filter((item) => favoriteIds.has(item.id)).length;

    return {
      all: items.length,
      movie: movies,
      series,
      favorites,
    };
  }, [items, favoriteIds]);

  const submitSearch = useCallback(
    async (nextSearch: string) => {
      setSearch(nextSearch);
      await fetchCatalog(nextSearch);
    },
    [fetchCatalog]
  );

  const toggleFavorite = useCallback(
    (item: CatalogItem) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        try {
          const favItems = items.filter((i) => next.has(i.id));
          localStorage.setItem("favorites", JSON.stringify(favItems));
        } catch {
          /* ignora erros de storage */
        }
        return next;
      });
    },
    [items]
  );

  return {
    items: visibleItems,
    allItems: items,
    activeType,
    setActiveType,
    search,
    submitSearch,
    isLoading,
    error,
    source,
    counts,
    lastUpdated,
    favoriteIds,
    toggleFavorite,
    retry: () => fetchCatalog(search),
  };
}
