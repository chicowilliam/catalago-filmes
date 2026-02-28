const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

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
   POST — CRIAR
========================= */
router.post("/", isAdmin, (req, res) => {
  const catalog = readDB();

  const newItem = {
    id: Date.now(),
    title: req.body.title,
    type: req.body.type,
    image: req.body.image,
    trailerId: req.body.trailerId,
    synopsis: req.body.synopsis
  };

  catalog.push(newItem);
  saveDB(catalog);

  res.status(201).json(newItem);
});

/* =========================
   PUT — EDITAR
========================= */
router.put("/:id", isAdmin, (req, res) => {
  const catalog = readDB();
  const id = Number(req.params.id);

  const index = catalog.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Item não encontrado" });
  }

  catalog[index] = {
    ...catalog[index],
    title: req.body.title,
    type: req.body.type,
    image: req.body.image,
    trailerId: req.body.trailerId,
    synopsis: req.body.synopsis
  };

  saveDB(catalog);
  res.json(catalog[index]);
});

/* =========================
   DELETE — REMOVER
========================= */
router.delete("/:id", isAdmin, (req, res) => {
  const catalog = readDB();
  const id = Number(req.params.id);

  const newCatalog = catalog.filter(item => item.id !== id);

  if (newCatalog.length === catalog.length) {
    return res.status(404).json({ message: "Item não encontrado" });
  }

  saveDB(newCatalog);
  res.status(204).end();
});

module.exports = router;