#  CatalogX  Catálogo de Filmes e Séries

> Projeto full-stack de portfólio inspirado em serviços de streaming.
> **API Node.js/Express** + frontend **React 19 / TypeScript**, integrado à TMDB.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18%2B-lightgrey.svg)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)
[![CI](https://github.com/chicowilliam/catalago-filmes/actions/workflows/ci.yml/badge.svg)](https://github.com/chicowilliam/catalago-filmes/actions)

---

##  Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Autenticação por Sessão** | Login com proteção por bcrypt e `express-session` |
| **Catálogo via TMDB** | Filmes e séries em tendência em tempo real |
| **Cache com TTL** | Cache em memória (backend) + localStorage (frontend, 10 min) |
| **Busca automática** | Pesquisa ao digitar com debounce de 350 ms |
| **Paginação** | `page` / `pageSize` na API e navegação visual no frontend |
| **Filtros por tipo** | Todos / Filmes / Séries / Favoritos |
| **Favoritos e Avaliações** | Sistema local de favoritos e estrelas (15) |
| **Trailer integrado** | Trailer do YouTube com cache por item e botão de retry |
| **Slider Destaque** | Hero com rotação a cada 15 s e render instantâneo via cache |
| **Menu mobile** | Hamburger ao lado da logo com logout e alternância de tema |
| **Tema Claro/Escuro** | Alternância persistida em localStorage |
| **Validação de dados** | Todas as entradas validadas com Joi no backend |
| **Tratamento de erros** | Sistema centralizado com `AppError` e `errorHandler` |
| **Retry automático** | 3 tentativas com backoff exponencial no cliente React |
| **UI Responsiva** | 100% compatível com desktop e mobile |
| **Testes automatizados** | 37+ testes backend (Jest + Supertest) + testes React (Vitest) |

---

##  Tech Stack

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js 20+** | Runtime JavaScript |
| **Express.js** | Framework web |
| **express-session** | Gerenciamento de sessão |
| **Helmet** | Headers de segurança HTTP |
| **Joi** | Validação de inputs |
| **bcryptjs** | Hash seguro de senhas |
| **express-rate-limit** | Proteção contra abuso de API |
| **TMDB API** | Fonte dos dados de filmes e séries |

### Frontend (`catalog-projeto/`)
| Tecnologia | Uso |
|---|---|
| **React 19** | Biblioteca de UI |
| **TypeScript 5** | Tipagem estática |
| **Vite** | Build tool e dev server |
| **Tailwind CSS 4** | Utilitários de estilo |
| **Framer Motion** | Animações fluidas |
| **shadcn/ui** | Componentes de UI acessíveis |

### Testes
| Tecnologia | Uso |
|---|---|
| **Jest + Supertest** | Testes de integração e unitários do backend |
| **Vitest + Testing Library** | Testes de componentes React |

---

##  Rodando Localmente

### Pré-requisitos
- Node.js 20+
- Conta na [TMDB](https://developer.themoviedb.org/) para obter a API key

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/chicowilliam/catalago-filmes.git
cd catalago-filmes

# 2. Instale as dependências (root + frontend React)
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais TMDB e SESSION_SECRET

# 4. Inicie API + frontend juntos
npm run dev:full
```

---

##  Deploy no Vercel

### 1. Como funciona

O projeto está totalmente configurado via [`vercel.json`](vercel.json):

- `api/index.js`  função serverless Node.js (backend Express completo)
- `catalog-projeto/`  build estático do Vite (frontend React)
- Rotas: `/api/*` proxied para a função; SPA fallback para `index.html`

Basta conectar o repositório no [vercel.com](https://vercel.com) e configurar as variáveis de ambiente  o build e o roteamento são automáticos.

### 2. Variáveis de Ambiente no Vercel

Configure em **Project  Settings  Environment Variables**:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ADMIN_USERNAME` |  | Usuário do painel admin |
| `ADMIN_PASSWORD` |  | Senha (texto puro ou hash bcrypt) |
| `SESSION_SECRET` |  | String aleatória longa (mín. 32 chars) |
| `TMDB_BEARER_TOKEN` | * | Bearer token da TMDB (recomendado) |
| `TMDB_API_KEY` | * | API key da TMDB (alternativa) |
| `NODE_ENV` |  | Definir como `production` |

> *Use `TMDB_BEARER_TOKEN` **ou** `TMDB_API_KEY`  ao menos um é obrigatório.

> **Gere um SESSION_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Validação Local Antes do Deploy

```bash
npm --prefix catalog-projeto run lint
npm --prefix catalog-projeto run build
npm test -- --runInBand
```

### 4. Smoke Tests Pós-Deploy

- [ ] `GET /api/health`  `{ "status": "success" }`
- [ ] `GET /api/health?deep=tmdb`  `dependencies.tmdb.status: "up"`
- [ ] Login admin e logout funcionando
- [ ] Entrar como visitante
- [ ] Busca ao digitar, filtros e paginação
- [ ] Abrir modal, trailer e favoritos
- [ ] Mobile: menu hamburger, tema claro/escuro

###  Limitação de Sessão no Vercel

O Vercel executa funções serverless stateless. O `express-session` com MemoryStore não persiste entre cold starts  sessões podem ser perdidas após inatividade. Para produção real, use `connect-redis` ou `connect-pg-simple`. Para portfólio, o comportamento é aceitável.

---

##  Variáveis de Ambiente

Crie um `.env` na raiz do projeto (nunca comite este arquivo):

```env
# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_aqui

# TMDB  use Bearer Token (recomendado) OU API Key
TMDB_BEARER_TOKEN=seu_bearer_token_aqui
# TMDB_API_KEY=sua_api_key_aqui

# Servidor
PORT=3000
NODE_ENV=development
SESSION_SECRET=string_aleatoria_longa_aqui

# Catálogo (opcionais)
# CATALOG_LIMIT=20
# TMDB_TIMEOUT_MS=8000
```

---

##  API Reference

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Login com usuário e senha |
| `POST` | `/api/auth/logout` | Encerra a sessão |
| `GET` | `/api/auth/me` | Verifica sessão ativa |

### Catálogo

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/catalog` | Lista filmes e séries via TMDB |
| `GET` | `/api/catalog/:id/trailer` | Busca trailer do YouTube |

#### Parâmetros  `/api/catalog`

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `type` | `movie` \| `series` \| `all` | `all` | Filtrar por tipo |
| `search` | string | `""` | Buscar por título |
| `page` | número | `1` | Número da página |
| `pageSize` | número | `20` | Itens por página (máx. 100) |

#### Exemplo de resposta

```json
{
  "status": "success",
  "source": "tmdb",
  "data": [...],
  "count": 20,
  "pagination": { "page": 1, "pageSize": 20, "total": 40, "totalPages": 2 }
}
```

### Health

| Rota | Descrição |
|---|---|
| `GET /api/health` | Status da API, versão, uptime, requestId |
| `GET /api/health?deep=tmdb` | Inclui checagem da integração TMDB |

---

##  Testes

```bash
# Backend (Jest + Supertest)  37+ testes
npm test
npm run test:coverage

# Frontend React (Vitest + Testing Library)
npm run test:frontend
npm run test:frontend:coverage
```

---

##  Estrutura do Projeto

```
.
 vercel.json                 # Configuração de deploy Vercel
 server.js                   # Entry point do servidor Express
 api/
    index.js                # Wrapper da função serverless Vercel
 backend/
    config/                 # Limites, timeout, paginação
    controllers/            # Camada HTTP (req  service  res)
    middlewares/            # errorHandler, isAdmin, requestContext, requestLogger
    routes/                 # auth.routes, catalog.routes
    services/               # auth.service, catalog.service, tmdb.service
    utils/                  # AppError, logger
    validators/             # Joi schemas (auth, catalog)
    __tests__/              # Jest + Supertest
 public/                     # Frontend clássico (HTML + CSS + Vanilla JS)
 catalog-projeto/            # Frontend moderno (React + TypeScript + Vite)
     src/
         components/
            catalog/        # MovieCard, CatalogGrid, FilterTabs, MovieModal,
                              # FeaturedSlider, SearchBar, FeaturedSkeleton
            layout/         # AppShell, Footer, ThemeToggle, ToastHost
            ui/             # Button (shadcn/ui)
         hooks/              # useCatalog, useFeatured, useAuth,
                               # useModal, useRatings, useToast
         pages/              # CatalogPage
         services/           # apiClient (retry/backoff), catalogService, authService
         styles/             # layout.css, components.css
         types/              # catalog.ts, auth.ts
```

---

##  Autor

**Vinicius William**

Desenvolvido como projeto de portfólio para demonstrar:
- Arquitetura backend em camadas com Node.js/Express
- Integração com API externa (TMDB) com cache, circuit breaker e retry
- Frontend moderno com React 19, TypeScript, Framer Motion e Tailwind CSS
- Otimizações de performance percebida: cache localStorage, debounce, stagger animations
- Segurança: Helmet, Joi, bcrypt, sessions assinadas, rate limiting, CSP
- Cobertura de testes automatizados (Jest + Vitest)
- Pipeline CI com GitHub Actions

---

> Inspirado em serviços de streaming como Netflix.

[![GitHub](https://img.shields.io/badge/GitHub-chicowilliam-181717?logo=github)](https://github.com/chicowilliam/catalago-filmes)
