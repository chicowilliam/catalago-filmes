// backend/routes/catalog.routes.js
//
// Este arquivo só registra as rotas.
// Toda a lógica foi movida para:
//   -> backend/controllers/catalog.controller.js  (HTTP)
//   -> backend/services/catalog.service.js        (regras de negocio)
//   -> backend/repositories/catalog.repository.js (acesso a dados)

const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin");
const catalog = require("../controllers/catalog.controller");

router.get("/",       catalog.list);
router.post("/",      isAdmin, catalog.create);
router.put("/:id",    isAdmin, catalog.update);
router.delete("/:id", isAdmin, catalog.remove);

module.exports = router;
