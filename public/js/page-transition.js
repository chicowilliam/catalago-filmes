import {
  heroPanel,
  moviesSection,
  seriesSection,
  favoritesSection,
  aboutSection,
  stackSection,
} from "./dom.js";

// Ordem visual das abas no header, usada para definir a direção do slide.
const FILTER_ORDER = ["all", "movie", "series", "favorites", "about"];

export function getFilterTravelDirection(fromType, toType) {
  const fromIndex = FILTER_ORDER.indexOf(fromType);
  const toIndex = FILTER_ORDER.indexOf(toType);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return 0;
  }

  return toIndex > fromIndex ? 1 : -1;
}

export function getVisiblePageSections() {
  return [heroPanel, moviesSection, seriesSection, favoritesSection, aboutSection, stackSection]
    .filter(Boolean)
    .filter((section) => !section.classList.contains("is-hidden"));
}
