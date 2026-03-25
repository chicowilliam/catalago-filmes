import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

interface SearchBarProps {
  open: boolean;
  defaultValue: string;
  onSearch: (value: string) => Promise<void>;
}

export function SearchBar({ open, defaultValue, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSearch(value.trim());
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="search-bar"
          className="search-animated-wrapper"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <form className="search-box" onSubmit={handleSubmit}>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Buscar..."
              className="search-input"
              aria-label="Buscar no catalogo"
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
