import { searchMeta, searchBox } from "./dom.js";

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function parseStoredJSON(storageKey, fallbackValue) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch {
    localStorage.removeItem(storageKey);
    return fallbackValue;
  }
}

// ---------------------------------------------------------------------------
// Segurança — sanitiza URLs antes de usar em CSS/src
// ---------------------------------------------------------------------------

export function sanitizeUrl(url) {
  try {
    const urlObj = new URL(url, window.location.href);
    const safe =
      urlObj.protocol === "http:" ||
      urlObj.protocol === "https:" ||
      urlObj.protocol === "data:";
    if (!safe) return "";
    return urlObj.toString();
  } catch (err) {
    console.warn("Invalid URL", url, err);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Tempo / Async helpers
// ---------------------------------------------------------------------------

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function ensureMinimumDelay(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = minimumMs - elapsed;
  if (remaining > 0) await wait(remaining);
}

// ---------------------------------------------------------------------------
// Feedback visual
// ---------------------------------------------------------------------------

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

export function setSearchFeedback(message, kind = "idle") {
  if (!searchMeta || !searchBox) return;
  searchMeta.textContent = message;
  searchMeta.classList.toggle("is-loading", kind === "loading");
  searchMeta.classList.toggle("is-error", kind === "error");
  searchBox.classList.toggle("is-loading", kind === "loading");
}

// ---------------------------------------------------------------------------
// Gerenciadores de estado local (favoritos e avaliações)
// ---------------------------------------------------------------------------

export class FavoritesManager {
  constructor() {
    this.favorites = parseStoredJSON("favorites", []);
  }

  addFavorite(movie) {
    if (!this.isFavorite(movie.id)) {
      this.favorites.push(movie);
      this.save();
      return true;
    }
    return false;
  }

  removeFavorite(movieId) {
    this.favorites = this.favorites.filter((fav) => fav.id !== movieId);
    this.save();
  }

  isFavorite(movieId) {
    return this.favorites.some((fav) => fav.id === movieId);
  }

  save() {
    localStorage.setItem("favorites", JSON.stringify(this.favorites));
  }

  getFavorites() {
    return this.favorites;
  }
}

export class RatingManager {
  constructor() {
    this.ratings = parseStoredJSON("ratings", {});
  }

  setRating(movieId, rating) {
    if (rating >= 1 && rating <= 5) {
      this.ratings[movieId] = rating;
      localStorage.setItem("ratings", JSON.stringify(this.ratings));
      return true;
    }
    return false;
  }

  getRating(movieId) {
    return this.ratings[movieId] || 0;
  }
}

// Instâncias únicas compartilhadas pela aplicação
export const favoritesManager = new FavoritesManager();
export const ratingManager = new RatingManager();
