import { AnimatePresence, motion } from "framer-motion";
import { AboutSection } from "@/components/catalog/AboutSection";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { FilterTabs } from "@/components/catalog/FilterTabs";
import { MovieModal } from "@/components/catalog/MovieModal";
import { SearchBar } from "@/components/catalog/SearchBar";
import { ToastHost } from "@/components/layout/ToastHost";
import { useCatalog } from "@/hooks/useCatalog";
import { useModal } from "@/hooks/useModal";
import { useRatings } from "@/hooks/useRatings";
import { useToast } from "@/hooks/useToast";
import type { CatalogType } from "@/types/catalog";

const pagePoseByType: Record<CatalogType, { x: number; y: number; rotate: number }> = {
  all: { x: 0, y: 0, rotate: 0 },
  movie: { x: 16, y: -4, rotate: 0.8 },
  series: { x: -16, y: 4, rotate: -0.8 },
  favorites: { x: 0, y: 10, rotate: 0.5 },
  about: { x: 0, y: -10, rotate: -0.5 },
};

export function CatalogPage() {
  const {
    items,
    activeType,
    setActiveType,
    search,
    submitSearch,
    isLoading,
    error,
    source,
    counts,
    lastUpdated,
    retry,
    favoriteIds,
    toggleFavorite,
  } = useCatalog();

  const { getRating, setRating } = useRatings();
  const { openItem, open, close } = useModal();
  const { toasts, pushToast, removeToast } = useToast();

  const showCatalog = activeType !== "about";

  function handleToggleFavorite(itemId: number) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const alreadyFavorite = favoriteIds.has(item.id);
    toggleFavorite(item);
    pushToast(
      alreadyFavorite
        ? `${item.title} removido dos favoritos`
        : `${item.title} adicionado aos favoritos`,
      "success"
    );
  }

  function handleRate(itemId: number, stars: number) {
    setRating(itemId, stars);
    const item = items.find((entry) => entry.id === itemId) ?? openItem;
    if (item) {
      pushToast(`Você avaliou ${item.title} com ${stars} estrela${stars > 1 ? "s" : ""}.`, "info");
    }
  }

  return (
    <>
      <section className="catalog-page">
        <div className="catalog-toolbar">
          <FilterTabs activeType={activeType} onChange={setActiveType} />
          {showCatalog && (
            <SearchBar defaultValue={search} isLoading={isLoading} onSearch={submitSearch} />
          )}
        </div>

        {showCatalog && (
          <div className="catalog-meta">
            <span>Fonte: {source}</span>
            <span>
              Todos: {counts.all} | Filmes: {counts.movie} | Séries: {counts.series} | Favoritos:
              {" "}{counts.favorites}
            </span>
            <span>
              Atualização automática: 5 min
              {lastUpdated ? ` | Última: ${lastUpdated.toLocaleTimeString("pt-BR")}` : ""}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{
              opacity: 0,
              x: pagePoseByType[activeType].x,
              y: pagePoseByType[activeType].y,
              rotate: pagePoseByType[activeType].rotate,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              x: -pagePoseByType[activeType].x * 0.6,
              y: -pagePoseByType[activeType].y * 0.6,
              rotate: -pagePoseByType[activeType].rotate,
              filter: "blur(4px)",
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
              mass: 0.9,
            }}
            style={{ transformOrigin: "50% 50%" }}
          >
            {activeType === "about" ? (
              <AboutSection />
            ) : (
              <CatalogGrid
                items={items}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
                favoriteIds={favoriteIds}
                onFavoriteToggle={(item) => handleToggleFavorite(item.id)}
                onOpenModal={open}
                getRating={getRating}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <MovieModal
        item={openItem}
        rating={openItem != null ? getRating(openItem.id) : 0}
        onClose={close}
        onRate={handleRate}
      />

      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </>
  );
}
