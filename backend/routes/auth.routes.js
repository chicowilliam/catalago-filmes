const express = require("express");
const router = express.Router();

// ✅ AGORA USA VARIÁVEIS DE AMBIENTE!
const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123"
};

// LOGIN
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_USER.username &&
    password === ADMIN_USER.password // ← MUDOU!
  ) {
    req.session.user = {
      username,
      role: "admin"
    };

    return res.json({ message: "Login successful" });
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