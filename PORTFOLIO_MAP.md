# Portfolio Map - Site Inspirado em Servico de Streaming

## 0) Atualizacoes Recentes (18/03/2026)
- Criado guia de contexto para assistente em `.github/copilot-instructions.md`.
- Criado este arquivo `PORTFOLIO_MAP.md` para consolidar arquitetura, fluxos e backlog.
- Definida direcao de UI para o dashboard: visual mais profissional, menos arcade, com foco em responsividade no seletor `Todos/Filmes/Series/Favoritos`.
- Estrategia de implementacao para hoje: aplicar repaginacao no frontend sem remover funcionalidades existentes.

## 1) Visao Geral
Projeto full stack com autenticacao de sessao para area administrativa, catalogo em JSON e frontend focado em experiencia semelhante a plataformas de streaming.

## 2) Arquitetura Atual
- Backend (Node.js/Express)
  - Entrada da aplicacao: `server.js`
  - Rotas de autenticacao: `backend/routes/auth.routes.js`
  - Rotas de catalogo: `backend/routes/catalog.routes.js`
  - Validacao: `backend/validators/auth.validator.js`
  - Tratamento de erro: `backend/middlewares/errorHandler.js` + `backend/utils/AppError.js`
  - Persistencia: arquivo local `backend/data/catalog.json`
- Frontend (HTML/CSS/JS vanilla)
  - Estrutura principal: `public/index.html`
  - Estilos: `public/css/style.css`
  - Logica de interface e integracao com API: `public/js/script.js`

## 3) Fluxos Principais
- Login
  - Usuario envia credenciais para `POST /api/auth/login`.
  - Sessao e criada em caso de sucesso.
  - Frontend remove tela de login e carrega catalogo.
- Catalogo
  - Listagem: `GET /api/catalog?type=...&search=...`
  - Criacao/edicao/exclusao: protegidas por `isAdmin`.
- UI interativa
  - Favoritos e avaliacoes persistidos no `localStorage`.
  - Modal com trailer (YouTube), busca com debounce e lazy loading.
  - Alternancia de tema claro/escuro.

## 4) Pontos Fortes Ja Implementados
- Estrutura de backend separada por responsabilidades.
- Validacao de entrada e padrao de erro consistente.
- Suite de testes com Jest e Supertest.
- Frontend com boas funcionalidades de usabilidade (filtros, favoritos, feedback visual).

## 5) Riscos e Limitacoes Atuais
- Persistencia em JSON local (nao ideal para concorrencia e escala).
- Sessao depende de segredo em ambiente; sem isso, ambiente fica fragil.
- Script frontend concentra muitas responsabilidades em um unico arquivo.
- Possivel crescimento de complexidade sem modularizacao no frontend.

## 6) Backlog Prioritario (Recomendado)
1. Modularizar `public/js/script.js` por dominio (auth, catalog, ui, storage).
2. Adicionar testes de regressao para rotas de catalogo e validacoes de erro.
3. Padronizar respostas da API (campos `status`, `message`, `data` sempre previsiveis).
4. Evoluir persistencia para banco (SQLite/PostgreSQL) mantendo contratos da API.
5. Melhorar acessibilidade (foco em teclado, labels/aria em elementos interativos).

## 7) Como Rodar e Validar
- Instalar: `npm install`
- Executar app: `npm run dev`
- Abrir: `http://localhost:3000`
- Testar backend: `npm test`
- Cobertura: `npm run test:coverage`

## 8) Referencia Rapida de Arquivos Criticos
- `server.js`
- `backend/routes/auth.routes.js`
- `backend/routes/catalog.routes.js`
- `backend/middlewares/errorHandler.js`
- `backend/middlewares/isAdmin.js`
- `backend/validators/auth.validator.js`
- `backend/utils/AppError.js`
- `public/index.html`
- `public/css/style.css`
- `public/js/script.js`
