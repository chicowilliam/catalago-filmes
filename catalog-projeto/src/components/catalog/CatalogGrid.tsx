import { motion } from "framer-motion";

import { MovieCard } from "@/components/catalog/MovieCard";
import { SkeletonCard } from "@/components/catalog/SkeletonCard";
import type { CatalogItem } from "@/types/catalog";

const SKELETON_COUNT = 8;

interface CatalogGridProps {
  items: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenModal: (item: CatalogItem) => void;
  getRating: (id: number) => number;
}

export function CatalogGrid({
  items,
  isLoading,
  error,
  onRetry,
  onOpenModal,
  getRating,
}: CatalogGridProps) {

  if (isLoading) {
    return (
      <section className="catalog-grid" aria-label="Carregando catálogo" aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <SkeletonCard key={i} />
        ))}
      </section>
    );
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
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.32), ease: "easeOut" }}
        >
          <MovieCard
            item={item}
            rating={getRating(item.id)}
            onOpenModal={onOpenModal}
          />
        </motion.div>
      ))}
    </motion.section>
  );
}
