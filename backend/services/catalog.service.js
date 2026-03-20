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
      return { source: "tmdb", data: limited };
    } catch (err) {
      // TMDB falhou → usa fallback local e avisa o chamador
      const fallback = _filterLocal(type, search);
      return { source: "local-fallback", warning: err.message, data: fallback };
    }
  }

  const data = _filterLocal(type, search);
  return { source: "local", data };
}

/**
 * Filtra e limita os dados do JSON local.
 * Função interna (prefixo _), não é exportada.
 */
function _filterLocal(type, search) {
  let items = catalogRepo.findAll();

  if (type && type !== "all") {
    items = items.filter((i) => i.type === (type === "series" ? "series" : "movie"));
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(q));
  }

  return limitAndBalance(items, type, search);
}

/**
 * Cria um novo item no catálogo local.
 * @param {Object} payload - dados validados pelo Joi
 * @returns {Object} item criado
 */
function createItem(payload) {
  const items = catalogRepo.findAll();
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

  catalogRepo.save([...items, newItem]);
  return newItem;
}

/**
 * Atualiza um item existente pelo id.
 * @param {string|number} id
 * @param {Object} payload - dados validados pelo Joi
 * @returns {Object} item atualizado
 */
function updateItem(id, payload) {
  const items = catalogRepo.findAll();
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

  catalogRepo.save(items);
  return items[index];
}

/**
 * Remove um item pelo id.
 * @param {string|number} id
 */
function deleteItem(id) {
  const items = catalogRepo.findAll();
  const filtered = items.filter((i) => String(i.id) !== String(id));

  if (filtered.length === items.length) {
    throw new AppError("Item não encontrado", 404, "ITEM_NOT_FOUND");
  }

  catalogRepo.save(filtered);
}

module.exports = { listCatalog, createItem, updateItem, deleteItem };
