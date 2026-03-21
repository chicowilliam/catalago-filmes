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
const { validateCatalogItem } = require("../validators/catalog.validator");
const AppError = require("../utils/AppError");

/**
 * Valida o body da requisição contra o schema de item do catálogo.
 * Lança AppError 400 se inválido, retorna o valor limpo se válido.
 * Centraliza a validação para evitar duplicação entre create e update.
 */
function parseAndValidateBody(body) {
  const { error, value } = validateCatalogItem(body);
  if (error) {
    throw new AppError(
      error.details.map((d) => d.message).join("; "),
      400,
      "VALIDATION_ERROR"
    );
  }
  return value;
}

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
    const validatedData = parseAndValidateBody(req.body);
    const item = await catalogService.createItem(validatedData);
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
    const validatedData = parseAndValidateBody(req.body);
    const item = await catalogService.updateItem(req.params.id, validatedData);
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
    await catalogService.deleteItem(req.params.id);
    res.json({ status: "success", message: "Item removido com sucesso" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
