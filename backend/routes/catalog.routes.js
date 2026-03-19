const express = require("express");
const router = express.Router();
const fs = require("fs");
const https = require("https");
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

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const catalogCache = new Map();

function isTmdbEnabled() {
  return process.env.CATALOG_SOURCE === "tmdb" && !!(process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_KEY);
}

function buildTmdbHeaders() {
  if (!process.env.TMDB_BEARER_TOKEN) {
    return {};
  }

  return {
    Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`
  };
}

function withTmdbApiKey(urlString) {
  if (!process.env.TMDB_API_KEY || process.env.TMDB_BEARER_TOKEN) {
    return urlString;
  }

  const url = new URL(urlString);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY);
  return url.toString();
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      withTmdbApiKey(url),
      {
        headers: buildTmdbHeaders()
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new AppError(`TMDB retornou status ${res.statusCode}`, 502, "TMDB_REQUEST_ERROR"));
          }

          try {
            return resolve(JSON.parse(body));
          } catch (error) {
            return reject(new AppError("Resposta invalida da TMDB", 502, "TMDB_PARSE_ERROR"));
          }
        });
      }
    );

    req.on("error", () => {
      reject(new AppError("Falha de rede ao consultar TMDB", 502, "TMDB_NETWORK_ERROR"));
    });

    req.end();
  });
}

function mapTmdbItemToCatalog(tmdbItem) {
  const isMovie = tmdbItem.media_type === "movie" || !!tmdbItem.title;
  const title = tmdbItem.title || tmdbItem.name || "Titulo indisponivel";
  const synopsis = tmdbItem.overview || "Sinopse indisponivel.";
  const image = tmdbItem.poster_path ? `${TMDB_IMAGE_BASE}${tmdbItem.poster_path}` : "";

  return {
    id: `tmdb-${tmdbItem.id}`,
    title,
    type: isMovie ? "movie" : "series",
    image,
    synopsis,
    trailerId: ""
  };
}

function getCache(cacheKey) {
  const cached = catalogCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > CATALOG_CACHE_TTL_MS) {
    catalogCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCache(cacheKey, data) {
  catalogCache.set(cacheKey, {
    timestamp: Date.now(),
    data
  });
}

async function fetchCatalogFromTmdb(type, search) {
  const safeSearch = (search || "").trim();
  const cacheKey = `${type || "all"}::${safeSearch.toLowerCase()}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  let items = [];

  if (safeSearch) {
    const multiSearchUrl = `${TMDB_BASE_URL}/search/multi?language=pt-BR&query=${encodeURIComponent(safeSearch)}&include_adult=false&page=1`;
    const response = await httpGetJson(multiSearchUrl);
    items = Array.isArray(response.results) ? response.results : [];
  } else {
    const movieUrl = `${TMDB_BASE_URL}/trending/movie/week?language=pt-BR&page=1`;
    const tvUrl = `${TMDB_BASE_URL}/trending/tv/week?language=pt-BR&page=1`;
    const [movieRes, tvRes] = await Promise.all([httpGetJson(movieUrl), httpGetJson(tvUrl)]);
    const movies = Array.isArray(movieRes.results) ? movieRes.results.map((item) => ({ ...item, media_type: "movie" })) : [];
    const series = Array.isArray(tvRes.results) ? tvRes.results.map((item) => ({ ...item, media_type: "tv" })) : [];
    items = movies.concat(series);
  }

  let mapped = items
    .filter((item) => item && (item.media_type === "movie" || item.media_type === "tv" || item.title || item.name))
    .map(mapTmdbItemToCatalog)
    .filter((item) => item.image);

  if (type && type !== "all") {
    const normalizedType = type === "series" ? "series" : "movie";
    mapped = mapped.filter((item) => item.type === normalizedType);
  }

  setCache(cacheKey, mapped);
  return mapped;
}

/* =========================
   GET — LISTAR
========================= */
router.get("/", async (req, res, next) => {
  try {
    const { type, search } = req.query;

    if (isTmdbEnabled()) {
      const externalCatalog = await fetchCatalogFromTmdb(type, search);

      return res.json({
        status: "success",
        source: "tmdb",
        data: externalCatalog,
        count: externalCatalog.length
      });
    }

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
      source: "local",
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