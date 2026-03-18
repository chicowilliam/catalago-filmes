# Instrucoes do Copilot para este Portfolio

## Contexto do Projeto
- Projeto: catalogo de filmes e series inspirado em streaming.
- Stack: Node.js + Express no backend, HTML/CSS/JavaScript vanilla no frontend.
- Objetivo principal: portfolio com foco em UX, codigo limpo, API organizada e testes.

## Como Responder e Trabalhar
- Responder sempre em portugues (pt-BR), com explicacoes objetivas.
- Antes de sugerir mudancas grandes, mapear impacto em `public/` e `backend/`.
- Priorizar solucoes simples, legiveis e com baixo acoplamento.
- Preservar padrao atual do projeto (CommonJS no backend e JS vanilla no frontend).

## Padrões Tecnicos
- Backend:
  - Manter tratamento de erros via `AppError` e `errorHandler`.
  - Validar entradas com Joi em `backend/validators/`.
  - Em rotas protegidas, manter middleware `isAdmin`.
  - Nao introduzir TypeScript sem pedido explicito.
- Frontend:
  - Nao remover funcionalidades existentes (favoritos, tema, login, modal, rating).
  - Evitar bibliotecas externas sem necessidade.
  - Manter compatibilidade desktop e mobile.

## Qualidade
- Sempre que editar backend, considerar impacto nos testes Jest/Supertest.
- Ao criar funcionalidade nova, sugerir casos de teste faltantes.
- Evitar regressao de UX e performance.

## Comandos Uteis
- Instalar dependencias: `npm install`
- Rodar app: `npm run dev`
- Rodar testes: `npm test`
- Cobertura: `npm run test:coverage`

## Entregas Esperadas
- Explicar: o que mudou, por que mudou e como validar.
- Referenciar arquivos alterados com clareza.
- Quando houver risco tecnico, apontar trade-offs de forma direta.
