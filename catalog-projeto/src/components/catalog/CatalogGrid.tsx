import { motion } from "framer-motion";

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
    <motion.section
      className="catalog-grid"
      aria-live="polite"
      variants={containerVariants}
      initial={false}
      animate="visible"
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
  );
}
