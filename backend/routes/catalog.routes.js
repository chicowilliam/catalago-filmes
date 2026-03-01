const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { validateCreateMovie } = require("../validators/auth.validator"); // ← ADICIONE

const isAdmin = require("../middlewares/isAdmin");

const dbPath = path.join(__dirname, "../data/catalog.json");

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

/* =========================
   GET — LISTAR
========================= */
router.get("/", (req, res) => {
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

  res.json(catalog);
});

/* =========================
   POST — CRIAR COM VALIDAÇÃO ✅
========================= */
router.post("/", isAdmin, (req, res) => {
  // ← VALIDAR OS DADOS PRIMEIRO
  const { error, value } = validateCreateMovie(req.body);

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ 
      message: "Dados inválidos",
      errors: messages 
    });
  }

  const catalog = readDB();

  const newItem = {
    id: Date.now(),
    title: value.title,           // ← Use dados validados
    type: value.type,
    image: value.image,
    synopsis: value.synopsis,
    trailerId: value.trailerId || "",
    createdAt: new Date().toISOString()
  };

  catalog.push(newItem);
  saveDB(catalog);

  res.status(201).json({ 
    message: "Item created successfully",
    item: newItem 
  });
});

/* =========================
   PUT — EDITAR (SE EXISTIR)
========================= */
router.put("/:id", isAdmin, (req, res) => {
  const { error, value } = validateCreateMovie(req.body);

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ 
      message: "Dados inválidos",
      errors: messages 
    });
  }

  const catalog = readDB();
  const item = catalog.find(i => i.id == req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  item.title = value.title;
  item.type = value.type;
  item.image = value.image;
  item.synopsis = value.synopsis;
  item.trailerId = value.trailerId || "";
  item.updatedAt = new Date().toISOString();

  saveDB(catalog);

  res.json({ 
    message: "Item updated successfully",
    item 
  });
});

/* =========================
   DELETE — DELETAR
========================= */
router.delete("/:id", isAdmin, (req, res) => {
  const catalog = readDB();
  const index = catalog.findIndex(i => i.id == req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Item not found" });
  }

  const deletedItem = catalog.splice(index, 1);
  saveDB(catalog);

  res.json({ 
    message: "Item deleted successfully",
    item: deletedItem[0]
  });
});

module.exports = router;