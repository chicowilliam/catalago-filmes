/**
 * TESTES DE INTEGRAÇÃO PARA ROTAS DE AUTENTICAÇÃO
 * 
 * Testa as rotas inteiras, não só validação
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const authRoutes = require('../routes/auth.routes');
const errorHandler = require('../middlewares/errorHandler');

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';

// Criar app de teste
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {

  // TESTE 1: Login com credenciais corretas
  test('POST /api/auth/login - deve fazer login com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123' // Usar a senha padrão do .env
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.user).toBeDefined();
    expect(response.body.user.role).toBe('admin');
  });

  // TESTE 2: Login com credenciais erradas
  test('POST /api/auth/login - deve rejeitar credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'senha_errada'
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  // TESTE 3: Login com dados inválidos
  test('POST /api/auth/login - deve rejeitar dados inválidos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'ab', // Muito curto
        password: '123'  // Muito curto
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  // TESTE 4: Ver quem está logado sem autenticação
  test('GET /api/auth/me - deve rejeitar sem autenticação', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  // TESTE 5: Ver quem está logado com sessão ativa
  test('GET /api/auth/me - deve retornar dados do usuário autenticado', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'admin', password: 'admin123' });

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.user.role).toBe('admin');
    expect(response.body.user.username).toBe('admin');
  });

  // TESTE 6: Logout com sessão ativa destrói a sessão
  test('POST /api/auth/logout - deve encerrar sessão e bloquear /me', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'admin', password: 'admin123' });

    // Confirmar que está logado
    const meBeforeLogout = await agent.get('/api/auth/me');
    expect(meBeforeLogout.status).toBe(200);

    // Fazer logout
    const logoutResponse = await agent.post('/api/auth/logout');
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.status).toBe('success');

    // Confirmar que sessão foi destruída
    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });
});