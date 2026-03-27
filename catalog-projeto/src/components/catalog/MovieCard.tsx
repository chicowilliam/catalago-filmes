import { motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

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
  return (
    <motion.article
      layout
      className="movie-card"
      variants={cardVariants}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      style={{ transformOrigin: "center top" }}
    >
      <button
        type="button"
        className="movie-image-btn"
        onClick={() => onOpenModal(item)}
        aria-label={`Ver detalhes de ${item.title}`}
      >
        <img
          className="movie-image"
          src={item.image}
          alt={item.title}
          loading="lazy"
        />
      </button>

      <div className="movie-info">
        <div className="movie-header">
          <h3 className="movie-title">{item.title}</h3>
          <button
            type="button"
            className={`fav-btn${isFavorite ? " is-fav" : ""}`}
            onClick={() => onFavoriteToggle(item)}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        <p className="movie-type">{item.type === "movie" ? "Filme" : "Série"}</p>
        <p className="movie-synopsis">{item.synopsis}</p>

        {rating > 0 && (
          <div className="star-row" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
          </div>
        )}
      </div>
    </motion.article>
  );
}
