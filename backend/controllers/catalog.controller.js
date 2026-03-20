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
const { validateCreateMovie } = require("../validators/auth.validator");
const AppError = require("../utils/AppError");

/**
 * GET /api/catalog
 * Lista o catálogo com filtros opcionais de tipo e busca.
 */
async function list(req, res, next) {
  try {
    const { type, search } = req.query;
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
async function create(req, res, next) {
  try {
    const { error, value } = validateCreateMovie(req.body);
    if (error) {
      throw new AppError(
        error.details.map((d) => d.message).join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const item = catalogService.createItem(value);
    res.status(201).json({ status: "success", message: "Item criado com sucesso", item });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/catalog/:id
 * Atualiza um item existente. Rota protegida por isAdmin.
 */
async function update(req, res, next) {
  try {
    const { error, value } = validateCreateMovie(req.body);
    if (error) {
      throw new AppError(
        error.details.map((d) => d.message).join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const item = catalogService.updateItem(req.params.id, value);
    res.json({ status: "success", message: "Item atualizado com sucesso", item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/catalog/:id
 * Remove um item. Rota protegida por isAdmin.
 */
async function remove(req, res, next) {
  try {
    catalogService.deleteItem(req.params.id);
    res.json({ status: "success", message: "Item removido com sucesso" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
