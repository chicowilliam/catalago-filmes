/**
 * Testes do componente MovieCard
 *
 * Cobre:
 *  - Renderização básica (título, tipo, sinopse)
 *  - Clique na imagem abre o modal
 *  - Estrelas aparecem quando há rating
 *  - Fallback de imagem quando a URL falha
 *  - Botão de favorito chama o callback correto
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "@/components/catalog/MovieCard";
import type { CatalogItem } from "@/types/catalog";

// Mock do framer-motion para rodar em ambiente de teste (jsdom).
// Substitui `motion.article` por um <article> simples, sem animações.
// Nota: usa require() síncrono dentro do vi.mock, padrão suportado pelo Vitest.
vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { createElement } = require("react") as any;
  return {
    motion: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      article: ({ children, ...props }: any) => createElement("article", props, children),
    },
  };
});

const mockItem: CatalogItem = {
  id: 1,
  title: "Inception",
  image: "https://image.tmdb.org/t/p/w500/test.jpg",
  type: "movie",
  synopsis: "Um ladrão que rouba segredos corporativos através de sonhos.",
  trailerId: "abc123",
};

describe("MovieCard", () => {
  it("deve renderizar o título do filme", () => {
    render(
      <MovieCard
        item={mockItem}
        isFavorite={false}
        rating={0}
        onFavoriteToggle={vi.fn()}
        onOpenModal={vi.fn()}
      />
    );
    expect(screen.getByText("Inception")).toBeInTheDocument();
  });

  it("deve chamar onOpenModal ao clicar na imagem", () => {
    const onOpenModal = vi.fn();
    render(
      <MovieCard
        item={mockItem}
        isFavorite={false}
        rating={0}
        onFavoriteToggle={vi.fn()}
        onOpenModal={onOpenModal}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /ver detalhes/i }));
    expect(onOpenModal).toHaveBeenCalledWith(mockItem);
  });

  it("deve exibir estrelas quando há rating", () => {
    render(
      <MovieCard
        item={mockItem}
        isFavorite={false}
        rating={3}
        onFavoriteToggle={vi.fn()}
        onOpenModal={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/avaliação: 3 de 5/i)).toBeInTheDocument();
  });

  it("deve exibir placeholder quando a imagem falha ao carregar", () => {
    render(
      <MovieCard
        item={mockItem}
        isFavorite={false}
        rating={0}
        onFavoriteToggle={vi.fn()}
        onOpenModal={vi.fn()}
      />
    );
    const img = screen.getByAltText("Inception");
    // Simula falha de carregamento da imagem
    fireEvent.error(img);
    expect(img.getAttribute("src")).toContain("data:image/svg+xml");
  });

  it("deve chamar onFavoriteToggle ao clicar no botão de favorito", () => {
    const onFavoriteToggle = vi.fn();
    render(
      <MovieCard
        item={mockItem}
        isFavorite={false}
        rating={0}
        onFavoriteToggle={onFavoriteToggle}
        onOpenModal={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /adicionar aos favoritos/i }));
    expect(onFavoriteToggle).toHaveBeenCalledWith(mockItem);
  });
});
