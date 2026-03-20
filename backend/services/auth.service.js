// backend/services/auth.service.js
//
// Contém as regras de negócio de autenticação:
//   - Verificar se as credenciais são válidas
//   - Montar o objeto de usuário da sessão
//
// Quando você migrar para banco de dados, só este arquivo muda:
//   Troca a verificação hardcoded por: SELECT * FROM users WHERE username = ?

const AppError = require("../utils/AppError");

// Credenciais lidas do .env (com fallback para desenvolvimento)
const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123",
};

/**
 * Verifica se as credenciais fornecidas são válidas.
 * Retorna o objeto de usuário se válido, ou lança AppError se inválido.
 *
 * @param {string} username
 * @param {string} password
 * @returns {{ username: string, role: string }}
 */
function verifyCredentials(username, password) {
  if (username !== ADMIN_USER.username || password !== ADMIN_USER.password) {
    throw new AppError("Usuário ou senha incorretos", 401, "INVALID_CREDENTIALS");
  }

  // Retorna o objeto que será gravado na sessão
  return { username, role: "admin" };
}

module.exports = { verifyCredentials };
