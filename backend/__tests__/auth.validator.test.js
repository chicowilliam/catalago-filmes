/**
 * TESTES PARA VALIDAÇÃO DE LOGIN E ITEM DO CATÁLOGO
 */

const { validateLogin } = require('../validators/auth.validator');
const { validateCatalogItem } = require('../validators/catalog.validator');

describe('Auth Validator', () => {
  
  // ========== TESTES DE LOGIN ==========
  
  describe('validateLogin', () => {
    
    // TESTE 1: Login válido deve passar
    test('deve aceitar dados de login válidos', () => {
      const validData = {
        username: 'admin',
        password: 'minha_senha_super_segura_123'
      };

      const { error, value } = validateLogin(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    // TESTE 2: Username muito curto
    test('deve rejeitar username com menos de 3 caracteres', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123'
      };

      const { error } = validateLogin(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('3 caracteres');
    });

    // TESTE 3: Username com caracteres inválidos
    test('deve rejeitar username com caracteres especiais', () => {
      const invalidData = {
        username: 'admin@#$',
        password: 'password123'
      };

      const { error } = validateLogin(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 4: Password muito curta
    test('deve rejeitar password com menos de 6 caracteres', () => {
      const invalidData = {
        username: 'admin',
        password: '123'
      };

      const { error } = validateLogin(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('6 caracteres');
    });

    // TESTE 5: Faltando username
    test('deve rejeitar quando username está faltando', () => {
      const invalidData = {
        password: 'password123'
      };

      const { error } = validateLogin(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 6: Faltando password
    test('deve rejeitar quando password está faltando', () => {
      const invalidData = {
        username: 'admin'
      };

      const { error } = validateLogin(invalidData);

      expect(error).toBeDefined();
    });
  });

  // ========== TESTES DE CRIAÇÃO DE FILME ==========

  describe('validateCatalogItem', () => {
    
    // TESTE 7: Filme válido deve passar
    test('deve aceitar dados de filme válidos', () => {
      const validData = {
        title: 'Batman: O Cavaleiro das Trevas',
        type: 'movie',
        image: 'https://example.com/batman.jpg',
        synopsis: 'Um herói em luta contra o crime em Gotham City',
        trailerId: 'dQw4w9WgXcQ'
      };

      const { error, value } = validateCatalogItem(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    // TESTE 8: Tipo de conteúdo inválido
    test('deve rejeitar tipo de conteúdo inválido', () => {
      const invalidData = {
        title: 'Breaking Bad',
        type: 'cartoon', // ❌ Deve ser 'movie' ou 'series'
        image: 'https://example.com/bb.jpg',
        synopsis: 'Uma série sobre um professor de química'
      };

      const { error } = validateCatalogItem(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 9: URL de imagem inválida
    test('deve rejeitar URL de imagem inválida', () => {
      const invalidData = {
        title: 'Breaking Bad',
        type: 'series',
        image: 'nao_e_uma_url', // ❌ Não é URL
        synopsis: 'Uma série sobre um professor de química'
      };

      const { error } = validateCatalogItem(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 10: Título muito curto
    test('deve rejeitar título com menos de 2 caracteres', () => {
      const invalidData = {
        title: 'A', // ❌ Muito curto
        type: 'movie',
        image: 'https://example.com/movie.jpg',
        synopsis: 'Descrição com mais de 10 caracteres'
      };

      const { error } = validateCatalogItem(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 11: Sinopse muito curta
    test('deve rejeitar sinopse com menos de 10 caracteres', () => {
      const invalidData = {
        title: 'Movie Title',
        type: 'movie',
        image: 'https://example.com/movie.jpg',
        synopsis: 'Curta' // ❌ Muito curta
      };

      const { error } = validateCatalogItem(invalidData);

      expect(error).toBeDefined();
    });

    // TESTE 12: Filme sem campos obrigatórios
    test('deve rejeitar quando faltam campos obrigatórios', () => {
      const invalidData = {
        title: 'Movie Title'
        // Faltam: type, image, synopsis
      };

      const { error } = validateCatalogItem(invalidData);

      expect(error).toBeDefined();
    });
  });
});
