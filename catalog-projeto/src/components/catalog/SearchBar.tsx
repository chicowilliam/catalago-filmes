import { useState } from "react";
import type { FormEvent } from "react";

interface SearchBarProps {
  defaultValue: string;
  isLoading: boolean;
  meta: string;
  onSearch: (value: string) => Promise<void>;
}

export function SearchBar({ defaultValue, isLoading, meta, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSearch(value.trim());
  }

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por titulo..."
        className="search-input"
      />
      <p className={`search-meta${isLoading ? " is-loading" : ""}`} aria-live="polite">
        {meta}
      </p>
    </form>
  );
}
