// backend/services/catalog.service.js
//
// Contém as regras de negócio do catálogo:
//   - Decidir se usa TMDB ou JSON local
//   - Filtrar, buscar e limitar resultados
//   - Criar, editar e remover itens
//
// Este arquivo NÃO conhece req/res (isso é responsabilidade do controller).
// Este arquivo NÃO acessa o disco diretamente (isso é responsabilidade do repository).

const catalogRepo = require("../repositories/catalog.repository");
const tmdbService = require("./tmdb.service");
const { getCatalogLimit, isTmdbEnabled } = require("../config/catalog.config");
const AppError = require("../utils/AppError");

const LOCAL_ENRICHED_CACHE_TTL_MS = 15 * 60 * 1000;
let localEnrichedCatalogCache = {
  signature: "",
  items: null,
  expiresAt: 0,
};

// --- Helpers internos ---

/**
 * Balanceia a lista retornando no máximo `limit` itens,
 * dividindo igualmente entre filmes e séries quando não há filtro.
 */
function limitAndBalance(items, type, search) {
  const limit = getCatalogLimit();
  if (!Array.isArray(items) || items.length <= limit) return items;

  // Com filtro ou busca: retorna os primeiros N sem balancear
  if (search || (type && type !== "all")) return items.slice(0, limit);

  // Sem filtro: balanceia metade filmes, metade séries
  const movieTarget = Math.ceil(limit / 2);
  const seriesTarget = Math.floor(limit / 2);
  const movies = items.filter((i) => i.type === "movie");
  const series = items.filter((i) => i.type === "series");

  let result = movies.slice(0, movieTarget).concat(series.slice(0, seriesTarget));

  // Completa com o que sobrou se ainda estiver abaixo do limite
  if (result.length < limit) {
    result = result
      .concat(movies.slice(movieTarget))
      .concat(series.slice(seriesTarget))
      .slice(0, limit);
  }

  return result;
}

async function enrichLocalCatalogImages(items) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const currentImage = String(item.image || "");
      if (/^https?:\/\//i.test(currentImage)) {
        return item;
      }

      const fallbackPoster = await tmdbService.resolvePosterForTitle(item.title, item.type);
      if (!fallbackPoster) {
        return item;
      }

      return {
        ...item,
        image: fallbackPoster,
      };
    })
  );

  return enrichedItems;
}

function buildLocalCatalogSignature(items) {
  if (!Array.isArray(items) || items.length === 0) return "empty";
  return items
    .map((item) => `${item.id}|${item.type}|${item.title}|${item.image || ""}`)
    .join("||");
}

function invalidateLocalEnrichedCache() {
  localEnrichedCatalogCache = {
    signature: "",
    items: null,
    expiresAt: 0,
  };
}

async function getEnrichedLocalCatalogItems() {
  const baseItems = await catalogRepo.findAll();
  const signature = buildLocalCatalogSignature(baseItems);
  const now = Date.now();

  if (
    localEnrichedCatalogCache.items &&
    localEnrichedCatalogCache.signature === signature &&
    localEnrichedCatalogCache.expiresAt > now
  ) {
    return localEnrichedCatalogCache.items;
  }

  const enrichedItems = await enrichLocalCatalogImages(baseItems);
  localEnrichedCatalogCache = {
    signature,
    items: enrichedItems,
    expiresAt: now + LOCAL_ENRICHED_CACHE_TTL_MS,
  };

  return enrichedItems;
}

function filterLocalCatalogItems(items, type, search) {
  let filtered = items;

  if (type && type !== "all") {
    filtered = filtered.filter((i) => i.type === (type === "series" ? "series" : "movie"));
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((i) => i.title.toLowerCase().includes(q));
  }

  return filtered;
}

// --- Operações exportadas ---

/**
 * Lista o catálogo aplicando filtros de tipo e busca textual.
 * Tenta TMDB primeiro; se TMDB falhar, usa o JSON local como fallback.
 *
 * @param {string} type   - "movie", "series" ou "all"
 * @param {string} search - texto de busca (opcional)
 * @returns {{ source: string, data: Array }}
 */
async function listCatalog(type, search) {
  if (isTmdbEnabled()) {
    try {
      const data = await tmdbService.fetch(type, search);
      const limited = limitAndBalance(data, type, search);
      const withTrailers = await tmdbService.attachTrailers(limited, 12);
      return { source: "tmdb", data: withTrailers };
    } catch (err) {
      // TMDB falhou → usa fallback local e avisa o chamador
      const fallback = await fetchFromLocalStorage(type, search);
      return {
        source: "local-fallback",
        warning: "Fonte externa indisponivel no momento. Exibindo catalogo local.",
        data: fallback,
      };
    }
  }

  const data = await fetchFromLocalStorage(type, search);
  return { source: "local", data };
}

/**
 * Filtra e limita os dados do JSON local por tipo e busca textual.
 * Função interna — não é exportada, usada apenas dentro deste service.
 */
async function fetchFromLocalStorage(type, search) {
  const enrichedItems = await getEnrichedLocalCatalogItems();
  return filterLocalCatalogItems(enrichedItems, type, search);
}

/**
 * Cria um novo item no catálogo local.
 * @param {Object} payload - dados validados pelo Joi
 * @returns {Object} item criado
 */
async function createItem(payload) {
  const items = await catalogRepo.findAll();
  const maxId = items.length ? Math.max(...items.map((i) => Number(i.id) || 0)) : 0;

  const newItem = {
    id: maxId + 1,
    title: payload.title,
    type: payload.type,
    image: payload.image,
    synopsis: payload.synopsis,
    trailerId: payload.trailerId || "",
    createdAt: new Date().toISOString(),
  };

  await catalogRepo.save([...items, newItem]);
  invalidateLocalEnrichedCache();
  return newItem;
}

/**
 * Atualiza um item existente pelo id.
 * @param {string|number} id
 * @param {Object} payload - dados validados pelo Joi
 * @returns {Object} item atualizado
 */
async function updateItem(id, payload) {
  const items = await catalogRepo.findAll();
  const index = items.findIndex((i) => String(i.id) === String(id));

  if (index === -1) {
    throw new AppError("Item não encontrado", 404, "ITEM_NOT_FOUND");
  }

  items[index] = {
    ...items[index],
    title: payload.title,
    type: payload.type,
    image: payload.image,
    synopsis: payload.synopsis,
    trailerId: payload.trailerId || "",
    updatedAt: new Date().toISOString(),
  };

  await catalogRepo.save(items);
  invalidateLocalEnrichedCache();
  return items[index];
}

/**
 * Remove um item pelo id.
 * @param {string|number} id
 */
async function deleteItem(id) {
  const items = await catalogRepo.findAll();
  const filtered = items.filter((i) => String(i.id) !== String(id));

  if (filtered.length === items.length) {
    throw new AppError("Item não encontrado", 404, "ITEM_NOT_FOUND");
  }

  await catalogRepo.save(filtered);
  invalidateLocalEnrichedCache();
}

module.exports = { listCatalog, createItem, updateItem, deleteItem };
