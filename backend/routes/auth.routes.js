const express = require("express");
const router = express.Router();
const { validateLogin } = require("../validators/auth.validator");
const AppError = require("../utils/AppError"); // ← ADICIONE

const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123"
};

// LOGIN COM VALIDAÇÃO E ERRO TRATADO ✅
router.post("/login", (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = validateLogin(req.body);

    if (error) {
      const messages = error.details.map(detail => detail.message);
      // Usar AppError para erro estruturado
      throw new AppError(
        messages.join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const { username, password } = value;

    // Verificar credenciais
    if (
      username !== ADMIN_USER.username ||
      password !== ADMIN_USER.password
    ) {
      throw new AppError(
        "Usuário ou senha incorretos",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    // Login bem-sucedido
    req.session.user = {
      username,
      role: "admin"
    };

    return res.json({
      status: "success",
      message: "Login successful",
      user: { username, role: "admin" }
    });
  } catch (err) {
    // Passar erro para o middleware
    next(err);
  }
});

// LOGOUT
router.post("/logout", (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        throw new AppError(
          "Erro ao fazer logout",
          500,
          "LOGOUT_ERROR"
        );
      }

      res.json({
        status: "success",
        message: "Logged out successfully"
      });
    });
  } catch (err) {
    next(err);
  }
});

// VER QUEM ESTÁ LOGADO
router.get("/me", (req, res, next) => {
  try {
    if (!req.session.user) {
      throw new AppError(
        "Você não está autenticado",
        401,
        "NOT_AUTHENTICATED"
      );
    }

    res.json({
      status: "success",
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;