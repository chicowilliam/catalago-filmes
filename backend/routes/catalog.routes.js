// backend/routes/catalog.routes.js
//
// Este arquivo s� registra as rotas.
// Toda a l�gica foi movida para:
//   -> backend/controllers/catalog.controller.js  (HTTP)
//   -> backend/services/catalog.service.js        (regras de negocio)
//   -> backend/services/tmdb.service.js           (integracao com API externa)

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const catalog = require("../controllers/catalog.controller");

const listLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 30,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		status: "error",
		code: "RATE_LIMIT_EXCEEDED",
		message: "Muitas requisições ao catálogo. Aguarde antes de tentar novamente."
	}
});

const featuredLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		status: "error",
		code: "RATE_LIMIT_EXCEEDED",
		message: "Muitas requisições em destaque. Aguarde antes de tentar novamente."
	}
});

const trailerLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 25,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		status: "error",
		code: "RATE_LIMIT_EXCEEDED",
		message: "Muitas requisições de trailer. Aguarde antes de tentar novamente."
	}
});

// O catálogo é somente-leitura via TMDB. Apenas GET está disponível.
router.get("/", listLimiter, catalog.list);
router.get("/featured", featuredLimiter, catalog.featured);
router.get("/:id/trailer", trailerLimiter, catalog.trailer);

module.exports = router;
