// backend/services/auth.service.js
//
// Contém as regras de negócio de autenticação:
//   - Verificar se as credenciais são válidas
//   - Montar o objeto de usuário da sessão
//
// SEGURANÇA:
//   ADMIN_PASSWORD pode ser texto puro (dev) ou um hash bcrypt (recomendado para produção).
//   Para gerar um hash bcrypt:
//     node -e "require('bcryptjs').hash('sua-senha',12).then(h => console.log(h))"
//   Depois cole o hash gerado no ADMIN_PASSWORD do seu .env.

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
 * Evita timing attacks ao comparar strings.
 */
function timingSafeStringEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual lança erro se os buffers tiverem tamanhos diferentes
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Detecta se o valor armazenado é um hash bcrypt ($2b$ ou $2a$) */
function isBcryptHash(value) {
  return /^\$2[ab]\$\d{2}\$/.test(value);
}

/**
 * Compara a senha informada com a armazenada.
 * - Se for hash bcrypt: usa bcrypt.compareSync (mais seguro para produção)
 * - Se for texto puro: usa timingSafeEqual (compatível com .env simples)
 */
function comparePassword(input, stored) {
  if (isBcryptHash(stored)) {
    let bcrypt;
    try {
      bcrypt = require("bcryptjs");
    } catch {
      throw new AppError(
        "ADMIN_PASSWORD está em formato bcrypt mas o pacote bcryptjs não está instalado. Execute: npm install bcryptjs",
        500,
        "AUTH_CONFIG_ERROR"
      );
    }
    return bcrypt.compareSync(input, stored);
  }
  return timingSafeStringEqual(input, stored);
}

function verifyCredentials(username, password) {
  const adminUser = getAdminCredentials();

  const usernameMatches = timingSafeStringEqual(username, adminUser.username);
  const passwordMatches = comparePassword(password, adminUser.password);

  if (!usernameMatches || !passwordMatches) {
    throw new AppError("Usuário ou senha incorretos", 401, "INVALID_CREDENTIALS");
  }

  // Retorna o objeto que será gravado na sessão
  return { username, role: "admin" };
}

module.exports = { verifyCredentials };
