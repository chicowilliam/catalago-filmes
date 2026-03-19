# Portfolio Map - Site Inspirado em Servico de Streaming

## 0) Historico de Sessoes

### 18/03/2026 - Integracao segura com API externa (TMDB)
**Contexto:**
- Usuario quer substituir imagens/catalogo local por API de filmes, mas sem expor API key para recrutadores.

**Ajuste aplicado:**
- `backend/routes/catalog.routes.js`
  - `GET /api/catalog` agora suporta fonte externa opcional via TMDB quando `CATALOG_SOURCE=tmdb`.
  - Integracao feita no backend (server-side), mantendo API key fora do frontend.
  - Adicionado cache em memoria (TTL de 5 min) para reduzir chamadas e evitar rate limit.
  - Adicionado fallback implicito para base local (`catalog.json`) quando TMDB nao estiver configurada.
  - Resposta do endpoint inclui `source` (`tmdb` ou `local`) para facilitar diagnostico.

**Seguranca da chave:**
- Chave permanece apenas em variavel de ambiente (`TMDB_BEARER_TOKEN` ou `TMDB_API_KEY`).
- Nao enviar chave para `public/js/script.js`.
- Nao versionar `.env` no GitHub.

**Como ativar TMDB:**
- Definir no ambiente:
  - `CATALOG_SOURCE=tmdb`
  - `TMDB_BEARER_TOKEN=...` (preferencial) ou `TMDB_API_KEY=...`

**Resultado esperado:**
- Frontend continua consumindo `/api/catalog` sem alteracoes.
- Recrutadores conseguem rodar o projeto sem acesso direto ao segredo no browser.

### 18/03/2026 - Sessao de hoje
**Bugs corrigidos:**
- HTML malformado na `<nav>` (tags sem `>`, `<button` sem `<`) travava o `script.js` inteiro,
  impedindo o evento de submit do login de ser registrado. Corrigido em `public/index.html`.
- Senha no `.env` estava diferente da senha usada no login (`minha_senha_super_segura_123` → `admin123`).
- Remote do git apontava para `chicolindo/catalago-filmes` (nome antigo); atualizado para `chicowilliam/catalago-filmes`.
- Email do git local estava como `vini_9256@outlook.com.br`; corrigido para `viniciuswilliam91@gmail.com`
  para que contribuicoes apareçam no grafico do GitHub.

**Melhorias aplicadas:**
- Nav de filtros (`Todos/Filmes/Series/Favoritos`) repaginada com HTML semantico:
  `role="tablist"`, `role="tab"`, `aria-selected` e `tabindex` corretos para acessibilidade.
- Plano de CSS e JS profissional entregue para o usuario aplicar manualmente
  (visual dashboard, sublinhado ativo, scroll horizontal no mobile, navegacao por teclado).

**Arquivos de contexto criados:**
- `.github/copilot-instructions.md` — regras permanentes de stack, padrao de codigo e idioma para o assistente.
- `PORTFOLIO_MAP.md` (este arquivo) — mapa tecnico vivo do projeto.

**Commits da sessao:**
- `428c3a2` fix: resolve critical login bug caused by malformed HTML in nav
- `1f37c73` fix: corrige HTML malformado na nav que travava o script.js e bloqueava o login
- `514874e` docs: adiciona instrucoes do copilot para o portfolio
- `b0d5773` docs: atualiza portfolio map com mudancas recentes

### 18/03/2026 - Redesign visual estilo streaming
**Objetivo:**
- Modernizar o visual do frontend com UI limpa, layout mais profissional e organizacao de catalogo por categorias.

**Mudancas aplicadas:**
- `public/index.html`
  - Nova secao hero com destaque principal, estatisticas de catalogo e CTA de trailer.
  - Estrutura separada em blocos para `Filmes`, `Series` e `Favoritos`.
  - Ajustes de placeholder de busca e preparacao para contadores dinamicos.
- `public/css/style.css`
  - Nova direcao visual com tipografia (`Outfit` + `Space Grotesk`), paleta harmonica e superfícies em camadas.
  - Grid responsivo refinado, espacamentos consistentes e cards com melhor hierarquia visual.
  - Animacoes suaves em cards, secoes, destaque e feedback visual.
  - Melhorias de acessibilidade/performance com `prefers-reduced-motion`.
- `public/js/script.js`
  - Renderizacao por secoes (movies/series/favorites) em estilo streaming real.
  - Card de destaque dinamico com dados do catalogo.
  - Contadores de itens por categoria atualizados em tempo real.
  - Correcao da navegacao por teclado nos filtros e consolidacao da logica de favoritos.
  - Preservadas funcionalidades existentes: login, tema, modal, rating e favoritos.

**Validacao tecnica:**
- Sem erros nos arquivos alterados (`index.html`, `style.css`, `script.js`) na verificacao do editor.

### 18/03/2026 - Diagnostico de boot/backend
**Causa principal identificada:**
- Erro `EADDRINUSE` ao iniciar com `node server.js` (porta `3000` ja estava ocupada por outra instancia).

**Acoes aplicadas:**
- `server.js`
  - Adicionado endpoint `GET /api/health` para checagem rapida de disponibilidade da API.
  - Adicionado tratamento de erro no `app.listen` para `EADDRINUSE` com mensagem amigavel de diagnostico.

**Varredura geral:**
- Rotas backend principais e middlewares sem erros de sintaxe.
- Suite de testes executada: ha falhas de contrato em testes de rotas (nao bloqueia boot do servidor, mas requer alinhamento entre formato de erro esperado e app de teste).

### 18/03/2026 - Diagnostico de tela sem conteudo apos login
**Resultado da investigacao:**
- Backend respondeu normalmente nos testes manuais de `health`, `login` e `catalog`.
- Causa mais provavel para "site sem conteudo" no browser: frontend aberto fora da URL esperada (`http://localhost:3000`), como `file://` ou outra porta local.

**Ajuste aplicado:**
- `public/js/script.js`
  - Adicionada validacao de contexto em runtime.
  - Exibicao de mensagem clara no login quando o frontend nao esta sendo acessado por `http://localhost:3000`.
  - Mensagem de erro de conexao mais objetiva para orientar subida do backend.

### 18/03/2026 - Correcao de loader infinito
**Contexto:**
- Usuario reportou tela presa em carregamento.
- `node_modules` presente; nao ha necessidade de rodar `npm install` novamente em toda execucao.

**Ajustes aplicados:**
- `public/index.html`
  - Loader passou a iniciar oculto por padrao (`class="hide"`) para nao bloquear a UI em caso de falha de script/rede.
- `public/js/script.js`
  - Adicionado timeout de requisicao no carregamento do catalogo (`AbortController`).
  - Adicionado fail-safe para esconder loader mesmo quando a API demora/trava.
  - Toast de erro para feedback ao usuario quando o catalogo nao carregar.

### 18/03/2026 - Alinhamento de commits/autoria
**Contexto:**
- Usuario reportou duvida se os commits estavam sendo gerados corretamente.

**Acoes aplicadas:**
- Configurado email local do Git no repositorio para `viniciuswilliam91@gmail.com`.
- Validado que o historico local esta ativo e recebendo commits.

**Observacao de publicacao:**
- Commits locais so aparecem no GitHub apos `git push` para a branch remota.

### 18/03/2026 - Ajuste de copy na hero
**Mudanca aplicada:**
- `public/index.html`
  - Texto de descricao da hero atualizado para destacar que o projeto e inspirado em streaming e usa front-end + back-end.

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
1. Refinar microinteracoes (hover/focus/active) com padrao visual unico por componente.
2. Modularizar `public/js/script.js` por dominio (auth, catalog, ui, storage).
3. Adicionar testes de regressao para rotas de catalogo e validacoes de erro.
4. Padronizar respostas da API (campos `status`, `message`, `data` sempre previsiveis).
5. Evoluir persistencia para banco (SQLite/PostgreSQL) mantendo contratos da API.
6. ✅ Acessibilidade basica: `role="tablist/tab"`, `aria-selected`, `tabindex` ja aplicados na nav.
7. ✅ Redesign visual principal (hero, secoes por categoria e nova grade) aplicado em 18/03/2026.

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
