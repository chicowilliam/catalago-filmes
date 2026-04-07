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
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 20 * 1000;

const tmdbCircuit = {
  failures: 0,
  openUntil: 0,
};

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
  if (Date.now() < tmdbCircuit.openUntil) {
    throw new AppError("TMDB temporariamente indisponível", 503, "TMDB_CIRCUIT_OPEN");
  }

  let res;
  try {
    res = await fetch(withApiKey(url), {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(getTmdbTimeoutMs()),
    });
  } catch (err) {
    tmdbCircuit.failures += 1;
    if (tmdbCircuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
      tmdbCircuit.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
      logger.warn("tmdb_circuit_opened", {
        failures: tmdbCircuit.failures,
        cooldownMs: CIRCUIT_COOLDOWN_MS,
      });
    }

    if (err.name === "TimeoutError") {
      throw new AppError("Tempo limite excedido ao consultar TMDB", 504, "TMDB_TIMEOUT");
    }
    throw new AppError("Falha de rede ao consultar TMDB", 502, "TMDB_NETWORK_ERROR");
  }

  if (!res.ok) {
    tmdbCircuit.failures += 1;
    if (tmdbCircuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
      tmdbCircuit.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
      logger.warn("tmdb_circuit_opened", {
        failures: tmdbCircuit.failures,
        cooldownMs: CIRCUIT_COOLDOWN_MS,
        status: res.status,
      });
    }
    throw new AppError(`TMDB retornou status ${res.status}`, 502, "TMDB_REQUEST_ERROR");
  }

  tmdbCircuit.failures = 0;
  tmdbCircuit.openUntil = 0;

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
  const backdropPath = tmdbItem.backdrop_path;

  if (!posterPath) {
    logger.warn("Item sem poster_path", { tmdbId: tmdbItem.id, title: tmdbItem.title || tmdbItem.name });
  }

  const rawDate = tmdbItem.release_date || tmdbItem.first_air_date || "";
  const year = rawDate.slice(0, 4) || "";

  const rawRating = tmdbItem.vote_average;
  const rating = rawRating != null && rawRating > 0
    ? Number(rawRating.toFixed(1))
    : null;

  return {
    id: `tmdb-${tmdbItem.id}`,
    title: tmdbItem.title || tmdbItem.name || "Título indisponível",
    type: isMovie ? "movie" : "series",
    image: posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : "",
    backdrop: backdropPath ? `${TMDB_BACKDROP_BASE}${backdropPath}` : "",
    synopsis: tmdbItem.overview || "Sinopse indisponível.",
    trailerId: "",
    year,
    rating,
  };
}



async function fetchTrailerId(item, language = "pt-BR") {
  const tmdbId = String(item.id || "").replace("tmdb-", "");
  if (!tmdbId) return "";

  const mediaType = item.type === "series" ? "tv" : "movie";
  const cacheKey = `${mediaType}:${tmdbId}:${language}`;
  const cached = trailerCache.get(cacheKey);
  if (cached !== null) return cached;

  const findTrailer = (results) =>
    results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    results.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
    results.find((v) => v.site === "YouTube");

  try {
    const preferredLang = language === "en-US" ? "en-US" : "pt-BR";
    const fallbackLang = preferredLang === "en-US" ? "pt-BR" : "en-US";

    const preferredUrl = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?language=${preferredLang}`;
    const preferredResponse = await httpGetJson(preferredUrl);
    const preferredResults = Array.isArray(preferredResponse.results) ? preferredResponse.results : [];
    let preferred = findTrailer(preferredResults);

    if (!preferred) {
      const fallbackUrl = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?language=${fallbackLang}`;
      const fallbackResponse = await httpGetJson(fallbackUrl);
      const fallbackResults = Array.isArray(fallbackResponse.results) ? fallbackResponse.results : [];
      preferred = findTrailer(fallbackResults);
    }

    const key = preferred && preferred.key ? preferred.key : "";
    trailerCache.set(cacheKey, key);
    return key;
  } catch {
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

// --- Utilitário de embaralhamento (Fisher-Yates in-place) ---

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
async function fetchFromTmdb(type, search, language = "pt-BR") {
  const safeSearch = (search || "").trim();
  const autoPages = getTmdbAutoPages();
  const limit = getCatalogLimit();
  const cacheKey = `${type || "all"}::${safeSearch.toLowerCase()}::${autoPages}::${limit}::${language}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug("TMDB cache hit", { key: cacheKey });
    return { items: cached, stale: false };
  }

  logger.info("Buscando na TMDB", { type, search: safeSearch });

  try {
    let rawItems = [];

    if (safeSearch) {
      const url = `${TMDB_BASE_URL}/search/multi?language=${language}&query=${encodeURIComponent(safeSearch)}&include_adult=false&page=1`;
      const response = await httpGetJson(url);
      rawItems = Array.isArray(response.results) ? response.results : [];
    } else {
      const movieReqs = [];
      const tvReqs = [];

      for (let page = 1; page <= autoPages; page++) {
        movieReqs.push(httpGetJson(`${TMDB_BASE_URL}/trending/movie/week?language=${language}&page=${page}`));
        tvReqs.push(httpGetJson(`${TMDB_BASE_URL}/trending/tv/week?language=${language}&page=${page}`));
      }

      const [moviePages, tvPages] = await Promise.all([
        Promise.all(movieReqs),
        Promise.all(tvReqs),
      ]);

      const movies = shuffle(moviePages.flatMap((r) =>
        Array.isArray(r.results) ? r.results.map((i) => ({ ...i, media_type: "movie" })) : []
      ));
      const series = shuffle(tvPages.flatMap((r) =>
        Array.isArray(r.results) ? r.results.map((i) => ({ ...i, media_type: "tv" })) : []
      ));

      // Interleave movies e series para garantir distribuição igual
      const maxLen = Math.max(movies.length, series.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < movies.length) rawItems.push(movies[i]);
        if (i < series.length) rawItems.push(series[i]);
      }
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

/**
 * Busca um pool diversificado de itens para o FeaturedSlider.
 * Usa trending/week + popular + top_rated de filmes e séries.
 * Retorna 16 itens aleatórios com backdrop disponível.
 */
const featuredCache = new CacheStore(CACHE_TTL_MS);

async function fetchFeatured(language = "pt-BR") {
  const cacheKey = `featured:${language}`;
  const cached = featuredCache.get(cacheKey);
  if (cached) return cached;

  logger.info("Buscando featured na TMDB");

  try {
    const endpoints = [
      `${TMDB_BASE_URL}/trending/movie/week?language=${language}&page=1`,
      `${TMDB_BASE_URL}/trending/tv/week?language=${language}&page=1`,
      `${TMDB_BASE_URL}/movie/popular?language=${language}&page=1`,
      `${TMDB_BASE_URL}/tv/popular?language=${language}&page=1`,
      `${TMDB_BASE_URL}/movie/top_rated?language=${language}&page=1`,
      `${TMDB_BASE_URL}/tv/top_rated?language=${language}&page=1`,
      `${TMDB_BASE_URL}/movie/now_playing?language=${language}&page=1`,
      `${TMDB_BASE_URL}/tv/on_the_air?language=${language}&page=1`,
    ];

    const responses = await Promise.all(endpoints.map((url) => httpGetJson(url).catch(() => null)));

    const mediaTypes = ["movie", "tv", "movie", "tv", "movie", "tv", "movie", "tv"];
    const seen = new Set();
    let all = [];

    responses.forEach((r, idx) => {
      if (!r || !Array.isArray(r.results)) return;
      r.results.forEach((item) => {
        if (!item || !item.backdrop_path) return;
        const tagged = { ...item, media_type: mediaTypes[idx] };
        const key = `${mediaTypes[idx]}-${item.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(tagged);
        }
      });
    });

    // Embaralha e pega 16 com backdrop
    const shuffled = shuffle(all).slice(0, 16);
    const items = shuffled.map(mapItem).filter((i) => i.image && i.backdrop);

    featuredCache.set(cacheKey, items);
    return items;
  } catch (err) {
    const stale = featuredCache.getStale(cacheKey);
    if (stale) return stale;
    logger.warn("fetchFeatured falhou", { error: err.message });
    return [];
  }
}

async function pingTmdb() {
  if (!(process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_KEY)) {
    throw new AppError(
      "Catalogo local foi removido. Configure TMDB_BEARER_TOKEN ou TMDB_API_KEY no ambiente.",
      503,
      "TMDB_NOT_CONFIGURED"
    );
  }

  await httpGetJson(`${TMDB_BASE_URL}/configuration`);
  return { status: "up" };
}

module.exports = {
  fetchFromTmdb,
  attachTrailers,
  resolvePosterForTitle,
  fetchTrailerById: fetchTrailerId,
  fetchFeatured,
  pingTmdb,
};
