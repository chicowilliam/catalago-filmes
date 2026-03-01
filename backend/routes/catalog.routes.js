const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { validateCreateMovie } = require("../validators/auth.validator");
const AppError = require("../utils/AppError"); // ← ADICIONE
const isAdmin = require("../middlewares/isAdmin");

const dbPath = path.join(__dirname, "../data/catalog.json");

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  } catch (err) {
    throw new AppError(
      "Erro ao ler banco de dados",
      500,
      "DATABASE_READ_ERROR"
    );
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new AppError(
      "Erro ao salvar no banco de dados",
      500,
      "DATABASE_WRITE_ERROR"
    );
  }
}

/* =========================
   GET — LISTAR
========================= */
router.get("/", (req, res, next) => {
  try {
    const { type, search } = req.query;
    let catalog = readDB();

    if (type && type !== "all") {
      catalog = catalog.filter(item => item.type === type);
    }

    if (search) {
      catalog = catalog.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      status: "success",
      data: catalog,
      count: catalog.length
    });
  } catch (err) {
    next(err);
  }
});

/* =========================
   POST — CRIAR
========================= */
router.post("/", isAdmin, (req, res, next) => {
  try {
    const { error, value } = validateCreateMovie(req.body);

    if (error) {
      const messages = error.details.map(detail => detail.message);
      throw new AppError(
        messages.join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const catalog = readDB();

    const newItem = {
      id: Date.now(),
      title: value.title,
      type: value.type,
      image: value.image,
      synopsis: value.synopsis,
      trailerId: value.trailerId || "",
      createdAt: new Date().toISOString()
    };

    catalog.push(newItem);
    saveDB(catalog);

    res.status(201).json({
      status: "success",
      message: "Item criado com sucesso",
      item: newItem
    });
  } catch (err) {
    next(err);
  }
});

/* =========================
   PUT — EDITAR
========================= */
router.put("/:id", isAdmin, (req, res, next) => {
  try {
    const { error, value } = validateCreateMovie(req.body);

    if (error) {
      const messages = error.details.map(detail => detail.message);
      throw new AppError(
        messages.join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const catalog = readDB();
    const item = catalog.find(i => i.id == req.params.id);

    if (!item) {
      throw new AppError(
        "Item não encontrado",
        404,
        "ITEM_NOT_FOUND"
      );
    }

    item.title = value.title;
    item.type = value.type;
    item.image = value.image;
    item.synopsis = value.synopsis;
    item.trailerId = value.trailerId || "";
    item.updatedAt = new Date().toISOString();

    saveDB(catalog);

    res.json({
      status: "success",
      message: "Item atualizado com sucesso",
      item
    });
  } catch (err) {
    next(err);
  }
});

/* =========================
   DELETE — DELETAR
========================= */
router.delete("/:id", isAdmin, (req, res, next) => {
  try {
    const catalog = readDB();
    const index = catalog.findIndex(i => i.id == req.params.id);

    if (index === -1) {
      throw new AppError(
        "Item não encontrado",
        404,
        "ITEM_NOT_FOUND"
      );
    }

    const deletedItem = catalog.splice(index, 1);
    saveDB(catalog);

    res.json({
      status: "success",
      message: "Item deletado com sucesso",
      item: deletedItem[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;