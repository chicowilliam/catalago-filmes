import { LoginForm } from "@/components/auth/LoginForm";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { CatalogPage } from "@/pages/CatalogPage";

function App() {
  const auth = useAuth();

  if (auth.status === "checking") {
    return <section className="login-screen">Validando sessao...</section>;
  }

  if (!auth.isAuthenticated) {
    return (
      <LoginForm
        isSubmitting={auth.isSubmitting}
        error={auth.error}
        onSubmit={auth.login}
      />
    );
  }

  return (
    <AppShell username={auth.user?.username} onLogout={auth.logout}>
      <CatalogPage />
    </AppShell>
  );
}

export default App;
