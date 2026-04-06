import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

const MAX_FEATURED_ITEMS = 4;
const FEATURED_ROTATION_MS = 15000;

interface FeaturedSliderProps {
  items: CatalogItem[];
  onOpenModal: (item: CatalogItem) => void;
}

export function FeaturedSlider({ items, onOpenModal }: FeaturedSliderProps) {
  const [rotationIndex, setRotationIndex] = useState(0);

  const itemsWithImage = useMemo(
    () => items.filter((item) => item.image && !item.image.startsWith("data:")),
    [items]
  );

  const featuredItems = useMemo(() => {
    if (itemsWithImage.length <= MAX_FEATURED_ITEMS) {
      return itemsWithImage;
    }

    return Array.from({ length: MAX_FEATURED_ITEMS }, (_, offset) => {
      const index = (rotationIndex + offset) % itemsWithImage.length;
      return itemsWithImage[index];
    });
  }, [itemsWithImage, rotationIndex]);

  useEffect(() => {
    if (itemsWithImage.length <= MAX_FEATURED_ITEMS) return undefined;

    const timer = window.setInterval(() => {
      setRotationIndex((currentIndex) => (currentIndex + MAX_FEATURED_ITEMS) % itemsWithImage.length);
    }, FEATURED_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [itemsWithImage]);

  if (featuredItems.length === 0) return null;

  return (
    <div className="hero-panel">
      <section className="featured-card featured-compact-shell" aria-label="Sugestões do catálogo">
        <div className="featured-compact-header">
          <h2 className="featured-compact-title">Sugestões especialmente para você</h2>
        </div>

        <div className="featured-compact-grid">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="featured-compact-item"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, delay: index * 0.025, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <button
                type="button"
                className="featured-compact-card-btn"
                onClick={() => onOpenModal(item)}
                aria-label={`Abrir destaque: ${item.title}`}
              >
                <img
                  src={item.backdrop || item.image}
                  alt={item.title}
                  className="featured-compact-image"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
                <div className="featured-compact-overlay" aria-hidden="true" />
                <div className="featured-compact-content">
                  <span className="featured-tag">{item.type === "movie" ? "Filme" : "Série"}</span>
                  <h3 className="featured-compact-item-title">{item.title}</h3>
                  <div className="featured-compact-meta">
                    {item.year && <span className="featured-meta-year">{item.year}</span>}
                    {item.rating != null && <span className="featured-meta-rating">⭐ {item.rating}</span>}
                  </div>
                  <span className="featured-compact-cta">Ver detalhes</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
