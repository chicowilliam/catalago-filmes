// backend/services/auth.service.js
//
// Contém as regras de negócio de autenticação:
//   - Verificar se as credenciais são válidas
//   - Montar o objeto de usuário da sessão
//
// Quando você migrar para banco de dados, só este arquivo muda:
//   Troca a verificação hardcoded por: SELECT * FROM users WHERE username = ?

const crypto = require("crypto");
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
 * Comparação em tempo constante usando crypto nativo do Node.js.
 * Evita timing attacks ao comparar credenciais.
 */
function timingSafeStringEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual lança erro se os buffers tiverem tamanhos diferentes
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyCredentials(username, password) {
  const adminUser = getAdminCredentials();

  const usernameMatches = timingSafeStringEqual(username, adminUser.username);
  const passwordMatches = timingSafeStringEqual(password, adminUser.password);
  
  if (!usernameMatches || !passwordMatches) {
    throw new AppError("Usuário ou senha incorretos", 401, "INVALID_CREDENTIALS");
  }

  // Retorna o objeto que será gravado na sessão
  return { username, role: "admin" };
}

module.exports = { verifyCredentials };
