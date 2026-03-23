// backend/services/tmdb.service.js
//
// Responsável exclusivamente pela integração com a API da TMDB.
// Não conhece HTTP do Express (req/res), não conhece o banco de dados.
// Só sabe buscar dados na TMDB e devolvê-los no formato do nosso catálogo.

const https = require("https");
const AppError = require("../utils/AppError");
const {
  getCatalogLimit,
  getTmdbTimeoutMs,
  getTmdbAutoPages,
} = require("../config/catalog.config");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache simples em memória: evita bater na TMDB a cada requisição
const cache = new Map();
const trailerCache = new Map();
const posterLookupCache = new Map();

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

// --- Requisição HTTP simples (sem dependências externas) ---

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(withApiKey(url), { headers: buildHeaders() }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new AppError(`TMDB retornou status ${res.statusCode}`, 502, "TMDB_REQUEST_ERROR"));
        }
        try {
          return resolve(JSON.parse(body));
        } catch {
          return reject(new AppError("Resposta inválida da TMDB", 502, "TMDB_PARSE_ERROR"));
        }
      });
    });

    req.setTimeout(getTmdbTimeoutMs(), () => {
      req.destroy(new Error("TMDB request timeout"));
    });

    req.on("error", (err) => {
      if (err.message === "TMDB request timeout") {
        return reject(new AppError("Tempo limite excedido ao consultar TMDB", 504, "TMDB_TIMEOUT"));
      }
      reject(new AppError("Falha de rede ao consultar TMDB", 502, "TMDB_NETWORK_ERROR"));
    });

    req.end();
  });
}

// --- Transformação: formato TMDB → formato do nosso catálogo ---

function mapItem(tmdbItem) {
  const isMovie = tmdbItem.media_type === "movie" || !!tmdbItem.title;
  const posterPath = tmdbItem.poster_path;
  
  // Debug: Log se poster_path está vazio (pode indicar problema com chave TMDB)
  if (!posterPath) {
    console.warn(
      `⚠ Item sem poster_path - TMDB ID: ${tmdbItem.id}, Título: ${tmdbItem.title || tmdbItem.name}`
    );
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

// --- Cache helpers ---

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { timestamp: Date.now(), data });
}

function getTrailerCache(key) {
  const entry = trailerCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    trailerCache.delete(key);
    return null;
  }
  return entry.data;
}

function setTrailerCache(key, data) {
  trailerCache.set(key, { timestamp: Date.now(), data });
}

function getPosterLookupCache(key) {
  const entry = posterLookupCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    posterLookupCache.delete(key);
    return null;
  }
  return entry.data;
}

function setPosterLookupCache(key, data) {
  posterLookupCache.set(key, { timestamp: Date.now(), data });
}

async function fetchTrailerId(item) {
  const tmdbId = String(item.id || "").replace("tmdb-", "");
  if (!tmdbId) return "";

  const mediaType = item.type === "series" ? "tv" : "movie";
  const cacheKey = `${mediaType}:${tmdbId}`;
  const cached = getTrailerCache(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?language=pt-BR`;
    const response = await httpGetJson(url);
    const results = Array.isArray(response.results) ? response.results : [];

    const preferred = results.find((video) => video.site === "YouTube" && video.type === "Trailer")
      || results.find((video) => video.site === "YouTube" && video.type === "Teaser")
      || results.find((video) => video.site === "YouTube");

    const key = preferred && preferred.key ? preferred.key : "";
    setTrailerCache(cacheKey, key);
    return key;
  } catch {
    setTrailerCache(cacheKey, "");
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
  const cached = getPosterLookupCache(cacheKey);
  if (cached !== null) return cached;

  try {
    const endpoint = `${TMDB_BASE_URL}/search/${normalizedType}?language=pt-BR&query=${encodeURIComponent(normalizedTitle)}&include_adult=false&page=1`;
    const response = await httpGetJson(endpoint);
    const results = Array.isArray(response.results) ? response.results : [];
    const preferred = results.find((item) => item.poster_path) || null;
    const posterUrl = preferred && preferred.poster_path ? `${TMDB_IMAGE_BASE}${preferred.poster_path}` : "";
    setPosterLookupCache(cacheKey, posterUrl);
    return posterUrl;
  } catch {
    setPosterLookupCache(cacheKey, "");
    return "";
  }
}

// --- Função principal exportada ---

/**
 * Busca filmes/séries na TMDB com suporte a filtro e busca textual.
 * Retorna os dados já no formato do nosso catálogo.
 *
 * @param {string} type   - "movie", "series" ou "all"
 * @param {string} search - texto de busca (opcional)
 * @returns {Promise<Array>}
 */
async function fetch(type, search) {
  const safeSearch = (search || "").trim();
  const autoPages = getTmdbAutoPages();
  const limit = getCatalogLimit();
  const cacheKey = `${type || "all"}::${safeSearch.toLowerCase()}::${autoPages}::${limit}`;

  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`✅ TMDB cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`🔄 Buscando TMDB: tipo=${type}, busca="${safeSearch}", cache_key=${cacheKey}`);

  let items = [];

  if (safeSearch) {
    const url = `${TMDB_BASE_URL}/search/multi?language=pt-BR&query=${encodeURIComponent(safeSearch)}&include_adult=false&page=1`;
    const response = await httpGetJson(url);
    items = Array.isArray(response.results) ? response.results : [];
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

    items = movies.concat(series);
  }

  // Mapear, filtrar sem imagem e deduplicar
  const seen = new Set();
  const mappedItems = items
    .filter((i) => i && (i.media_type === "movie" || i.media_type === "tv" || i.title || i.name))
    .map(mapItem);

  const itemsWithImage = mappedItems.filter((i) => i.image);
  
  // DEBUG: Se muitos itens perderam imagem, algo está errado
  if (mappedItems.length > 0 && itemsWithImage.length === 0) {
    console.error(
      `❌ CRÍTICO: Nenhuma imagem foi encontrada! Mapeados: ${mappedItems.length}, Com imagem: ${itemsWithImage.length}`
    );
    console.error(`   Verifique se sua chave TMDB está válida e se o poster_path está sendo retornado.`);
    console.error(`   Primeiros itens mapeados:`, JSON.stringify(mappedItems.slice(0, 2), null, 2));
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

  console.log(`✅ TMDB retornou ${deduped.length} itens válidos com imagem`);
  setCache(cacheKey, deduped);
  return deduped;
}

module.exports = { fetch, attachTrailers, resolvePosterForTitle };
