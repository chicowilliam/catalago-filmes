import { AnimatePresence, motion } from "framer-motion";

import { MovieCard } from "@/components/catalog/MovieCard";
import type { CatalogItem } from "@/types/catalog";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

interface CatalogGridProps {
  items: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  favoriteIds: Set<number>;
  onFavoriteToggle: (item: CatalogItem) => void;
  onOpenModal: (item: CatalogItem) => void;
  getRating: (id: number) => number;
}

export function CatalogGrid({
  items,
  isLoading,
  error,
  onRetry,
  favoriteIds,
  onFavoriteToggle,
  onOpenModal,
  getRating,
}: CatalogGridProps) {
  if (isLoading) {
    return <p className="feedback">Carregando catálogo...</p>;
  }

  if (error) {
    return (
      <div className="feedback">
        <p>{error}</p>
        <button type="button" className="secondary-btn" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!items.length) {
    return <p className="feedback">Nenhum título encontrado para este filtro.</p>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={activeKey(items)}
        className="catalog-grid"
        aria-live="polite"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        {items.map((item) => (
          <MovieCard
            key={item.id}
            item={item}
            isFavorite={favoriteIds.has(item.id)}
            rating={getRating(item.id)}
            onFavoriteToggle={onFavoriteToggle}
            onOpenModal={onOpenModal}
          />
        ))}
      </motion.section>
    </AnimatePresence>
  );
}

function activeKey(items: CatalogItem[]) {
  return items.slice(0, 6).map((i) => i.id).join("-");
}
