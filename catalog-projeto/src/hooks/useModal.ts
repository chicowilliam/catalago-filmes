import { useCallback, useState } from "react";

import type { CatalogItem } from "@/types/catalog";

export function useModal() {
  const [openItem, setOpenItem] = useState<CatalogItem | null>(null);

  const open = useCallback((item: CatalogItem) => setOpenItem(item), []);
  const close = useCallback(() => setOpenItem(null), []);

  return { openItem, open, close };
}
