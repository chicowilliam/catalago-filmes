// backend/config/catalog.config.js
//
// Centraliza a leitura de variáveis de ambiente relacionadas ao catálogo.
// Sempre que precisar de um valor do .env neste contexto, leia daqui.

const DEFAULT_CATALOG_LIMIT = 20;
const DEFAULT_TMDB_TIMEOUT_MS = 8000;
const DEFAULT_TMDB_AUTO_PAGES = 1;

/**
 * Retorna o limite máximo de itens do catálogo (entre 1 e 40).
 * Configurável via .env: CATALOG_LIMIT=30
 */
function getCatalogLimit() {
  const parsed = Number(process.env.CATALOG_LIMIT || DEFAULT_CATALOG_LIMIT);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_CATALOG_LIMIT;
  return Math.min(parsed, 40);
}

/**
 * Retorna o timeout em ms para requisições à TMDB (entre 1000ms e 15000ms).
 * Configurável via .env: TMDB_TIMEOUT_MS=5000
 */
function getTmdbTimeoutMs() {
  const parsed = Number(process.env.TMDB_TIMEOUT_MS || DEFAULT_TMDB_TIMEOUT_MS);
  if (!Number.isInteger(parsed) || parsed < 1000) return DEFAULT_TMDB_TIMEOUT_MS;
  return Math.min(parsed, 15000);
}

/**
 * Retorna quantas páginas da TMDB buscar automaticamente (entre 1 e 5).
 * Configurável via .env: TMDB_AUTO_PAGES=2
 */
function getTmdbAutoPages() {
  const parsed = Number(process.env.TMDB_AUTO_PAGES || DEFAULT_TMDB_AUTO_PAGES);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_TMDB_AUTO_PAGES;
  return Math.min(parsed, 5);
}

/**
 * Retorna true se a TMDB estiver habilitada no .env.
 * Requer: CATALOG_SOURCE=tmdb e TMDB_BEARER_TOKEN ou TMDB_API_KEY definidos.
 */
function isTmdbEnabled() {
  return (
    process.env.CATALOG_SOURCE === "tmdb" &&
    !!(process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_KEY)
  );
}

module.exports = {
  getCatalogLimit,
  getTmdbTimeoutMs,
  getTmdbAutoPages,
  isTmdbEnabled,
};
