import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

interface SearchBarProps {
  defaultValue: string;
  onSearch: (value: string) => Promise<void>;
  isLoading?: boolean;
}

export function SearchBar({ defaultValue, onSearch, isLoading }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Foca o input ao expandir
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [expanded]);

  // Busca automática ao digitar (debounce 350ms)
  useEffect(() => {
    if (!expanded) return;
    // só dispara se o valor mudou em relação ao que já está aplicado
    if (value.trim() === defaultValue.trim()) return;
    const timer = window.setTimeout(() => {
      void onSearch(value.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [value, expanded, onSearch, defaultValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSearch(value.trim());
  }

  function handleClear() {
    setValue("");
    void onSearch("");
    inputRef.current?.focus();
  }

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    if (value) {
      setValue("");
      void onSearch("");
    }
  }, [onSearch, value]);

  // Fecha e limpa ao clicar fora da busca
  useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      handleCollapse();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [expanded, handleCollapse]);

  return (
    <div className="search-toggle-wrap" ref={wrapRef}>
      <AnimatePresence initial={false} mode="wait">
        {expanded ? (
          <motion.form
            key="search-expanded"
            className={`search-box search-box-expanded${isLoading ? " is-loading" : ""}`}
            onSubmit={handleSubmit}
            initial={{ width: 36, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 36, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          >
            {/* ícone lupa dentro da barra */}
            <svg className="search-icon-inside" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Buscar filmes e séries..."
              className="search-input"
              aria-label="Buscar no catálogo"
            />
            {value.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClear}
                aria-label="Limpar busca"
              >×</button>
            )}
            <button
              type="button"
              className="search-collapse-btn"
              onClick={handleCollapse}
              aria-label="Fechar busca"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          </motion.form>
        ) : (
          <motion.button
            key="search-btn"
            type="button"
            className="search-toggle-btn"
            aria-label="Abrir busca"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
