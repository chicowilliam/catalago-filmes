// backend/middlewares/errorHandler.js
//
// Middleware de 4 parâmetros — Express o reconhece como handler de erro.
// Processa TODOS os erros da aplicação de forma centralizada.
// Deve ser o ÚLTIMO middleware registrado no server.js.

const logger = require("../utils/logger");
const isProduction = process.env.NODE_ENV === "production";

function errorHandler(err, req, res, next) {
  const requestId = req.id || "unknown";
  const status = err.status || 500;
  const timestamp = err.timestamp || new Date().toISOString();

  // Erros não planejados (bugs): em produção, esconder detalhes do cliente
  const isOperational = err.isOperational === true;
  const message = isOperational
    ? err.message
    : isProduction
      ? "Ocorreu um erro interno. Tente novamente mais tarde."
      : err.message || "Internal Server Error";
  const code = isOperational
    ? err.code || "INTERNAL_ERROR"
    : "INTERNAL_ERROR";

  // Log sempre no servidor — em produção inclui stack para debugging
  if (!isOperational) {
    logger.error("unexpected_error", {
      requestId,
      status,
      stack: err.stack || err.message,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.error("operational_error", {
      requestId,
      status,
      code,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(status).json({
    status: "error",
    code,
    message,
    timestamp,
    requestId,
  });
}

module.exports = errorHandler;