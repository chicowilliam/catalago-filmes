// backend/routes/catalog.routes.js
//
// Este arquivo s� registra as rotas.
// Toda a l�gica foi movida para:
//   -> backend/controllers/catalog.controller.js  (HTTP)
//   -> backend/services/catalog.service.js        (regras de negocio)
//   -> backend/services/tmdb.service.js           (integracao com API externa)

const express = require("express");
const router = express.Router();
const catalog = require("../controllers/catalog.controller");

// O catálogo é somente-leitura via TMDB. Apenas GET está disponível.
router.get("/", catalog.list);
router.get("/featured", catalog.featured);
router.get("/:id/trailer", catalog.trailer);

module.exports = router;
