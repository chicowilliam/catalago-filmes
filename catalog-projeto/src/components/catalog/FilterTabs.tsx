import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATALOG_FILTERS } from "@/config/catalogFilters";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { CatalogType } from "@/types/catalog";

interface FilterTabsProps {
  activeType: CatalogType;
  onChange: (value: CatalogType) => void;
  username?: string;
  onLogout?: () => void;
}

export function FilterTabs({ activeType, onChange, username, onLogout }: FilterTabsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeFilter = CATALOG_FILTERS.find((filter) => filter.value === activeType) ?? CATALOG_FILTERS[0];

  useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    document.body.classList.add("mobile-menu-open");
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isMenuOpen]);

  function handleSelect(value: CatalogType) {
    onChange(value);
    setIsMenuOpen(false);
  }

  return (
    <div className="filter-nav-shell">
      <div className="filter-tabs filter-tabs-desktop" role="tablist" aria-label="Filtros do catálogo">
        {CATALOG_FILTERS.map((filter) => {
          const isActive = activeType === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`filter-btn${isActive ? " is-active" : ""}`}
              onClick={() => handleSelect(filter.value)}
            >
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

      <div ref={menuRef} className={`filter-menu-mobile${isMenuOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className={`filter-menu-toggle${isMenuOpen ? " is-open" : ""}`}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="filter-menu-toggle-copy">
            <span className="filter-menu-label">Navegar</span>
            <strong className="filter-menu-current">{activeFilter.label}</strong>
          </span>
          <span className="filter-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Fechar menu"
                className="filter-menu-backdrop"
                onClick={() => setIsMenuOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              />

              <motion.aside
                id={menuId}
                className="filter-menu-drawer"
                role="menu"
                aria-label="Navegação do catálogo"
                initial={{ x: "100%" }}
                animate={{ x: "0%" }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="filter-menu-user-top">
                  {username ? <span className="user-chip filter-menu-user-chip">{username}</span> : <span />}
                  <div className="filter-menu-user-actions">
                    <ThemeToggle />
                    {onLogout ? (
                      <button
                        type="button"
                        className="secondary-btn filter-menu-logout"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Sair
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="filter-menu-drawer-head">
                  <div className="filter-menu-drawer-copy">
                    <span className="filter-menu-label">Navegação</span>
                    <strong className="filter-menu-current">{activeFilter.label}</strong>
                  </div>

                  <button
                    type="button"
                    className="filter-menu-close"
                    aria-label="Fechar menu"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="filter-menu-list">
                  {CATALOG_FILTERS.map((filter) => {
                    const isActive = activeType === filter.value;
                    return (
                      <button
                        key={filter.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        className={`filter-menu-item${isActive ? " is-active" : ""}`}
                        onClick={() => handleSelect(filter.value)}
                      >
                        <span>{filter.label}</span>
                        {isActive ? <span className="filter-menu-item-mark">Atual</span> : null}
                      </button>
                    );
                  })}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
