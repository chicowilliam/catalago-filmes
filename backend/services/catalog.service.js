const tmdbService = require("./tmdb.service");
const { getCatalogLimit, isTmdbEnabled } = require("../config/catalog.config");
const AppError = require("../utils/AppError");

function limitAndBalance(items, type, search) {
  const limit = getCatalogLimit();
  if (!Array.isArray(items) || items.length <= limit) return items;

  if (search || (type && type !== "all")) return items.slice(0, limit);

  const movieTarget = Math.ceil(limit / 2);
  const seriesTarget = Math.floor(limit / 2);
  const movies = items.filter((i) => i.type === "movie");
  const series = items.filter((i) => i.type === "series");

  let result = movies.slice(0, movieTarget).concat(series.slice(0, seriesTarget));

  if (result.length < limit) {
    result = result
      .concat(movies.slice(movieTarget))
      .concat(series.slice(seriesTarget))
      .slice(0, limit);
  }

  return result;
}

async function listCatalog(type, search) {
  if (!isTmdbEnabled()) {
    throw new AppError(
      "Catalogo local foi removido. Configure TMDB_BEARER_TOKEN ou TMDB_API_KEY no ambiente.",
      503,
      "TMDB_NOT_CONFIGURED"
    );
  }

  const { items, stale } = await tmdbService.fetchFromTmdb(type, search);

  if (!search && items.length === 0) {
    throw new AppError(
      "TMDB retornou catalogo vazio. Verifique se sua chave de API esta valida e tem acesso ao endpoint de trending.",
      502,
      "TMDB_EMPTY_CATALOG"
    );
  }

  const limited = limitAndBalance(items, type, search);
  const withTrailers = await tmdbService.attachTrailers(limited, 12);
  return {
    source: stale ? "tmdb-stale" : "tmdb",
    data: withTrailers,
    ...(stale && { warning: "Catalogo temporariamente em cache. TMDB pode estar indisponivel." }),
  };
}

module.exports = { listCatalog };
