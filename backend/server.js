const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const catalogRoutes = require("./routes/catalog.routes");

const app = express();

// MIDDLEWARES GLOBAIS
app.use(express.json());

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

// SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// ROTAS
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);

// SERVER
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});