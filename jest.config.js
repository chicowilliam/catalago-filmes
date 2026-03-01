module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Arquivos de teste
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  
  // Cobertura de testes
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/data/**',
    '!node_modules/**'
  ],
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Verbose (mostrar detalhes)
  verbose: true
};