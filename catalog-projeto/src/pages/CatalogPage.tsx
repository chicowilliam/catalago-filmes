import { useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
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
import type { Variants } from "framer-motion";
import type { CatalogType } from "@/types/catalog";

const pageSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? "100%" : "-100%",
    rotateY: direction >= 0 ? -9 : 9,
    opacity: 0.78,
    filter: "blur(4px)",
    zIndex: 1,
    transformOrigin: direction >= 0 ? "100% 50%" : "0% 50%",
  }),
  center: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    filter: "blur(0px)",
    zIndex: 2,
    transformOrigin: "50% 50%",
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? "-100%" : "100%",
    rotateY: direction >= 0 ? 9 : -9,
    opacity: 0.78,
    filter: "blur(4px)",
    zIndex: 1,
    transformOrigin: direction >= 0 ? "0% 50%" : "100% 50%",
  }),
};

const TAB_ORDER: CatalogType[] = ["all", "movie", "series", "favorites", "about"];

function getTabIndex(type: CatalogType) {
  const index = TAB_ORDER.indexOf(type);
  return index === -1 ? 0 : index;
}

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
    page,
    setPage,
    totalPages,
  } = useCatalog();

  const { getRating, setRating } = useRatings();
  const { openItem, open, close } = useModal();
  const { toasts, pushToast, removeToast } = useToast();
  const [direction, setDirection] = useState(1);
  const previousTabIndexRef = useRef(getTabIndex(activeType));

  // ── Wipe curtain ──────────────────────────────────────────────────────────
  const wipeAnimation = useAnimation();
  const isWipingRef   = useRef(false);

  /**
   * Wipe Star Wars: a cortina entra cobrindo a tela (fase 1),
   * troca o conteúdo (invisível ao usuário) e sai revelando o novo (fase 2).
   * Usa useAnimation para controle imperativo sem closures desatualizadas.
   */
  const runWipe = async (nextType: CatalogType, dir: number) => {
    isWipingRef.current = true;
    const startX = dir >= 0 ? '110%' : '-110%';
    const endX   = dir >= 0 ? '-110%' : '110%';

    // Reposiciona instantaneamente fora da tela
    wipeAnimation.set({ x: startX });

    // Fase 1: cobre a tela (260ms)
    await wipeAnimation.start({
      x: '0%',
      transition: { duration: 0.26, ease: [0.76, 0, 0.24, 1] },
    });

    // Troca de conteúdo enquanto a cortina cobre tudo
    setActiveType(nextType);
    // Micro-pausa para o React commitar o novo DOM
    await new Promise<void>((resolve) => setTimeout(resolve, 20));

    // Fase 2: sai revelando o novo conteúdo (300ms)
    await wipeAnimation.start({
      x: endX,
      transition: { duration: 0.30, ease: [0.24, 0, 0.76, 1] },
    });

    // Reseta para off-screen padrão (direita)
    wipeAnimation.set({ x: '110%' });
    isWipingRef.current = false;
  };
  // ─────────────────────────────────────────────────────────────────────────

  const showCatalog = activeType !== "about";

  function handleTabChange(nextType: CatalogType) {
    if (nextType === activeType || isWipingRef.current) return;

    const nextIndex    = getTabIndex(nextType);
    const previousIndex = previousTabIndexRef.current;
    const dir          = nextIndex > previousIndex ? 1 : -1;

    if (nextIndex !== previousIndex) {
      setDirection(dir);
      previousTabIndexRef.current = nextIndex;
    }

    runWipe(nextType, dir);
  }

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
          <FilterTabs activeType={activeType} onChange={handleTabChange} />
          <SearchBar open={showCatalog} defaultValue={search} onSearch={submitSearch} />
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

        <div className="tab-transition-viewport" aria-live="polite">
          <div className="tab-transition-stage">
            <AnimatePresence initial={false} mode="sync" custom={direction}>
              <motion.div
                key={activeType}
                className="tab-transition-panel"
                custom={direction}
                variants={pageSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.58, ease: "easeInOut" }}
              >
                {activeType === "about" ? (
                  <AboutSection />
                ) : (
                  <>
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
                    {!isLoading && !error && totalPages > 1 && (
                      <nav className="catalog-pagination" aria-label="Paginação do catálogo">
                        <button
                          className="pagination-btn"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          aria-label="Página anterior"
                        >
                          ←
                        </button>
                        <span className="pagination-info">
                          {page} / {totalPages}
                        </span>
                        <button
                          className="pagination-btn"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                          aria-label="Próxima página"
                        >
                          →
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <MovieModal
        item={openItem}
        rating={openItem != null ? getRating(openItem.id) : 0}
        onClose={close}
        onRate={handleRate}
      />

      <ToastHost toasts={toasts} onDismiss={removeToast} />

      {/* ── Cortina de wipe Star Wars ──────────────────────────────────────
           position:fixed garante cobertura total da viewport,
           mesmo dentro de containers com overflow:hidden.
           z-index 1050: acima do header e modal, abaixo do toast e login.
      ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        className="wipe-curtain"
        animate={wipeAnimation}
        initial={{ x: '110%' }}
      />
    </>
  );
}
