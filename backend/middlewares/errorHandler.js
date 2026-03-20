// backend/middlewares/errorHandler.js
//
// Middleware de 4 parâmetros — Express o reconhece como handler de erro.
// Processa TODOS os erros da aplicação de forma centralizada.
// Deve ser o ÚLTIMO middleware registrado no server.js.

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";
  // Reutiliza o timestamp já criado no AppError; cria um novo só se não existir
  const timestamp = err.timestamp || new Date().toISOString();

  // Log estruturado para debug — visível apenas no servidor, nunca no cliente
  console.error(`[${timestamp}] ${code} (${status}): ${message}`);

  res.status(status).json({
    status: "error",
    code,
    message,
    timestamp,
  });
}

module.exports = errorHandler;