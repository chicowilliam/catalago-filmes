import { MovieCard } from "@/components/catalog/MovieCard";
import { SkeletonCard } from "@/components/catalog/SkeletonCard";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CatalogItem } from "@/types/catalog";

const SKELETON_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4", "skeleton-5", "skeleton-6", "skeleton-7", "skeleton-8"];


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
  const { text } = useLanguage();

  if (isLoading) {
    return (
      <section className="catalog-grid" aria-label={text.loadingCatalog} aria-busy="true">
        {SKELETON_KEYS.map((key) => (
          <SkeletonCard key={key} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="feedback">
        <p>{error}</p>
        <button type="button" className="secondary-btn" onClick={onRetry}>
          {text.retry}
        </button>
      </div>
    );
  }

  if (!items.length) {
    return <p className="feedback">{text.noTitlesForFilter}</p>;
  }

  return (
    <section className="catalog-grid" aria-live="polite">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="catalog-item"
          style={{ "--item-delay": `${Math.min(index * 12, 120)}ms` } as React.CSSProperties}
        >
          <MovieCard
            item={item}
            rating={getRating(item.id)}
            onOpenModal={onOpenModal}
          />
        </div>
      ))}
    </section>
  );
}
