/**
 * MIDDLEWARE DE TRATAMENTO DE ERRO
 * 
 * Este arquivo trata TODOS os erros do servidor
 * de forma centralizada e profissional
 */

// Fun��ão que processa todos os erros
function errorHandler(err, req, res, next) {
  // Pegar informações do erro
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";

  // Logar o erro no console (para debug)
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERRO CAPTURADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${status}
Mensagem: ${message}
Código: ${code}
Data: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Enviar resposta estruturada
  res.status(status).json({
    status: "error",
    code: code,
    message: message,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;