import { useEffect, useState } from "react";
import { getFeatured } from "@/services/catalogService";
import type { CatalogItem } from "@/types/catalog";

const AUTO_REFRESH_MS = 2 * 60 * 1000; // igual ao catálogo principal
const FEATURED_CACHE_KEY = "catalogx.cache.featured";
const FEATURED_CACHE_TTL_MS = 10 * 60 * 1000;

interface FeaturedCachePayload {
  data: CatalogItem[];
  cachedAt: number;
}

function readFeaturedCache(): FeaturedCachePayload | null {
  try {
    const raw = localStorage.getItem(FEATURED_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FeaturedCachePayload>;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.cachedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.cachedAt > FEATURED_CACHE_TTL_MS) {
      return null;
    }

    return {
      data: parsed.data,
      cachedAt: parsed.cachedAt,
    };
  } catch {
    return null;
  }
}

function writeFeaturedCache(data: CatalogItem[]) {
  try {
    const payload: FeaturedCachePayload = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignora falha de storage
  }
}

export function useFeatured() {
  const [initialCache] = useState<FeaturedCachePayload | null>(() => readFeaturedCache());
  const [items, setItems] = useState<CatalogItem[]>(() => initialCache?.data ?? []);
  const [isLoading, setIsLoading] = useState(() => !initialCache);

  useEffect(() => {
    let cancelled = false;
    let initialRefreshTimer: number | null = null;

    async function load(silent = false) {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        const result = await getFeatured();
        if (!cancelled) {
          setItems(result.data);
          writeFeaturedCache(result.data);
        }
      } finally {
        if (!silent && !cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (initialCache?.data.length) {
      initialRefreshTimer = window.setTimeout(() => {
        void load(true);
      }, 240);
    }
    else {
      void load(false);
    }

    const timer = window.setInterval(() => {
      void load(true);
    }, AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      if (initialRefreshTimer != null) {
        window.clearTimeout(initialRefreshTimer);
      }
      window.clearInterval(timer);
    };
  }, [initialCache]);

  return { items, isLoading };
}
