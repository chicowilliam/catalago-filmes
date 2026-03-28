/**
 * CLASSE DE ERRO CUSTOMIZADO
 * 
 * Nos permite criar erros estruturados
 * que o middleware de erro pode entender
 */

class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
  }
}

module.exports = AppError;