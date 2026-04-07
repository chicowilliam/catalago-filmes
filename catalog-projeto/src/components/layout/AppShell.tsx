import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface AppShellProps {
  children: ReactNode;
  username?: string;
  onLogout: () => void;
  nav?: ReactNode;
  searchSlot?: ReactNode;
}

export function AppShell({ children, username, onLogout, nav, searchSlot }: AppShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const [isDesktopNavVisible, setIsDesktopNavVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    function isDesktopViewport() {
      return window.matchMedia("(min-width: 721px)").matches;
    }

    function handleScroll() {
      const scrollHost = containerRef.current;
      if (!scrollHost) return;

      if (!isDesktopViewport()) {
        setIsDesktopNavVisible(true);
        return;
      }

      const currentScrollTop = scrollHost.scrollTop;
      const delta = currentScrollTop - lastScrollTopRef.current;

      if (currentScrollTop <= 18 || delta < -7) {
        setIsDesktopNavVisible(true);
      } else if (delta > 7) {
        setIsDesktopNavVisible(false);
      }

      lastScrollTopRef.current = currentScrollTop;
    }

    function handleMouseMove(event: MouseEvent) {
      if (!isDesktopViewport()) return;
      // Mostrar novamente ao levar o cursor para o topo da viewport.
      if (event.clientY <= 78) {
        setIsDesktopNavVisible(true);
      }
    }

    function handleResize() {
      if (!isDesktopViewport()) {
        setIsDesktopNavVisible(true);
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="main-container" ref={containerRef}>
      <div className="parallax-container" aria-hidden="true">
        <div className="parallax-glow parallax-glow-primary" />
        <div className="parallax-glow parallax-glow-secondary" />
        <div className="parallax-grid" />
      </div>

      <div className="content-container">
        <header className={`app-header ${isDesktopNavVisible ? "is-visible" : "is-hidden"}`}>
          <div className="header-inner">
            <div className="header-brand">
              <p className="brand-kicker">Streaming Portfolio</p>
              <h1 className="brand-title">Catalogo X</h1>
            </div>

            {nav && (
              <nav className="header-nav">
                {nav}
              </nav>
            )}

            <div className="header-actions">
              {searchSlot}
              {username ? <span className="user-chip">{username}</span> : null}
              <ThemeToggle />
              <button type="button" className="secondary-btn" onClick={onLogout}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="app-shell">
          <main className="app-main">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
