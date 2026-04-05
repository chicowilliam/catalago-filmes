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
  return (
    <div className="main-container">
      <div className="parallax-container" aria-hidden="true">
        <div className="parallax-glow parallax-glow-primary" />
        <div className="parallax-glow parallax-glow-secondary" />
        <div className="parallax-grid" />
      </div>

      <div className="content-container">
        <header className="app-header">
          <div className="header-inner">
            <div className="header-brand">
              <p className="brand-kicker">Streaming Portfolio</p>
              <h1 className="brand-title">Catalogo X</h1>
            </div>

            {nav && <nav className="header-nav">{nav}</nav>}

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
