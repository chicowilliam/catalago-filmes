/**
 * TESTES PARA APPERROR
 * 
 * Aqui testamos se a classe de erro funciona corretamente
 */

const AppError = require('../utils/AppError');

describe('AppError', () => {
  
  // TESTE 1: Criar erro com todos os parâmetros
  test('deve criar um erro com mensagem, status e código', () => {
    const error = new AppError('Erro de teste', 400, 'TEST_ERROR');

    expect(error.message).toBe('Erro de teste');
    expect(error.status).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.timestamp).toBeDefined();
  });

  // TESTE 2: Erro com valores padrão
  test('deve usar valores padrão quando não especificado', () => {
    const error = new AppError('Erro');

    expect(error.message).toBe('Erro');
    expect(error.status).toBe(500); // ← Padrão
    expect(error.code).toBe('INTERNAL_ERROR'); // ← Padrão
  });

  // TESTE 3: Erro deve ser instanceof Error
  test('deve ser uma instância de Error', () => {
    const error = new AppError('Teste');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  // TESTE 4: Timestamp deve ser ISO
  test('timestamp deve estar em formato ISO', () => {
    const error = new AppError('Teste');
    
    // Tentar fazer parse como ISO
    const date = new Date(error.timestamp);
    expect(date.toISOString()).toBe(error.timestamp);
  });
});