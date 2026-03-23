/**
 * Estado mutável compartilhado entre módulos.
 * Todos os módulos importam este objeto e lêem/escrevem propriedades diretamente.
 * Como módulos ES são singletons, todos compartilham a mesma referência.
 */
export const state = {
  currentType: "all",
  currentSearch: "",
  allItems: [],
  currentCatalogSource: "local",
  hasShownFallbackToast: false,
  scrollProgressReady: false,
  debounceTimer: null,
  filterTransitionTimer: null,
  filterTransitionEnterTimer: null,
  filterTransitionRunId: 0,
  isFilterTransitioning: false,
  disableSectionFade: false,
  autoRefreshTimer: null,
  activeCatalogController: null,
  latestCatalogRequestId: 0,
  heroParallaxRaf: null,
  heroParallax: { x: 0, y: 0 },
  imageObserver: null,
  revealObserver: null,
  gridInteractionsReady: false,
  sliderAutoTimer: null,
  sectionFadeTimers: new WeakMap(),
};
