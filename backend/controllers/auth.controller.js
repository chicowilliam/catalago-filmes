// backend/controllers/auth.controller.js
//
// Lida com as requisições HTTP de autenticação.
// Só extrai dados do req, chama o service e devolve o res.

const { validateLogin } = require("../validators/auth.validator");
const authService = require("../services/auth.service");
const AppError = require("../utils/AppError");

/**
 * POST /api/auth/login
 */
function login(req, res, next) {
  try {
    const { error, value } = validateLogin(req.body);
    if (error) {
      throw new AppError(
        error.details.map((d) => d.message).join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const user = authService.verifyCredentials(value.username, value.password);
    req.session.user = user;

    return res.json({ status: "success", message: "Login successful", user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(new AppError("Erro ao fazer logout", 500, "LOGOUT_ERROR"));
    res.json({ status: "success", message: "Logged out successfully" });
  });
}

/**
 * GET /api/auth/me
 */
function me(req, res, next) {
  try {
    if (!req.session.user) {
      throw new AppError("Você não está autenticado", 401, "NOT_AUTHENTICATED");
    }
    res.json({ status: "success", user: req.session.user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
