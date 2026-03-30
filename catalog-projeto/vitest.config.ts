import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Configuração exclusiva para os testes (vitest)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // vmForks tem melhor compatibilidade no Windows que o pool padrão (forks)
    pool: 'vmForks',
    vmForks: { singleFork: true },
  },
})
