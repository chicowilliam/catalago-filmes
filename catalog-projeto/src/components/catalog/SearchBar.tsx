import { useState } from "react";
import type { FormEvent } from "react";

interface SearchBarProps {
  defaultValue: string;
  isLoading: boolean;
  onSearch: (value: string) => Promise<void>;
}

export function SearchBar({ defaultValue, isLoading, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSearch(value.trim());
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por titulo"
        className="text-input"
      />
      <button type="submit" className="secondary-btn" disabled={isLoading}>
        {isLoading ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
