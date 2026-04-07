import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useLanguage } from "@/i18n/LanguageContext";
import type { CatalogItem } from "@/types/catalog";

const MOBILE_BREAKPOINT = "(max-width: 640px)";
const DESKTOP_FEATURED_ITEMS = 4;
const MOBILE_FEATURED_ITEMS = 3;
const FEATURED_ROTATION_MS = 15000;

interface FeaturedSliderProps {
  items: CatalogItem[];
  onOpenModal: (item: CatalogItem) => void;
}

export function FeaturedSlider({ items, onOpenModal }: FeaturedSliderProps) {
  const [rotationIndex, setRotationIndex] = useState(0);
  const { text } = useLanguage();
  const [maxFeaturedItems, setMaxFeaturedItems] = useState(() => {
    if (typeof window === "undefined") return DESKTOP_FEATURED_ITEMS;
    return window.matchMedia(MOBILE_BREAKPOINT).matches ? MOBILE_FEATURED_ITEMS : DESKTOP_FEATURED_ITEMS;
  });

  const itemsWithImage = useMemo(
    () => items.filter((item) => item.image && !item.image.startsWith("data:")),
    [items]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

    function syncFeaturedCount() {
      setMaxFeaturedItems(mediaQuery.matches ? MOBILE_FEATURED_ITEMS : DESKTOP_FEATURED_ITEMS);
    }

    syncFeaturedCount();
    mediaQuery.addEventListener("change", syncFeaturedCount);

    return () => mediaQuery.removeEventListener("change", syncFeaturedCount);
  }, []);

  const featuredItems = useMemo(() => {
    if (itemsWithImage.length <= maxFeaturedItems) {
      return itemsWithImage;
    }

    return Array.from({ length: maxFeaturedItems }, (_, offset) => {
      const index = (rotationIndex + offset) % itemsWithImage.length;
      return itemsWithImage[index];
    });
  }, [itemsWithImage, maxFeaturedItems, rotationIndex]);

  useEffect(() => {
    if (itemsWithImage.length <= maxFeaturedItems) return undefined;

    const timer = window.setInterval(() => {
      setRotationIndex((currentIndex) => (currentIndex + maxFeaturedItems) % itemsWithImage.length);
    }, FEATURED_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [itemsWithImage, maxFeaturedItems]);

  if (featuredItems.length === 0) return null;

  return (
    <div className="hero-panel">
      <section className="featured-card featured-compact-shell" aria-label={text.featuredCatalogLabel}>
        <div className="featured-compact-header">
          <h2 className="featured-compact-title">{text.featuredTitle}</h2>
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
                aria-label={text.openDetailsOf(item.title)}
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
                  <span className="featured-tag">{item.type === "movie" ? text.movieLabel : text.seriesLabel}</span>
                  <h3 className="featured-compact-item-title">{item.title}</h3>
                  <div className="featured-compact-meta">
                    {item.year && <span className="featured-meta-year">{item.year}</span>}
                    {item.rating != null && <span className="featured-meta-rating">⭐ {item.rating}</span>}
                  </div>
                  <span className="featured-compact-cta">{text.viewDetails}</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
