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

  const data = await tmdbService.fetch(type, search);
  const limited = limitAndBalance(data, type, search);
  const withTrailers = await tmdbService.attachTrailers(limited, 12);
  return { source: "tmdb", data: withTrailers };
}

function unsupportedLocalMutation() {
  throw new AppError(
    "Operacao desativada: o catalogo agora e somente leitura via API externa (TMDB).",
    501,
    "CATALOG_READ_ONLY"
  );
}

async function createItem() {
  unsupportedLocalMutation();
}

async function updateItem() {
  unsupportedLocalMutation();
}

async function deleteItem() {
  unsupportedLocalMutation();
}

module.exports = { listCatalog, createItem, updateItem, deleteItem };
