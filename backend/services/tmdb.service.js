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
  return {
    id: `tmdb-${tmdbItem.id}`,
    title: tmdbItem.title || tmdbItem.name || "Título indisponível",
    type: isMovie ? "movie" : "series",
    image: tmdbItem.poster_path ? `${TMDB_IMAGE_BASE}${tmdbItem.poster_path}` : "",
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
  if (cached) return cached;

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
  let mapped = items
    .filter((i) => i && (i.media_type === "movie" || i.media_type === "tv" || i.title || i.name))
    .map(mapItem)
    .filter((i) => i.image)
    .filter((i) => {
      const key = `${i.type}-${i.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Filtrar por tipo se solicitado
  if (type && type !== "all") {
    const normalizedType = type === "series" ? "series" : "movie";
    mapped = mapped.filter((i) => i.type === normalizedType);
  }

  setCache(cacheKey, mapped);
  return mapped;
}

module.exports = { fetch };
