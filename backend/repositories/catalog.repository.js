// backend/repositories/catalog.repository.js
//
// Única camada responsável por ler e gravar dados do catálogo.
//
// Por que isso é importante?
// Quando você migrar de JSON para SQL, só este arquivo precisa mudar.
// O service e o controller continuam exatamente iguais.
//
// Equivalente SQL futuro:
//   findAll()      → SELECT * FROM catalog
//   save(data)     → INSERT / UPDATE (via Knex ou Prisma)

const fs = require("fs");
const path = require("path");
const AppError = require("../utils/AppError");

const dbPath = path.join(__dirname, "../data/catalog.json");

/**
 * Lê todos os itens do catálogo.
 * @returns {Array} lista de filmes/séries
 */
function findAll() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  } catch {
    throw new AppError("Erro ao ler banco de dados", 500, "DATABASE_READ_ERROR");
  }
}

/**
 * Grava a lista completa de itens no catálogo.
 * @param {Array} data - lista atualizada de filmes/séries
 */
function save(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch {
    throw new AppError("Erro ao salvar no banco de dados", 500, "DATABASE_WRITE_ERROR");
  }
}

module.exports = { findAll, save };
