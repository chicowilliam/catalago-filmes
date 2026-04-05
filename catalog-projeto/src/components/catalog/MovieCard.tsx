import { useRef, useState } from "react";
import { motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231e1e2e'/%3E%3Ctext x='150' y='225' font-size='16' fill='%23666' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3ESem%20imagem%3C/text%3E%3C/svg%3E";

interface MovieCardProps {
  item: CatalogItem;
  rating: number;
  onOpenModal: (item: CatalogItem) => void;
}

export function MovieCard({
  item,
  rating,
  onOpenModal,
}: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(item.image);
  const popDelayRef = useRef(Math.round(Math.random() * 140));
  const synopsis = item.synopsis ?? "";
  const truncatedSynopsis = synopsis.length > 117 ? synopsis.slice(0, 117) + "…" : synopsis;

  return (
    <motion.article
      className="movie-card"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      style={{ "--card-pop-delay": `${popDelayRef.current}ms` } as React.CSSProperties}
      aria-label={`Abrir detalhes de ${item.title}`}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={() => onOpenModal(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenModal(item);
        }
      }}
    >
      {/* ── Frente: poster + info (desaparece no hover) ── */}
      <div className="card-face-front">
        <div className="movie-media">
          <img
            className="movie-image"
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
          />
        </div>

        {/* Info abaixo do poster */}
        <div className="card-info">
          <h3 className="movie-title">{item.title}</h3>

          {rating > 0 && (
            <div className="star-row" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>
          )}

          <button
            type="button"
            className="movie-image-btn"
            onClick={(event) => {
              event.stopPropagation();
              onOpenModal(item);
            }}
            aria-label={`Ver detalhes de ${item.title}`}
          >
            ▶ Ver detalhes
          </button>
        </div>
      </div>

      {/* ── Verso: cobre o card inteiro no hover ── */}
      <div className="card-face-back" aria-hidden="true">
        <h3 className="card-back-title">{item.title}</h3>
        {(item.year || item.rating != null) && (
          <div className="card-back-meta">
            {item.year && <span className="card-back-year">{item.year}</span>}
            {item.rating != null && (
              <span className="card-back-tmdb-rating">⭐ {item.rating}</span>
            )}
          </div>
        )}
        {truncatedSynopsis && (
          <p className="card-back-synopsis">{truncatedSynopsis}</p>
        )}
        <span className="card-back-cta">Ver detalhes →</span>
      </div>
    </motion.article>
  );
}
