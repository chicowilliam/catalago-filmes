require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./backend/routes/auth.routes");
const catalogRoutes = require("./backend/routes/catalog.routes");
const errorHandler = require("./backend/middlewares/errorHandler"); // ← ADICIONE

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
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