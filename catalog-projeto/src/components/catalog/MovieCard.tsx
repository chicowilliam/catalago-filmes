import { useState } from "react";
import { motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

// Placeholder exibido quando a imagem original do TMDB não carrega
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231e1e2e'/%3E%3Ctext x='150' y='225' font-size='16' fill='%23666' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3ESem%20imagem%3C/text%3E%3C/svg%3E";

interface MovieCardProps {
  item: CatalogItem;
  isFavorite: boolean;
  rating: number;
  onFavoriteToggle: (item: CatalogItem) => void;
  onOpenModal: (item: CatalogItem) => void;
}

export function MovieCard({
  item,
  isFavorite,
  rating,
  onFavoriteToggle,
  onOpenModal,
}: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(item.image);
  const typeLabel = item.type === "movie" ? "Filme" : "Série";

  return (
    <motion.article
      className="movie-card"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      style={{ transformOrigin: "center top" }}
      aria-label={item.title}
    >
      {/* ── Área do poster com face-swap ── */}
      <div className="movie-media">
        <span className="badge" aria-hidden="true">
          {typeLabel}
        </span>

        {/* Frente: o poster some no hover */}
        <div className="card-face-front">
          <img
            className="movie-image"
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
          />
        </div>

        {/* Verso: sinopse aparece no hover — apenas desktop */}
        <div className="card-face-back" aria-hidden="true">
          <span className="card-back-type">{typeLabel}</span>
          <h3 className="card-back-title">{item.title}</h3>
          {item.synopsis && (
            <p className="card-back-synopsis">{item.synopsis}</p>
          )}
          <button
            type="button"
            className="card-back-cta"
            onClick={() => onOpenModal(item)}
            tabIndex={-1}
          >
            ▶ Ver detalhes
          </button>
        </div>
      </div>

      {/* ── Informações abaixo do poster (sempre visíveis) ── */}
      <div className="card-info">
        <div className="card-info-top">
          <h3 className="movie-title">{item.title}</h3>
          <button
            type="button"
            className={`fav-btn${isFavorite ? " is-fav" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(item);
            }}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        {rating > 0 && (
          <div className="star-row" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
            {"★".repeat(rating)}{"☆".repeat(5 - rating)}
          </div>
        )}

        {/* Botão abrir modal acessível via teclado (complementa o card-face-back) */}
        <button
          type="button"
          className="movie-image-btn"
          onClick={() => onOpenModal(item)}
          aria-label={`Ver detalhes de ${item.title}`}
          style={{ fontSize: "0.78rem", color: "var(--text-soft)", marginTop: 2 }}
        >
          ▶ Ver detalhes
        </button>
      </div>
    </motion.article>
  );
}
