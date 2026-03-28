/**
 * TESTES DE INTEGRAÇÃO PARA ROTAS DE CATÁLOGO
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock do tmdb.service para desacoplar os testes da API real
jest.mock('../services/tmdb.service', () => ({
  fetchFromTmdb: jest.fn().mockResolvedValue({
    items: [
      { id: 'tmdb-1', title: 'Filme Teste', type: 'movie',  image: 'https://image.tmdb.org/t/p/w500/test.jpg', synopsis: 'Sinopse do filme de teste.', trailerId: '' },
      { id: 'tmdb-2', title: 'Série Teste', type: 'series', image: 'https://image.tmdb.org/t/p/w500/test2.jpg', synopsis: 'Sinopse da série de teste.', trailerId: '' },
    ],
    stale: false,
  }),
  attachTrailers: jest.fn().mockImplementation((items) => Promise.resolve(items)),
}));

const catalogRoutes = require('../routes/catalog.routes');
const authRoutes = require('../routes/auth.routes');
const errorHandler = require('../middlewares/errorHandler');

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
// TMDB_BEARER_TOKEN precisa existir para isTmdbEnabled() retornar true
process.env.TMDB_BEARER_TOKEN = 'test-token-mock';

// Criar app de teste
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use(errorHandler);

describe('Catalog Routes', () => {

  // TESTE 1: Listar catálogo (público)
  test('GET /api/catalog - deve listar filmes', async () => {
    const response = await request(app)
      .get('/api/catalog');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // TESTE 2: Filtrar por tipo
  test('GET /api/catalog?type=movie - deve filtrar por tipo', async () => {
    const response = await request(app)
      .get('/api/catalog?type=movie');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // TESTE 3: Buscar por título
  test('GET /api/catalog?search=Batman - deve buscar por título', async () => {
    const response = await request(app)
      .get('/api/catalog?search=Batman');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  // TESTE 4: TMDB não configurada deve retornar 503
  test('GET /api/catalog - deve retornar 503 quando TMDB não está configurada', async () => {
    const savedToken = process.env.TMDB_BEARER_TOKEN;
    delete process.env.TMDB_BEARER_TOKEN;
    delete process.env.TMDB_API_KEY;

    const response = await request(app).get('/api/catalog');

    process.env.TMDB_BEARER_TOKEN = savedToken;

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('TMDB_NOT_CONFIGURED');
  });

  // TESTE 5: Tipo inválido deve retornar 400
  test('GET /api/catalog?type=invalido - deve retornar 400', async () => {
    const response = await request(app)
      .get('/api/catalog?type=invalido');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_TYPE');
  });
});