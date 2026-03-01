const express = require("express");
const router = express.Router();
const { validateLogin } = require("../validators/auth.validator"); // ← ADICIONE

// ✅ AGORA USA VARIÁVEIS DE AMBIENTE!
const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123"
};

// LOGIN COM VALIDAÇÃO ✅
router.post("/login", (req, res) => {
  // ← VALIDAR OS DADOS PRIMEIRO
  const { error, value } = validateLogin(req.body);

  // Se houver erro de validação
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ 
      message: "Dados inválidos",
      errors: messages 
    });
  }

  // Agora use os dados validados
  const { username, password } = value;

  if (
    username === ADMIN_USER.username &&
    password === ADMIN_USER.password
  ) {
    req.session.user = {
      username,
      role: "admin"
    };

    return res.json({ 
      message: "Login successful",
      user: { username, role: "admin" }
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// VER QUEM ESTÁ LOGADO
router.get("/me", (req, res) => {
  if (req.session.user) {
    return res.json(req.session.user);
  }

  res.status(401).json({ message: "Not authenticated" });
});

module.exports = router;