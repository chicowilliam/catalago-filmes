import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

const SLIDE_DURATION_MS = 4500;
const MAX_SLIDES = 6;

interface FeaturedSliderProps {
  items: CatalogItem[];
  onOpenModal: (item: CatalogItem) => void;
}

export function FeaturedSlider({ items, onOpenModal }: FeaturedSliderProps) {
  // Pega os primeiros itens que têm imagem real (não SVG placeholder)
  const slides = items
    .filter((i) => i.image && !i.image.startsWith("data:"))
    .slice(0, MAX_SLIDES);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (nextIndex: number, dir: number) => {
      setDirection(dir);
      setCurrentIndex(nextIndex);
    },
    []
  );

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIdx = (prev + 1) % slides.length;
      setDirection(1);
      return nextIdx;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIdx = (prev - 1 + slides.length) % slides.length;
      setDirection(-1);
      return prevIdx;
    });
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(next, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [next, paused, slides.length]);

  // Reseta o índice quando os slides mudam (ex: nova busca)
  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[currentIndex];

  const slideVariants = {
    enter: (d: number) => ({
      opacity: 0.3,
      x: d > 0 ? "22%" : "-22%",
      filter: "blur(4px)",
    }),
    center: {
      opacity: 1,
      x: "0%",
      filter: "blur(0px)",
    },
    exit: (d: number) => ({
      opacity: 0,
      x: d > 0 ? "-16%" : "16%",
      filter: "blur(3px)",
    }),
  };

  return (
    <div className="hero-panel">
      <div
        className="featured-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Camada do slider */}
        <div className="featured-slider" aria-live="polite" aria-atomic="true">
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={current.id}
              className="featured-slide"
              style={
                { "--slide-image": `url("${current.image}")` } as React.CSSProperties
              }
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Fundo embaçado com drift */}
              <div className="featured-bg-blur" aria-hidden="true" />

              {/* Conteúdo do slide */}
              <motion.div
                className="featured-motion-content"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="featured-tag">
                  {current.type === "movie" ? "🎬 Filme" : "📺 Série"}
                </span>
                <h2 className="featured-title">{current.title}</h2>
                {current.synopsis && (
                  <p className="featured-synopsis">{current.synopsis}</p>
                )}
                <button
                  type="button"
                  className="featured-cta"
                  onClick={() => onOpenModal(current)}
                >
                  ▶ Assistir agora
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controles — só exibidos quando há mais de 1 slide */}
        {slides.length > 1 && (
          <div className="slider-controls">
            <button
              type="button"
              className="slider-btn"
              onClick={prev}
              aria-label="Slide anterior"
            >
              ‹
            </button>

            <div className="slider-dots" role="tablist" aria-label="Slides do destaque">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  className={`slider-dot${i === currentIndex ? " is-active" : ""}`}
                  onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                  aria-label={`Slide ${i + 1}: ${slide.title}`}
                  aria-selected={i === currentIndex}
                />
              ))}
            </div>

            <button
              type="button"
              className="slider-btn"
              onClick={next}
              aria-label="Próximo slide"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
