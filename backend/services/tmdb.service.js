// backend/services/tmdb.service.js
//
// Responsável exclusivamente pela integração com a API da TMDB.
// Não conhece HTTP do Express (req/res), não conhece o banco de dados.
// Só sabe buscar dados na TMDB e devolvê-los no formato do nosso catálogo.

const AppError = require("../utils/AppError");
const {
  getCatalogLimit,
  getTmdbTimeoutMs,
  getTmdbAutoPages,
} = require("../config/catalog.config");

const logger = require("../utils/logger");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache em memória — válido para instância única de Node.
// Para múltiplas instâncias (PM2 cluster / deploy horizontal), migrar para Redis.
class CacheStore {
  constructor(ttlMs) {
    this._ttl = ttlMs;
    this._entries = new Map();
  }

  get(key) {
    const entry = this._entries.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this._ttl) return null; // expirado, mas mantido para getStale
    return entry.data;
  }

  // Retorna o dado mesmo expirado — útil como fallback quando a TMDB está fora
  getStale(key) {
    const entry = this._entries.get(key);
    return entry ? entry.data : null;
  }

  set(key, data) {
    this._entries.set(key, { ts: Date.now(), data });
  }
}

const cache = new CacheStore(CACHE_TTL_MS);
const trailerCache = new CacheStore(CACHE_TTL_MS);
const posterLookupCache = new CacheStore(CACHE_TTL_MS);

// --- Funções internas de autenticação na TMDB ---

function buildHeaders() {
  if (!process.env.TMDB_BEARER_TOKEN) return {};
  return { Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}` };
}

function withApiKey(urlString) {
  if (!process.env.TMDB_API_KEY || process.env.TMDB_BEARER_TOKEN) return urlString;
  const url = new URL(urlString);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY);
  return url.toString();
}

// --- Requisição HTTP usando fetch nativo (disponível a partir do Node 18) ---

async function httpGetJson(url) {
  let res;
  try {
    res = await fetch(withApiKey(url), {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(getTmdbTimeoutMs()),
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new AppError("Tempo limite excedido ao consultar TMDB", 504, "TMDB_TIMEOUT");
    }
    throw new AppError("Falha de rede ao consultar TMDB", 502, "TMDB_NETWORK_ERROR");
  }

  if (!res.ok) {
    throw new AppError(`TMDB retornou status ${res.status}`, 502, "TMDB_REQUEST_ERROR");
  }

  try {
    return await res.json();
  } catch {
    throw new AppError("Resposta inválida da TMDB", 502, "TMDB_PARSE_ERROR");
  }
}

// --- Transformação: formato TMDB → formato do nosso catálogo ---

function mapItem(tmdbItem) {
  const isMovie =
    tmdbItem.media_type === "movie" ||
    (!tmdbItem.media_type && !!tmdbItem.title && !tmdbItem.name);
  const posterPath = tmdbItem.poster_path;
  
  if (!posterPath) {
    logger.warn("Item sem poster_path", { tmdbId: tmdbItem.id, title: tmdbItem.title || tmdbItem.name });
  }
  
  return {
    id: `tmdb-${tmdbItem.id}`,
    title: tmdbItem.title || tmdbItem.name || "Título indisponível",
    type: isMovie ? "movie" : "series",
    image: posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : "",
    synopsis: tmdbItem.overview || "Sinopse indisponível.",
    trailerId: "",
  };
}



async function fetchTrailerId(item) {
  const tmdbId = String(item.id || "").replace("tmdb-", "");
  if (!tmdbId) return "";

  const mediaType = item.type === "series" ? "tv" : "movie";
  const cacheKey = `${mediaType}:${tmdbId}`;
  const cached = trailerCache.get(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?language=pt-BR`;
    const response = await httpGetJson(url);
    const results = Array.isArray(response.results) ? response.results : [];

    const preferred = results.find((video) => video.site === "YouTube" && video.type === "Trailer")
      || results.find((video) => video.site === "YouTube" && video.type === "Teaser")
      || results.find((video) => video.site === "YouTube");

    const key = preferred && preferred.key ? preferred.key : "";
    trailerCache.set(cacheKey, key);
    return key;
  } catch {
    trailerCache.set(cacheKey, "");
    return "";
  }
}

async function attachTrailers(items, maxItems = 12) {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  const enriched = items.map((item) => ({ ...item }));
  const targets = enriched
    .filter((item) => String(item.id || "").startsWith("tmdb-") && !item.trailerId)
    .slice(0, maxItems);

  await Promise.all(
    targets.map(async (item) => {
      const trailerId = await fetchTrailerId(item);
      if (trailerId) {
        item.trailerId = trailerId;
      }
    })
  );

  return enriched;
}

async function resolvePosterForTitle(title, type) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle || !(process.env.TMDB_API_KEY || process.env.TMDB_BEARER_TOKEN)) {
    return "";
  }

  const normalizedType = type === "series" ? "tv" : "movie";
  const cacheKey = `${normalizedType}:${normalizedTitle.toLowerCase()}`;
  const cached = posterLookupCache.get(cacheKey);
  if (cached !== null) return cached;

  try {
    const endpoint = `${TMDB_BASE_URL}/search/${normalizedType}?language=pt-BR&query=${encodeURIComponent(normalizedTitle)}&include_adult=false&page=1`;
    const response = await httpGetJson(endpoint);
    const results = Array.isArray(response.results) ? response.results : [];
    const preferred = results.find((item) => item.poster_path) || null;
    const posterUrl = preferred && preferred.poster_path ? `${TMDB_IMAGE_BASE}${preferred.poster_path}` : "";
    posterLookupCache.set(cacheKey, posterUrl);
    return posterUrl;
  } catch {
    posterLookupCache.set(cacheKey, "");
    return "";
  }
}

// --- Função principal exportada ---

/**
 * Busca filmes/séries na TMDB com suporte a filtro e busca textual.
 * Retorna { items: Array, stale: boolean }.
 * - stale = true quando a TMDB estava fora e foi usado cache expirado anterior.
 *
 * @param {string} type   - "movie", "series" ou "all"
 * @param {string} search - texto de busca (opcional)
 * @returns {Promise<{ items: Array, stale: boolean }>}
 */
async function fetchFromTmdb(type, search) {
  const safeSearch = (search || "").trim();
  const autoPages = getTmdbAutoPages();
  const limit = getCatalogLimit();
  const cacheKey = `${type || "all"}::${safeSearch.toLowerCase()}::${autoPages}::${limit}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug("TMDB cache hit", { key: cacheKey });
    return { items: cached, stale: false };
  }

  logger.info("Buscando na TMDB", { type, search: safeSearch });

  try {
    let rawItems = [];

    if (safeSearch) {
      const url = `${TMDB_BASE_URL}/search/multi?language=pt-BR&query=${encodeURIComponent(safeSearch)}&include_adult=false&page=1`;
      const response = await httpGetJson(url);
      rawItems = Array.isArray(response.results) ? response.results : [];
    } else {
      const movieReqs = [];
      const tvReqs = [];

      for (let page = 1; page <= autoPages; page++) {
        movieReqs.push(httpGetJson(`${TMDB_BASE_URL}/trending/movie/week?language=pt-BR&page=${page}`));
        tvReqs.push(httpGetJson(`${TMDB_BASE_URL}/trending/tv/week?language=pt-BR&page=${page}`));
      }

      const [moviePages, tvPages] = await Promise.all([
        Promise.all(movieReqs),
        Promise.all(tvReqs),
      ]);

      const movies = moviePages.flatMap((r) =>
        Array.isArray(r.results) ? r.results.map((i) => ({ ...i, media_type: "movie" })) : []
      );
      const series = tvPages.flatMap((r) =>
        Array.isArray(r.results) ? r.results.map((i) => ({ ...i, media_type: "tv" })) : []
      );

      rawItems = movies.concat(series);
    }

    // Mapear, filtrar sem imagem e deduplicar
    const seen = new Set();
    const mappedItems = rawItems
      .filter((i) => i && (i.media_type === "movie" || i.media_type === "tv" || i.title || i.name))
      .map(mapItem);

    const itemsWithImage = mappedItems.filter((i) => i.image);

    if (mappedItems.length > 0 && itemsWithImage.length === 0) {
      logger.error("Nenhuma imagem encontrada — verifique a chave TMDB", {
        mapped: mappedItems.length,
        withImage: 0,
        sample: mappedItems.slice(0, 2),
      });
    }

    let deduped = itemsWithImage.filter((i) => {
      const key = `${i.type}-${i.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filtrar por tipo se solicitado
    if (type && type !== "all") {
      const normalizedType = type === "series" ? "series" : "movie";
      deduped = deduped.filter((i) => i.type === normalizedType);
    }

    logger.info("TMDB retornou itens válidos", { count: deduped.length });
    cache.set(cacheKey, deduped);
    return { items: deduped, stale: false };

  } catch (err) {
    // Se a TMDB falhou mas há cache expirado, usa ele como fallback
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      logger.warn("TMDB indisponivel — retornando cache anterior", { error: err.message, key: cacheKey });
      return { items: staleData, stale: true };
    }
    throw err;
  }
}

module.exports = { fetchFromTmdb, attachTrailers, resolvePosterForTitle };
