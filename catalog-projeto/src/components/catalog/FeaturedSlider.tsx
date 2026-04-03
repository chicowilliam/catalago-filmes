import { motion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

const MAX_FEATURED_ITEMS = 4;

interface FeaturedSliderProps {
  items: CatalogItem[];
  onOpenModal: (item: CatalogItem) => void;
}

export function FeaturedSlider({ items, onOpenModal }: FeaturedSliderProps) {
  const featuredItems = items
    .filter((i) => i.image && !i.image.startsWith("data:"))
    .slice(0, MAX_FEATURED_ITEMS);

  if (featuredItems.length === 0) return null;

  return (
    <div className="hero-panel">
      <section className="featured-card featured-compact-shell" aria-label="Destaques do catálogo">
        <div className="featured-compact-header">
          <p className="featured-compact-kicker">Em destaque</p>
          <h2 className="featured-compact-title">Escolhas da semana</h2>
        </div>

        <div className="featured-compact-grid">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="featured-compact-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <button
                type="button"
                className="featured-compact-card-btn"
                onClick={() => onOpenModal(item)}
                aria-label={`Abrir destaque: ${item.title}`}
              >
                <img src={item.image} alt={item.title} className="featured-compact-image" loading="lazy" />
                <div className="featured-compact-overlay" aria-hidden="true" />
                <div className="featured-compact-content">
                  <span className="featured-tag">{item.type === "movie" ? "Filme" : "Série"}</span>
                  <h3 className="featured-compact-item-title">{item.title}</h3>
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
