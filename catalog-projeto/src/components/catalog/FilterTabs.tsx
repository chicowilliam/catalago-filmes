import { motion } from "framer-motion";
import type { CatalogType } from "@/types/catalog";

const FILTERS: Array<{ value: CatalogType; label: string; icon: string }> = [
  { value: "all",       label: "Início",     icon: "🏠" },
  { value: "movie",     label: "Filmes",     icon: "🎬" },
  { value: "series",    label: "Séries",     icon: "📺" },
  { value: "favorites", label: "Favoritos",  icon: "❤️" },
  { value: "about",     label: "Sobre",      icon: "👤" },
];

interface FilterTabsProps {
  activeType: CatalogType;
  onChange: (value: CatalogType) => void;
}

export function FilterTabs({ activeType, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Filtros do catálogo">
      {FILTERS.map((filter) => {
        const isActive = activeType === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`filter-btn${isActive ? " is-active" : ""}`}
            onClick={() => onChange(filter.value)}
          >
            <span className="filter-btn-icon" aria-hidden="true">{filter.icon}</span>
            {filter.label}
            {isActive && (
              <motion.div
                className="filter-underline"
                layoutId="filter-underline"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
