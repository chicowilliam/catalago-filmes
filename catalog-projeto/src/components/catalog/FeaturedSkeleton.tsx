export function FeaturedSkeleton() {
  return (
    <div className="hero-panel">
      <section className="featured-card featured-compact-shell featured-skeleton-shell" aria-hidden="true">
        <div className="featured-compact-header">
          <div className="skeleton-line featured-skeleton-title" />
        </div>
        <div className="featured-compact-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="featured-compact-item">
              <div className="featured-compact-card-btn featured-skeleton-card" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
