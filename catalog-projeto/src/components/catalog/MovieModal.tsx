import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

interface MovieModalProps {
  item: CatalogItem | null;
  rating: number;
  onClose: () => void;
  onRate: (itemId: number, stars: number) => void;
}

export function MovieModal({ item, rating, onClose, onRate }: MovieModalProps) {
  useEffect(() => {
    if (!item) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const scrollRoot = document.querySelector(".main-container") as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousScrollOverflow = scrollRoot?.style.overflow ?? "";

    document.body.style.overflow = "hidden";
    if (scrollRoot) {
      scrollRoot.style.overflow = "hidden";
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (scrollRoot) {
        scrollRoot.style.overflow = previousScrollOverflow;
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${item.title}`}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              ✕
            </button>

            <h2 className="modal-title">{item.title}</h2>
            <div className="modal-meta">
              <p className="modal-type">{item.type === "movie" ? "Filme" : "Série"}</p>
              {item.year && <span className="modal-meta-year">{item.year}</span>}
              {item.rating != null && (
                <span className="modal-meta-tmdb-rating">⭐ {item.rating} <span className="modal-meta-tmdb-label">TMDB</span></span>
              )}
            </div>
            <p className="modal-synopsis">{item.synopsis}</p>

            {item.trailerId && (
              <div className="modal-trailer">
                <iframe
                  src={`https://www.youtube.com/embed/${item.trailerId}`}
                  title={`Trailer de ${item.title}`}
                  allowFullScreen
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            )}

            <div className="modal-rating">
              <p className="modal-rating-label">Sua nota:</p>
              <div className="star-selector" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn${rating >= star ? " is-filled" : ""}`}
                    onClick={() => onRate(item.id, star)}
                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                  >
                    {rating >= star ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
