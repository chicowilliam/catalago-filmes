const express = require("express");
const router = express.Router();

// ADMIN FIXO (por enquanto)
const ADMIN_USER = {
  username: "admin",
  password: "123456"
};

// LOGIN
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_USER.username &&
    password === "123456"
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