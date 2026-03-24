import type { CatalogType } from "@/types/catalog";

const FILTERS: Array<{ value: CatalogType; label: string }> = [
  { value: "all", label: "Início" },
  { value: "movie", label: "Filmes" },
  { value: "series", label: "Séries" },
  { value: "favorites", label: "Favoritos" },
  { value: "about", label: "Sobre" },
];

interface FilterTabsProps {
  activeType: CatalogType;
  onChange: (value: CatalogType) => void;
}

export function FilterTabs({ activeType, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Filtros do catalogo">
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
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
