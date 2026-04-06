import { startTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { AboutSection } from "@/components/catalog/AboutSection";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { FeaturedSlider } from "@/components/catalog/FeaturedSlider";
import { FeaturedSkeleton } from "@/components/catalog/FeaturedSkeleton";
import { FilterTabs } from "@/components/catalog/FilterTabs";
import { MovieModal } from "@/components/catalog/MovieModal";
import { SearchBar } from "@/components/catalog/SearchBar";
import { AppShell } from "@/components/layout/AppShell";
import { useCatalog } from "@/hooks/useCatalog";
import { useFeatured } from "@/hooks/useFeatured";
import { useModal } from "@/hooks/useModal";
import { useRatings } from "@/hooks/useRatings";
import type { CatalogItem, CatalogType } from "@/types/catalog";

interface CatalogPageProps {
  username?: string;
  onLogout: () => void;
}

const TAB_ORDER: CatalogType[] = ["all", "movie", "series", "favorites", "about"];

function getTabIndex(type: CatalogType) {
  const index = TAB_ORDER.indexOf(type);
  return index === -1 ? 0 : index;
}

export function CatalogPage({ username, onLogout }: CatalogPageProps) {
  const {
    items,
    activeType,
    setActiveType,
    search,
    submitSearch,
    isLoading,
    error,
    retry,
    favoriteIds,
    toggleFavorite,
    page,
    setPage,
    totalPages,
  } = useCatalog();

  const { items: featuredItems, isLoading: isFeaturedLoading } = useFeatured();

  const { getRating, setRating } = useRatings();
  const { openItem, open, close } = useModal();
  const previousTabIndexRef = useRef(getTabIndex(activeType));

  // ── Wipe curtain (CSS transition inline, Portal renderiza direto no body) ──
  const curtainRef  = useRef<HTMLDivElement>(null);
  const isWipingRef = useRef(false);

  function scrollToTopOnTabChange() {
    const scrollRoot = document.querySelector(".main-container") as HTMLElement | null;
    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  /**
   * Wipe lateral com visual glass/futurista usando CSS transition + setTimeout.
   *
   * Por que não usamos useAnimation() do Framer Motion:
   *   - No FM v12 + React 19, useAnimation foi depreciado e pode não acionar
   *     a animação quando chamado após um await (subscriber pode ser perdido).
   *
   * Por que CSS transition + setTimeout garante o timing:
   *   - `transition: none` + reflow + novo transform = posição instantânea 100%
   *   - `transition: Xms` + novo transform = animação exatamente de Xms
   *   - setTimeout(fn, Xms) dispara após a transição terminar — sem distorção
   *
  * Timeline:
  *   0ms → 220ms  cortina entra (cobre a tela)
  *   220ms         setActiveType (DOM troca sob a cortina, invisível ao usuário)
  *   220ms → 470ms cortina sai  (revela o novo conteúdo)
   */
  const runWipe = (nextType: CatalogType, dir: number) => {
    const curtain = curtainRef.current;
    if (!curtain) {
      startTransition(() => { setActiveType(nextType); });
      scrollToTopOnTabChange();
      return;
    }

    const ENTER_MS = 150;
    const EXIT_MS  = 172;
    const startX   = dir >= 0 ? '110%' : '-110%';
    const endX     = dir >= 0 ? '-110%' : '110%';

    isWipingRef.current = true;

    // rAF: reflow fora do event handler → INP mede apenas o microtask síncrono
    requestAnimationFrame(() => {
      // PASSO 1: posição instantânea fora da tela (sem transição)
      curtain.style.transition = 'none';
      curtain.style.transform  = `translateX(${startX})`;
      void curtain.offsetHeight; // força reflow fora do event handler

      // PASSO 2: desliza para cobrir a tela
      curtain.style.transition = `transform ${ENTER_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      curtain.style.transform  = 'translateX(0%)';

      // PASSO 3: após cobertura completa, troca o conteúdo (não-urgente)
      setTimeout(() => {
        startTransition(() => { setActiveType(nextType); }); // re-render não bloqueia input
        scrollToTopOnTabChange();

        // PASSO 4: inicia saída após um tick para React commitar o novo DOM
        setTimeout(() => {
          void curtain.offsetHeight;
          curtain.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          curtain.style.transform  = `translateX(${endX})`;

          // PASSO 5: limpeza
          setTimeout(() => {
            curtain.style.transition = 'none';
            curtain.style.transform  = 'translateX(110%)';
            isWipingRef.current = false;
          }, EXIT_MS + 60);
        }, 16);
      }, ENTER_MS);
    });
  };
  // ─────────────────────────────────────────────────────────────────────────

  function handleTabChange(nextType: CatalogType) {
    if (nextType === activeType || isWipingRef.current) return;

    const nextIndex    = getTabIndex(nextType);
    const previousIndex = previousTabIndexRef.current;
    const dir          = nextIndex > previousIndex ? 1 : -1;

    if (nextIndex !== previousIndex) {
      previousTabIndexRef.current = nextIndex;
    }

    runWipe(nextType, dir);
  }

  function handleToggleFavorite(item: CatalogItem) {
    toggleFavorite(item);
  }

  function handleRate(itemId: number, stars: number) {
    setRating(itemId, stars);
  }

  const hasSearch = search.trim().length > 0;
  const hasSearchResults = hasSearch && !isLoading && !error;

  return (
    <AppShell
      username={username}
      onLogout={onLogout}
      nav={<FilterTabs activeType={activeType} onChange={handleTabChange} username={username} onLogout={onLogout} />}
      searchSlot={<SearchBar defaultValue={search} onSearch={submitSearch} isLoading={isLoading} />}
    >
      <>
      <section className="catalog-page">
        {/* ── Destaque compacto — visível apenas na aba Início ── */}
        {activeType === "all" && !hasSearch && (
          isFeaturedLoading
            ? <FeaturedSkeleton />
            : featuredItems.length > 0 && <FeaturedSlider items={featuredItems} onOpenModal={open} />
        )}

        <div aria-live="polite">
          {activeType === "about" ? (
            <AboutSection />
          ) : (
            <>
              {hasSearchResults && (
                <div className="search-results-summary" aria-live="polite">
                  {items.length > 0
                    ? `Foram encontrados ${items.length} filme${items.length > 1 ? "s" : ""}/serie${items.length > 1 ? "s" : ""} com o titulo de "${search}".`
                    : `Nao existe titulo com o nome "${search}", lamento.`}
                </div>
              )}
              {activeType !== "all" && (
                <div className="section-headline section-block">
                  <h2 className="section-title">
                    {activeType === "movie" ? "Filmes" : activeType === "series" ? "Séries" : "Favoritos"}
                  </h2>
                </div>
              )}
              <CatalogGrid
                items={items}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
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
        </div>
      </section>

      {/* Modal renderizado via Portal direto no <body> — fora de qualquer
          stacking context (willChange: transform no motion.div do App.tsx,
          perspective no main-container), garantindo z-index correto */}
      {createPortal(
        <MovieModal
          item={openItem}
          rating={openItem != null ? getRating(openItem.id) : 0}
          isFavorite={openItem != null ? favoriteIds.has(openItem.id) : false}
          onClose={close}
          onRate={handleRate}
          onFavoriteToggle={handleToggleFavorite}
        />,
        document.body
      )}

      {/* Cortina renderizada via Portal direto no <body> — fora de qualquer
          stacking context do component tree (isolation, perspective, etc.) */}
      {createPortal(
        <div ref={curtainRef} className="wipe-curtain" aria-hidden="true" />,
        document.body
      )}
      </>
    </AppShell>
  );
}
