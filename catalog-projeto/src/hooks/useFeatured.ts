import { useEffect, useState } from "react";
import { getFeatured } from "@/services/catalogService";
import type { CatalogItem } from "@/types/catalog";

const AUTO_REFRESH_MS = 2 * 60 * 1000; // igual ao catálogo principal

export function useFeatured() {
  const [items, setItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getFeatured();
      if (!cancelled) setItems(result.data);
    }

    void load();

    const timer = window.setInterval(() => {
      void load();
    }, AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return items;
}
