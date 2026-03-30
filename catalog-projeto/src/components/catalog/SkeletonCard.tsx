/** Placeholder animado exibido enquanto o catálogo carrega. */
export function SkeletonCard() {
  return (
    <div className="movie-card skeleton-card" aria-hidden="true">
      <div className="movie-media">
        <div className="skeleton-media" />
      </div>
      <div className="card-info">
        <div className="skeleton-line skeleton-line-title" />
        <div className="skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}
