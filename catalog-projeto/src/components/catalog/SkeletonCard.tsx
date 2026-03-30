/** Placeholder animado exibido enquanto o catálogo carrega. */
export function SkeletonCard() {
  return (
    <div className="movie-card skeleton-card" aria-hidden="true">
      <div className="skeleton-media" />
      <div className="skeleton-title" />
    </div>
  );
}
