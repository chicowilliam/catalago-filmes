/**
 * TESTES DE INTEGRAÇÃO PARA ROTAS DE CATÁLOGO
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const catalogRoutes = require('../routes/catalog.routes');
const authRoutes = require('../routes/auth.routes');

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

  // TESTE 4: Criar filme sem autenticação (deve falhar)
  test('POST /api/catalog - deve rejeitar sem autenticação', async () => {
    const response = await request(app)
      .post('/api/catalog')
      .send({
        title: 'Novo Filme',
        type: 'movie',
        image: 'https://example.com/movie.jpg',
        synopsis: 'Uma sinopse com mais de 10 caracteres'
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  // TESTE 5: Criar filme com dados inválidos
  test('POST /api/catalog - deve rejeitar dados inválidos', async () => {
    const response = await request(app)
      .post('/api/catalog')
      .send({
        title: 'A', // Muito curto
        type: 'invalid',
        image: 'nao_e_url'
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});