import { useEffect, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";

import { getTrailer } from "@/services/catalogService";
import { ToastHost } from "@/components/layout/ToastHost";
import { useToast } from "@/hooks/useToast";
import type { CatalogItem } from "@/types/catalog";

interface MovieModalProps {
  item: CatalogItem | null;
  rating: number;
  isFavorite: boolean;
  onClose: () => void;
  onRate: (itemId: number, stars: number) => void;
  onFavoriteToggle: (item: CatalogItem) => void;
}

const modalContentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.02,
      staggerChildren: 0.025,
    },
  },
};

const modalItemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
    },
  },
};

export function MovieModal({ item, rating, isFavorite, onClose, onRate, onFavoriteToggle }: MovieModalProps) {
  const [trailerId, setTrailerId] = useState<string | null>(item?.trailerId ?? null);
  const { toasts, pushToast, removeToast } = useToast();

  function handleRateInsideModal(stars: number) {
    if (!item) return;
    onRate(item.id, stars);
    pushToast(`Voce avaliou ${item.title} com ${stars} estrela${stars > 1 ? "s" : ""}.`, "info");
  }

  // Busca trailer sob demanda quando o modal abre
  useEffect(() => {
    if (!item) {
      setTrailerId(null);
      return;
    }
    // Se o item já veio com trailerId, usa diretamente
    if (item.trailerId) {
      setTrailerId(item.trailerId);
      return;
    }
    // Senão, busca lazy
    setTrailerId(null);
    let cancelled = false;
    void getTrailer({ id: item.id, type: item.type }).then((id) => {
      if (!cancelled) setTrailerId(id);
    });
    return () => { cancelled = true; };
  }, [item]);

  useEffect(() => {
    if (!item) {
      document.body.classList.remove("modal-open");
      return;
    }

    document.body.classList.add("modal-open");

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
      document.body.classList.remove("modal-open");
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
          transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={onClose}
        >
          <motion.div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${item.title}`}
            initial={{ scale: 0.995, opacity: 0, y: 3 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.995, opacity: 0, y: 3 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              className={`favorite-btn modal-favorite-btn ${isFavorite ? "favorited" : "not-favorited"}`}
              onClick={() => onFavoriteToggle(item)}
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={isFavorite}
              variants={modalItemVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="heart-icon"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </motion.button>

            <motion.button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Fechar modal"
              variants={modalItemVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              ✕
            </motion.button>

            <motion.div variants={modalContentVariants} initial="hidden" animate="show" exit="hidden">
              <motion.h2 className="modal-title" variants={modalItemVariants}>{item.title}</motion.h2>
              <motion.div className="modal-meta" variants={modalItemVariants}>
                <p className="modal-type">{item.type === "movie" ? "Filme" : "Série"}</p>
                {item.year && <span className="modal-meta-year">{item.year}</span>}
                {item.rating != null && (
                  <span className="modal-meta-tmdb-rating">⭐ {item.rating} <span className="modal-meta-tmdb-label">TMDB</span></span>
                )}
              </motion.div>
              <motion.p className="modal-synopsis" variants={modalItemVariants}>{item.synopsis}</motion.p>

              {trailerId ? (
                <motion.div className="modal-trailer" variants={modalItemVariants}>
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerId}`}
                    title={`Trailer de ${item.title}`}
                    allowFullScreen
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
                </motion.div>
              ) : trailerId === null && item.id ? (
                <motion.div className="modal-trailer-loading" aria-label="Carregando trailer..." variants={modalItemVariants} />
              ) : null}

              <motion.div className="modal-rating" variants={modalItemVariants}>
                <p className="modal-rating-label">Sua nota:</p>
                <div className="star-selector" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn${rating >= star ? " is-filled" : ""}`}
                      onClick={() => handleRateInsideModal(star)}
                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    >
                      {rating >= star ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <ToastHost toasts={toasts} onDismiss={removeToast} className="toast-host-modal" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
