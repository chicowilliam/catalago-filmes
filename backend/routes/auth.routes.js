// backend/routes/auth.routes.js
//
// Este arquivo so registra as rotas de autenticacao.
// Toda a logica foi movida para:
//   -> backend/controllers/auth.controller.js  (HTTP)
//   -> backend/services/auth.service.js        (regras de negocio)

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const auth = require("../controllers/auth.controller");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "error",
    code: "TOO_MANY_REQUESTS",
    message: "Muitas tentativas de login. Tente novamente em alguns minutos."
  }
});

router.post("/login",  loginLimiter, auth.login);
router.post("/logout", auth.logout);
router.get("/me",      auth.me);

module.exports = router;
