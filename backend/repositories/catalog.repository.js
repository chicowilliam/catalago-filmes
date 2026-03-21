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
const tempPath = `${dbPath}.tmp`;
let writeQueue = Promise.resolve();

/**
 * Lê todos os itens do catálogo.
 * @returns {Array} lista de filmes/séries
 */
async function findAll() {
  try {
    const raw = await fs.promises.readFile(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    throw new AppError("Erro ao ler banco de dados", 500, "DATABASE_READ_ERROR");
  }
}

/**
 * Grava a lista completa de itens no catálogo.
 * @param {Array} data - lista atualizada de filmes/séries
 */
async function save(data) {
  const payload = JSON.stringify(data, null, 2);

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await fs.promises.writeFile(tempPath, payload, "utf-8");
      await fs.promises.rename(tempPath, dbPath);
    });

  try {
    await writeQueue;
  } catch {
    throw new AppError("Erro ao salvar no banco de dados", 500, "DATABASE_WRITE_ERROR");
  }
}

module.exports = { findAll, save };
