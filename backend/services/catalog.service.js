const tmdbService = require("./tmdb.service");
const { getCatalogLimit, isTmdbEnabled } = require("../config/catalog.config");
const AppError = require("../utils/AppError");

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function limitAndBalance(items, type, search) {
  const limit = getCatalogLimit();
  if (!Array.isArray(items) || items.length === 0) return items;

  if (search || (type && type !== "all")) {
    return shuffleArr(items).slice(0, limit);
  }

  const half = Math.floor(limit / 2);
  const movies = shuffleArr(items.filter((i) => i.type === "movie")).slice(0, half);
  const series = shuffleArr(items.filter((i) => i.type === "series")).slice(0, half);

  // Interleave: 1 filme, 1 série, ...
  const result = [];
  const maxLen = Math.max(movies.length, series.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < movies.length) result.push(movies[i]);
    if (i < series.length) result.push(series[i]);
  }

  return result;
}

function normalizeLang(lang) {
  if (lang === "en" || lang === "en-US") return "en-US";
  return "pt-BR";
}

async function listCatalog(type, search, { page = 1, pageSize = 20, lang } = {}) {
  if (!isTmdbEnabled()) {
    throw new AppError(
      "Catalogo local foi removido. Configure TMDB_BEARER_TOKEN ou TMDB_API_KEY no ambiente.",
      503,
      "TMDB_NOT_CONFIGURED"
    );
  }

  const language = normalizeLang(lang);
  const { items, stale } = await tmdbService.fetchFromTmdb(type, search, language);

  if (!search && items.length === 0) {
    throw new AppError(
      "TMDB retornou catalogo vazio. Verifique se sua chave de API esta valida e tem acesso ao endpoint de trending.",
      502,
      "TMDB_EMPTY_CATALOG"
    );
  }

  const limited = limitAndBalance(items, type, search);

  const total = limited.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = limited.slice(start, start + pageSize);

  // Trailers são buscados sob demanda por /api/catalog/:id/trailer
  // para não bloquear a resposta do catálogo.
  return {
    source: stale ? "tmdb-stale" : "tmdb",
    data: paged,
    pagination: { page, pageSize, total, totalPages },
    ...(stale && { warning: "Catalogo temporariamente em cache. TMDB pode estar indisponivel." }),
  };
}

async function getTrailer(itemId, mediaType, lang) {
  if (!isTmdbEnabled()) {
    throw new AppError("TMDB nao configurado.", 503, "TMDB_NOT_CONFIGURED");
  }
  const language = normalizeLang(lang);
  // Constrói objeto esperado por fetchTrailerById: { id, type }
  const trailerId = await tmdbService.fetchTrailerById({ id: itemId, type: mediaType }, language);
  return { trailerId: trailerId || null };
}

async function listFeatured(lang) {
  if (!isTmdbEnabled()) {
    throw new AppError("TMDB nao configurado.", 503, "TMDB_NOT_CONFIGURED");
  }
  const language = normalizeLang(lang);
  const items = await tmdbService.fetchFeatured(language);
  return { data: items };
}

module.exports = { listCatalog, getTrailer, listFeatured };
