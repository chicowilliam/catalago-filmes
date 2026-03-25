import { LoginForm } from "@/components/auth/LoginForm";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { CatalogPage } from "@/pages/CatalogPage";

function App() {
  const auth = useAuth();
  const canAccessCatalog = auth.isAuthenticated || auth.isGuest;

  if (auth.status === "checking") {
    return <section className="login-screen">Validando sessao...</section>;
  }

  if (!canAccessCatalog) {
    return (
      <LoginForm
        isSubmitting={auth.isSubmitting}
        error={auth.error}
        onSubmit={auth.login}
        onGuestAccess={auth.enterAsGuest}
      />
    );
  }

  return (
    <AppShell
      username={auth.user?.username ?? (auth.isGuest ? "Visitante" : undefined)}
      onLogout={auth.isAuthenticated ? auth.logout : undefined}
    >
      <CatalogPage />
    </AppShell>
  );
}

export default App;
