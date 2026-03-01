const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./backend/routes/auth.routes");
const catalogRoutes = require("./backend/routes/catalog.routes");

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

/* =========================
   ROTAS DA API
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);

/* =========================
   FRONTEND (PUBLIC)
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   SERVER
========================= */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
});