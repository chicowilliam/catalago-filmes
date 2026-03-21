require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./backend/routes/auth.routes");
const catalogRoutes = require("./backend/routes/catalog.routes");
const errorHandler = require("./backend/middlewares/errorHandler"); // ← ADICIONE

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
   throw new Error("SESSION_SECRET nao definido. Configure no ambiente antes de iniciar o servidor.");
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
   xssFilter: true,
   referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(globalLimiter);

// Validação: exigir Content-Type correto em POST/PUT/DELETE
app.use((req, res, next) => {
   if (["POST", "PUT", "DELETE"].includes(req.method)) {
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
    secret: process.env.SESSION_SECRET,
    resave: false,
      saveUninitialized: false,
      unset: "destroy",
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

app.get("/api/health", (req, res) => {
   res.json({
      status: "success",
      service: "catalog-api",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
   });
});

/* =========================
   FRONTEND (PUBLIC)
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   TRATAMENTO DE ERROS (DEVE SER POR ÚLTIMO!)
========================= */
app.use(errorHandler);

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
  console.log(`🔐 Modo: ${process.env.NODE_ENV}`);
});

server.on("error", (err) => {
   if (err.code === "EADDRINUSE") {
      console.error(`❌ Porta ${PORT} já está em uso. Feche a instância anterior ou altere a variável PORT no .env.`);
      process.exit(1);
   }

   console.error("❌ Erro ao iniciar servidor:", err.message);
   process.exit(1);
});