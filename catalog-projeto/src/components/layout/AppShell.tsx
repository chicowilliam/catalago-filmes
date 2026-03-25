import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface AppShellProps {
  children: ReactNode;
  username?: string;
  onLogout: () => void;
}

export function AppShell({ children, username, onLogout }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-kicker">Streaming Portfolio</p>
          <h1 className="brand-title">Catalogo X</h1>
        </div>

        <div className="header-actions">
          {username ? <span className="user-chip">{username}</span> : null}
          <ThemeToggle />
          <button type="button" className="secondary-btn" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
