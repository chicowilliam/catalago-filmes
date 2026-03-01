const Joi = require('joi');

/**
 * Schema de validação para LOGIN
 * 
 * O que valida:
 * - username: deve ser string, entre 3-30 caracteres, só letras/números
 * - password: deve ser string, entre 6-50 caracteres
 */
const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()           // Só letras e números
    .min(3)               // Mínimo 3 caracteres
    .max(30)              // Máximo 30 caracteres
    .required()           // Obrigatório
    .messages({
      'string.alphanum': 'Username deve conter apenas letras e números',
      'string.min': 'Username deve ter no mínimo 3 caracteres',
      'string.max': 'Username não pode ter mais de 30 caracteres',
      'any.required': 'Username é obrigatório'
    }),

  password: Joi.string()
    .min(6)               // Mínimo 6 caracteres
    .max(50)              // Máximo 50 caracteres
    .required()           // Obrigatório
    .messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'string.max': 'Senha não pode ter mais de 50 caracteres',
      'any.required': 'Senha é obrigatória'
    })
});

/**
 * Schema de validação para CRIAR FILME
 * 
 * O que valida:
 * - title: string, 2-100 caracteres, obrigatório
 * - image: URL válida, obrigatória
 * - type: deve ser "movie" ou "series"
 * - synopsis: texto, 10-500 caracteres
 * - trailerId: ID do YouTube (opcional)
 */
const createMovieSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Título deve ter no mínimo 2 caracteres',
      'string.max': 'Título não pode ter mais de 100 caracteres',
      'any.required': 'Título é obrigatório'
    }),

  image: Joi.string()
    .uri()                // Deve ser URL válida
    .required()
    .messages({
      'string.uri': 'Imagem deve ser uma URL válida',
      'any.required': 'Imagem é obrigatória'
    }),

  type: Joi.string()
    .valid('movie', 'series')  // Só aceita esses valores
    .required()
    .messages({
      'any.only': 'Tipo deve ser "movie" ou "series"',
      'any.required': 'Tipo é obrigatório'
    }),

  synopsis: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Sinopse deve ter no mínimo 10 caracteres',
      'string.max': 'Sinopse não pode ter mais de 500 caracteres',
      'any.required': 'Sinopse é obrigatória'
    }),

  trailerId: Joi.string()
    .optional()           // Não é obrigatório
    .max(50)
});

// Função para validar login
function validateLogin(data) {
  return loginSchema.validate(data, { abortEarly: false });
}

// Função para validar criação de filme
function validateCreateMovie(data) {
  return createMovieSchema.validate(data, { abortEarly: false });
}

module.exports = {
  validateLogin,
  validateCreateMovie
};