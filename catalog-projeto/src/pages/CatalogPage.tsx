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
