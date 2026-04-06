require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const { version } = require("./package.json");

const authRoutes = require("./backend/routes/auth.routes");
const catalogRoutes = require("./backend/routes/catalog.routes");
const errorHandler = require("./backend/middlewares/errorHandler");
const requestContext = require("./backend/middlewares/requestContext");
const requestLogger = require("./backend/middlewares/requestLogger");
const { pingTmdb } = require("./backend/services/tmdb.service");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
   throw new Error("SESSION_SECRET nao definido. Configure no ambiente antes de iniciar o servidor.");
}

const REQUIRED_ENV_VARS = ["ADMIN_USERNAME", "ADMIN_PASSWORD"];
for (const varName of REQUIRED_ENV_VARS) {
   if (!process.env[varName]) {
      throw new Error(`${varName} nao definido. Configure no .env antes de iniciar o servidor.`);
   }
}

if (!isProduction && !/^\$2[ab]\$\d{2}\$/.test(process.env.ADMIN_PASSWORD)) {
   console.warn("⚠️  ADMIN_PASSWORD está em texto puro. Para maior segurança, use um hash bcrypt:");
   console.warn("   node -e \"require('bcryptjs').hash(process.env.ADMIN_PASSWORD, 12).then(h => console.log(h))\"");
}

if (!process.env.TMDB_BEARER_TOKEN && !process.env.TMDB_API_KEY) {
   console.warn("⚠️  TMDB_BEARER_TOKEN ou TMDB_API_KEY nao definido.");
   console.warn("   A API vai iniciar, mas o catalogo respondera erro 503 ate a TMDB ser configurada no .env.");
}

if (isProduction) {
   app.set("trust proxy", 1);
}

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
const globalLimiter = rateLimit({
   windowMs: 60 * 1000,
   limit: 100,
   standardHeaders: "draft-8",
   legacyHeaders: false,
   skip: (req) => req.path === "/api/health"
});

// Helmet com configurações de segurança aprimoradas
app.use(helmet({
   contentSecurityPolicy: {
      directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
         styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
         fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
         imgSrc: ["'self'", "data:", "https:"],
         frameSrc: ["https://www.youtube.com"],
         connectSrc: ["'self'"]
      }
   },
   hsts: {
      maxAge: isProduction ? 31536000 : 0,
      includeSubDomains: true,
      preload: isProduction
   },
   frameguard: { action: "sameorigin" },
   noSniff: true,
   referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(globalLimiter);
app.use(requestContext);
app.use(requestLogger);

// Validação: exigir Content-Type correto em POST/PUT
app.use((req, res, next) => {
   if (["POST", "PUT"].includes(req.method)) {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
         return res.status(415).json({
            status: "error",
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Content-Type deve ser application/json"
         });
      }
   }
   next();
});

app.use(
  session({
      name: "portfolio.sid",
      proxy: isProduction,
    secret: process.env.SESSION_SECRET,
    resave: false,
      saveUninitialized: false,
      unset: "destroy",
      rolling: true,
      cookie: {
         httpOnly: true,
         sameSite: "lax",
         secure: isProduction,
         maxAge: 1000 * 60 * 60 * 8
      }
  })
);

/* =========================
   ROTAS DA API
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);

app.get("/api/health", async (req, res) => {
   const deepTmdbCheck = String(req.query.deep || "") === "tmdb";
   const dependencies = {};

   if (deepTmdbCheck) {
      try {
         await pingTmdb();
         dependencies.tmdb = { status: "up" };
      } catch (err) {
         dependencies.tmdb = {
            status: "down",
            code: err.code || "TMDB_HEALTHCHECK_ERROR",
            message: err.message || "Falha ao validar TMDB"
         };
      }
   }

   res.json({
      status: "success",
      service: "catalog-api",
      version,
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ...(deepTmdbCheck ? { dependencies } : {}),
   });
});

/* =========================
    FRONTEND
    React build (catalog-projeto/dist) é o único frontend.

    - Em produção (Vercel/deploy): build gerado automaticamente no deploy.
    - Em desenvolvimento local: rode `npm run build` uma vez antes de
      usar `npm run start:api`. Para hot-reload, use `npm run dev`.
========================= */
const reactBuildPath = path.join(__dirname, "catalog-projeto", "dist");
const hasReactBuild = fs.existsSync(path.join(reactBuildPath, "index.html"));

if (hasReactBuild) {
   // Serve os assets estáticos do React (JS, CSS, imagens)
   app.use(express.static(reactBuildPath));
} else {
   // Sem build: avisa no console e retorna 503 em qualquer rota não-API
   console.warn("\x1b[33m⚠️  Build do React não encontrado.\x1b[0m");
   console.warn("   Rode: npm run build");
   console.warn("   Ou para dev com hot-reload: npm run dev");
}

// Rotas de API não encontradas — DEVE vir antes do SPA fallback
app.use("/api/*", (req, res) => {
   res.status(404).json({
      status: "error",
      message: "Rota não encontrada"
   });
});

// SPA fallback: qualquer rota não-API retorna o index.html do React
if (hasReactBuild) {
   app.get("*", (req, res) => {
      res.sendFile(path.join(reactBuildPath, "index.html"));
   });
} else {
   app.get("*", (req, res) => {
      res.status(503).send(
         "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'>" +
         "<title>Build não encontrado</title></head><body style='font-family:sans-serif;padding:40px'>" +
         "<h2>⚠️ Frontend não compilado</h2>" +
         "<p>Rode <code>npm run build</code> e reinicie o servidor.</p>" +
         "</body></html>"
      );
   });
}

/* =========================
   TRATAMENTO DE ERROS (DEVE SER POR ÚLTIMO!)
========================= */
app.use(errorHandler);

module.exports = app;

/* =========================
   SERVER (apenas ambiente local)
========================= */
if (require.main === module) {
   const PORT = process.env.PORT || 3000;
   const server = app.listen(PORT, () => {
      console.log(`\x1b[32m🚀 Servidor: http://localhost:${PORT}\x1b[0m`);
      console.log(`🔐 Modo: ${process.env.NODE_ENV}`);
      if (hasReactBuild) {
         console.log("\x1b[35m⚛️  Frontend: React (catalog-projeto/dist)\x1b[0m");
         console.log("    Para dev com hot-reload: npm run dev");
      } else {
         console.log("\x1b[33m⚠️  Frontend: build não encontrado — rode npm run build\x1b[0m");
      }
   });

   server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
         console.error(`❌ Porta ${PORT} já está em uso. Feche a instância anterior ou altere a variável PORT no .env.`);
         process.exit(1);
      }

      console.error("❌ Erro ao iniciar servidor:", err.message);
      process.exit(1);
   });
}