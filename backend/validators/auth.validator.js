// backend/validators/auth.validator.js
//
// Validações de entrada para as rotas de autenticação.
// Validações do catálogo ficam em catalog.validator.js.

const Joi = require("joi");

/**
 * Schema de validação para LOGIN.
 * - username: alfanumérico, 3–30 caracteres, obrigatório
 * - password: 6–50 caracteres, obrigatório
 */
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Username deve conter apenas letras e números",
    "string.min": "Username deve ter no mínimo 3 caracteres",
    "string.max": "Username não pode ter mais de 30 caracteres",
    "any.required": "Username é obrigatório",
  }),

  password: Joi.string().min(6).max(50).required().messages({
    "string.min": "Senha deve ter no mínimo 6 caracteres",
    "string.max": "Senha não pode ter mais de 50 caracteres",
    "any.required": "Senha é obrigatória",
  }),
});

/**
 * Valida os dados de login.
 * Retorna { error, value } no padrão Joi.
 */
function validateLogin(data) {
  return loginSchema.validate(data, { abortEarly: false });
}

module.exports = { validateLogin };