// backend/validators/catalog.validator.js
//
// Validações de entrada para as rotas do catálogo.
// Separado do auth.validator para manter cada arquivo com uma única responsabilidade.

const Joi = require("joi");

/**
 * Schema de validação para criar ou atualizar um item do catálogo.
 *
 * Campos:
 * - title:     string, 2–100 caracteres, obrigatório
 * - image:     URL válida, obrigatória
 * - type:      "movie" ou "series", obrigatório
 * - synopsis:  texto, 10–500 caracteres, obrigatório
 * - trailerId: ID do YouTube, opcional, máx. 50 caracteres
 */
const catalogItemSchema = Joi.object({
  title: Joi.string().min(2).max(100).required().messages({
    "string.min": "Título deve ter no mínimo 2 caracteres",
    "string.max": "Título não pode ter mais de 100 caracteres",
    "any.required": "Título é obrigatório",
  }),

  image: Joi.string().uri().required().messages({
    "string.uri": "Imagem deve ser uma URL válida",
    "any.required": "Imagem é obrigatória",
  }),

  type: Joi.string().valid("movie", "series").required().messages({
    "any.only": 'Tipo deve ser "movie" ou "series"',
    "any.required": "Tipo é obrigatório",
  }),

  synopsis: Joi.string().min(10).max(500).required().messages({
    "string.min": "Sinopse deve ter no mínimo 10 caracteres",
    "string.max": "Sinopse não pode ter mais de 500 caracteres",
    "any.required": "Sinopse é obrigatória",
  }),

  trailerId: Joi.string().optional().max(50),
});

/**
 * Valida os dados de um item do catálogo.
 * Retorna { error, value } no padrão Joi.
 * abortEarly: false garante que todos os erros são retornados de uma vez.
 */
function validateCatalogItem(data) {
  return catalogItemSchema.validate(data, { abortEarly: false });
}

module.exports = { validateCatalogItem };
