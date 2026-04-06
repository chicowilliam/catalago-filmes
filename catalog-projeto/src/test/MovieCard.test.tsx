/**
 * Testes do componente MovieCard
 *
 * Cobre:
 *  - Renderização básica (título, tipo, sinopse)
 *  - Clique na imagem abre o modal
 *  - Estrelas aparecem quando há rating
 *  - Fallback de imagem quando a URL falha
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "@/components/catalog/MovieCard";
import type { CatalogItem } from "@/types/catalog";

// Mock do framer-motion para rodar em ambiente de teste (jsdom).
// Substitui `motion.article` por um <article> simples, sem animações.
// Nota: usa import dinâmico para evitar `require` e manter compatibilidade no build TS.
vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
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
        rating={0}
        onOpenModal={vi.fn()}
      />
    );
    // O título aparece em dois nós (card-info acessível + card-face-back aria-hidden)
    expect(screen.getAllByText("Inception")[0]).toBeInTheDocument();
  });

  it("deve chamar onOpenModal ao clicar na imagem", () => {
    const onOpenModal = vi.fn();
    render(
      <MovieCard
        item={mockItem}
        rating={0}
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
        rating={3}
        onOpenModal={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/avaliação: 3 de 5/i)).toBeInTheDocument();
  });

  it("deve exibir placeholder quando a imagem falha ao carregar", () => {
    render(
      <MovieCard
        item={mockItem}
        rating={0}
        onOpenModal={vi.fn()}
      />
    );
    const img = screen.getByAltText("Inception");
    // Simula falha de carregamento da imagem
    fireEvent.error(img);
    expect(img.getAttribute("src")).toContain("data:image/svg+xml");
  });
});
