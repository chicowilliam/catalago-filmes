import { useState } from "react";
import { motion } from "framer-motion";

import { MovieCard } from "@/components/catalog/MovieCard";
import { SkeletonCard } from "@/components/catalog/SkeletonCard";
import type { CatalogItem } from "@/types/catalog";

const SKELETON_COUNT = 8;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{
            opacity: hoveredId && hoveredId !== item.id ? 0.55 : 1,
            y: 0,
            scale: hoveredId === item.id ? 1.06 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onHoverStart={() => setHoveredId(item.id)}
          onHoverEnd={() => setHoveredId(null)}
          style={{ transformOrigin: "center top" }}
        >
          <MovieCard
            item={item}
            isFavorite={favoriteIds.has(item.id)}
            rating={getRating(item.id)}
            onFavoriteToggle={onFavoriteToggle}
            onOpenModal={onOpenModal}
          />
        </motion.div>
      ))}
    </motion.section>
  );
}
