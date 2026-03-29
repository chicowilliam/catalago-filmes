# 🎬 Movie Catalog

> A full-stack portfolio project with a **Node.js/Express backend + two frontends**: a classic vanilla JavaScript interface and a modern React/TypeScript interface, inspired by streaming services like Netflix.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18%2B-lightgrey.svg)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Author](#author)

## ✨ Features

- ✅ **Session Authentication** — Secure login with bcrypt password hashing
- ✅ **TMDB Integration** — Trending movies and TV shows via The Movie Database API
- ✅ **In-Memory Cache** — 5-minute TTL with stale fallback when TMDB is unavailable
- ✅ **Pagination** — `page` / `pageSize` support in the API and visual pagination in the React frontend
- ✅ **Search & Filters** — Full-text search and type filtering (movie / series / favorites)
- ✅ **Favorites & Ratings** — Client-side favorites and 5-star rating system
- ✅ **Input Validation** — All inputs validated with Joi on the backend
- ✅ **Error Handling** — Centralized error system with `AppError` and `errorHandler` middleware
- ✅ **Auto Retry** — 3 retries with exponential backoff in the React API client
- ✅ **Responsive UI** — Desktop and mobile compatible
- ✅ **Dual Frontend** — Vanilla JS (`public/`) and React/TypeScript (`catalog-projeto/`)
- ✅ **Automated Tests** — 37+ backend tests (Jest + Supertest) and React tests (Vitest + Testing Library)

## 🚀 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20+** | JavaScript runtime |
| **Express.js** | Web framework |
| **express-session** | Session management |
| **Helmet** | HTTP security headers |
| **Joi** | Input validation |
| **bcryptjs** | Password hashing |
| **TMDB API** | Movie and series data source |

### Frontend — Classic (`public/`)
| Technology | Purpose |
|---|---|
| **HTML5 + CSS3** | Structure and styles |
| **Vanilla JavaScript** | ES modules, no frameworks |

### Frontend — Modern (`catalog-projeto/`)
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript** | Static typing |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations |
| **shadcn/ui** | Accessible UI components |

### Testing
| Technology | Purpose |
|---|---|
| **Jest + Supertest** | Backend integration and unit tests |
| **Vitest + Testing Library** | React component tests |

## 💻 Getting Started

### Prerequisites

- Node.js 20+ installed
- Git installed
- [TMDB account](https://developer.themoviedb.org/) to obtain an API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chicowilliam/catalago-filmes.git
   cd catalago-filmes
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your TMDB credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **(Optional) Start the React frontend**
   ```bash
   cd catalog-projeto
   npm install
   npm run dev
   ```

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password_here

# TMDB — use Bearer Token (recommended) or API Key
TMDB_BEARER_TOKEN=your_bearer_token_here
# TMDB_API_KEY=your_api_key_here

# Server settings (optional)
PORT=3000
NODE_ENV=development
SESSION_SECRET=a_long_random_secret_string
```

> **Security:** Never commit the `.env` file. It is already listed in `.gitignore`.

## 🔌 API Reference

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/login` | Log in with username and password |
| `POST` | `/api/auth/logout` | Terminate the current session |
| `GET`  | `/api/auth/me` | Check active session |

### Catalog

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/catalog` | List movies and series from TMDB |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `movie` \| `series` \| `all` | `all` | Filter by content type |
| `search` | string | `""` | Full-text search by title |
| `page` | number | `1` | Page number |
| `pageSize` | number | `20` | Items per page (max 100) |

#### Sample Response

```json
{
  "status": "success",
  "source": "tmdb",
  "data": [...],
  "count": 20,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 40,
    "totalPages": 2
  }
}
```

## 🧪 Testing

### Backend (Jest + Supertest)

```bash
npm test
npm run test:coverage
```

### React Frontend (Vitest)

```bash
cd catalog-projeto
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run --coverage
```

## 📁 Project Structure

```
├── server.js                  # Express app entry point
├── backend/
│   ├── config/                # catalog.config.js — limits, timeout, page config
│   ├── controllers/           # HTTP layer: extract req → call service → send res
│   ├── middlewares/           # errorHandler.js, isAdmin.js
│   ├── routes/                # auth.routes.js, catalog.routes.js
│   ├── services/              # auth.service.js, catalog.service.js, tmdb.service.js
│   ├── utils/                 # AppError.js, logger.js
│   ├── validators/            # auth.validator.js, catalog.validator.js (Joi)
│   ├── data/                  # Reserved for local data (future database migration)
│   ├── repositories/          # Reserved for data access layer (future migration)
│   └── __tests__/             # Jest + Supertest integration and unit tests
├── public/                    # Classic frontend (Vanilla JS)
│   ├── index.html
│   └── js/                    # auth.js, catalog.js, modal.js, render.js, ...
└── catalog-projeto/           # Modern frontend (React + TypeScript + Vite)
    ├── src/
    │   ├── components/        # MovieCard, CatalogGrid, FilterTabs, MovieModal, ...
    │   ├── hooks/             # useCatalog.ts, useAuth.ts, useModal.ts, useRatings.ts
    │   ├── pages/             # CatalogPage.tsx
    │   ├── services/          # apiClient.ts, catalogService.ts, authService.ts
    │   ├── types/             # catalog.ts, auth.ts
    │   └── test/              # setup.ts, MovieCard.test.tsx
    └── package.json
```

## 👤 Author

Built as a portfolio project to demonstrate:

- Backend architecture with Node.js/Express and clean layered design
- External API integration (TMDB) with caching and fallback strategies
- Two frontend paradigms: vanilla JS and modern React
- Security practices: Helmet, Joi, bcrypt, signed sessions, rate limiting
- Automated test coverage across backend and React layers

---

*Inspired by streaming services like Netflix*


[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18%2B-lightgrey.svg)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)

## 📋 Sumário

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API Endpoints](#api-endpoints)
- [Testes](#testes)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autor](#autor)

## ✨ Características

- ✅ **Autenticação com Sessão** — Login seguro com proteção por senha (bcrypt ou texto simples)
- ✅ **Catálogo via TMDB** — Integração com a API de filmes e séries em tendência
- ✅ **Cache em Memória** — TTL de 5 minutos com fallback quando a TMDB está fora
- ✅ **Paginação** — Suporte a `page` e `pageSize` na API e navegação visual no front-end React
- ✅ **Busca e Filtros** — Buscar por título e filtrar por tipo (filme / série / favoritos)
- ✅ **Favoritos e Avaliações** — Sistema local de favoritos e avaliação por estrelas
- ✅ **Validação de Dados** — Entradas validadas com Joi no back-end
- ✅ **Tratamento de Erros** — Sistema centralizado com `AppError` e `errorHandler`
- ✅ **Retry Automático** — 3 tentativas com backoff exponencial no front-end React
- ✅ **UI Responsiva** — Compatível com desktop e mobile
- ✅ **Dois Front-ends** — JavaScript puro (`public/`) e React/TypeScript (`catalog-projeto/`)
- ✅ **37+ Testes Automatizados** — Jest + Supertest (back-end) e Vitest + Testing Library (React)

## 🚀 Tecnologias

### Back-end
- **Node.js 20+** — Runtime JavaScript
- **Express.js** — Framework web
- **express-session** — Gerenciamento de sessão
- **Helmet** — Headers de segurança HTTP
- **Joi** — Validação de dados
- **bcryptjs** — Hashing seguro de senhas
- **TMDB API** — Fonte dos dados de filmes e séries

### Front-end Clássico (`public/`)
- **HTML5** + **CSS3** — Estrutura e estilo
- **JavaScript Vanilla** — Módulos ES sem frameworks

### Front-end Moderno (`catalog-projeto/`)
- **React 19** — Biblioteca de UI
- **TypeScript** — Tipagem estática
- **Vite 8** — Build tool e servidor de desenvolvimento
- **Tailwind CSS 4** — Utilitários de estilo
- **Framer Motion** — Animações fluidas
- **shadcn/ui** — Componentes acessíveis

### Testes
- **Jest + Supertest** — 37+ testes de back-end (rotas, serviços, middlewares)
- **Vitest + Testing Library** — Testes de componentes React

## 💻 Instalação

### Pré-requisitos

- Node.js 20+ instalado
- Git instalado
- Conta na [TMDB](https://developer.themoviedb.org/) para obter a chave de API

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/chicowilliam/catalago-filmes.git
   cd catalago-filmes
   ```

2. **Instale as dependências do back-end**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite .env e adicione sua chave TMDB
   ```

4. **Inicie o servidor**
   ```bash
   npm run dev
   ```

5. **(Opcional) Front-end moderno React**
   ```bash
   cd catalog-projeto
   npm install
   npm run dev
   ```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Credenciais de admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_aqui

# TMDB — use Bearer Token (recomendado) ou API Key
TMDB_BEARER_TOKEN=seu_bearer_token_aqui
# TMDB_API_KEY=sua_api_key_aqui

# Configurações do servidor (opcional)
PORT=3000
NODE_ENV=development
SESSION_SECRET=uma_chave_secreta_longa
```

> **Segurança:** Nunca commite o `.env` no repositório. O arquivo `.gitignore` já está configurado para ignorá-lo.

## 🔌 API Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login com usuário e senha |
| `POST` | `/api/auth/logout` | Encerra a sessão atual |
| `GET`  | `/api/auth/me` | Verifica sessão ativa |

### Catálogo

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/api/catalog` | Lista filmes e séries via TMDB |

#### Parâmetros do catálogo

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
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
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 40,
    "totalPages": 2
  }
}
```

## 🧪 Testes

### Back-end (Jest + Supertest)

```bash
npm test
npm run test:coverage
```

### Front-end React (Vitest)

```bash
cd catalog-projeto
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run --coverage
```

## 📁 Estrutura do Projeto

```
├── server.js                  # Entry point do servidor Express
├── backend/
│   ├── config/                # catalog.config.js (limites, timeout, páginas)
│   ├── controllers/           # Extração de req, chamada ao service, res.json
│   ├── middlewares/           # errorHandler.js, isAdmin.js
│   ├── routes/                # auth.routes.js, catalog.routes.js
│   ├── services/              # auth.service.js, catalog.service.js, tmdb.service.js
│   ├── utils/                 # AppError.js, logger.js
│   ├── validators/            # auth.validator.js, catalog.validator.js (Joi)
│   ├── data/                  # Reservado para dados locais (migração futura p/ banco de dados)
│   ├── repositories/          # Reservado para data access objects (migração futura)
│   └── __tests__/             # Testes Jest + Supertest
├── public/                    # Front-end clássico (JS Vanilla)
│   ├── index.html
│   └── js/                    # auth.js, catalog.js, modal.js, render.js ...
└── catalog-projeto/           # Front-end moderno (React + TypeScript + Vite)
    ├── src/
    │   ├── components/        # MovieCard, CatalogGrid, FilterTabs, MovieModal ...
    │   ├── hooks/             # useCatalog.ts, useAuth.ts, useModal.ts, useRatings.ts
    │   ├── pages/             # CatalogPage.tsx
    │   ├── services/          # apiClient.ts, catalogService.ts, authService.ts
    │   ├── types/             # catalog.ts, auth.ts
    │   └── test/              # setup.ts, MovieCard.test.tsx
    └── package.json
```

## 👤 Autor

Desenvolvido como projeto de portfólio para demonstrar:

- Arquitetura back-end com Node.js/Express
- Integração com APIs externas (TMDB)
- Dois paradigmas de front-end (JS puro vs React moderno)
- Práticas de segurança (Helmet, Joi, bcrypt, sessões)
- Cobertura de testes automatizados (Jest + Vitest)

---
*Inspirado em serviços de streaming como Netflix*
