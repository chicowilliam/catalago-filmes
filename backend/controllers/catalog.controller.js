// backend/controllers/catalog.controller.js
//
// O controller é o "porteiro" da API:
//   1. Extrai dados do req (query params, body, params de URL)
//   2. Chama o service correspondente
//   3. Devolve o res.json com o resultado
//
// Ele NÃO tem lógica de negócio (isso fica no service).
// Ele NÃO acessa o banco diretamente (isso fica no repository).

const catalogService = require("../services/catalog.service");
const AppError = require("../utils/AppError");

/**
 * GET /api/catalog
 * Lista o catálogo com filtros opcionais de tipo e busca.
 */
async function list(req, res, next) {
  try {
    const { type, search } = req.query;
    if (type && !["movie", "series", "all"].includes(type)) {
      throw new AppError('Tipo inválido. Use "movie", "series" ou "all"', 400, "INVALID_TYPE");
    }
    const result = await catalogService.listCatalog(type, search);

    res.json({
      status: "success",
      source: result.source,
      ...(result.warning && { warning: result.warning }),
      data: result.data,
      count: result.data.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/catalog
 * Cria um novo item. Rota protegida por isAdmin.
 */
module.exports = { list };
