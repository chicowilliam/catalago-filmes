// backend/services/auth.service.js
//
// Contém as regras de negócio de autenticação:
//   - Verificar se as credenciais são válidas
//   - Montar o objeto de usuário da sessão
//
// Quando você migrar para banco de dados, só este arquivo muda:
//   Troca a verificação hardcoded por: SELECT * FROM users WHERE username = ?

const AppError = require("../utils/AppError");

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new AppError(
      "Credenciais de administrador nao configuradas no ambiente",
      500,
      "AUTH_CONFIG_ERROR"
    );
  }

  return { username, password };
}

/**
 * Verifica se as credenciais fornecidas são válidas.
 * Retorna o objeto de usuário se válido, ou lança AppError se inválido.
 *
 * @param {string} username
 * @param {string} password
 * @returns {{ username: string, role: string }}
 */
/**
 * Constant-time comparison para evitar timing attacks.
 */
function constantTimeCompare(a, b) {
  if (!a || !b || typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifyCredentials(username, password) {
  const adminUser = getAdminCredentials();

  // Usa constant-time para evitar timing attacks
  const usernameMatches = constantTimeCompare(username, adminUser.username);
  const passwordMatches = constantTimeCompare(password, adminUser.password);
  
  if (!usernameMatches || !passwordMatches) {
    throw new AppError("Usuário ou senha incorretos", 401, "INVALID_CREDENTIALS");
  }

  // Retorna o objeto que será gravado na sessão
  return { username, role: "admin" };
}

module.exports = { verifyCredentials };
