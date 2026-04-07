import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = "(max-width: 640px)";

export function FeaturedSkeleton() {
  const [itemCount, setItemCount] = useState(() => {
    if (typeof window === "undefined") return 4;
    return window.matchMedia(MOBILE_BREAKPOINT).matches ? 3 : 4;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

    function syncItemCount() {
      setItemCount(mediaQuery.matches ? 3 : 4);
    }

    syncItemCount();
    mediaQuery.addEventListener("change", syncItemCount);

    return () => mediaQuery.removeEventListener("change", syncItemCount);
  }, []);

  return (
    <div className="hero-panel">
      <section className="featured-compact-shell featured-skeleton-shell" aria-hidden="true">
        <div className="featured-compact-header">
          <div className="skeleton-line featured-skeleton-title" />
        </div>
        <div className="featured-compact-grid">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="featured-compact-item">
              <div className="featured-compact-card-btn featured-skeleton-card" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
