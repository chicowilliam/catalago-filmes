import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { CatalogPage } from "@/pages/CatalogPage";

function CheckingScreen() {
  return (
    <section className="login-screen">
      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Spinner animado */}
        <motion.span
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent, #e50914)",
            display: "block",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <motion.p
          style={{ color: "var(--text-muted, #888)", fontSize: 14 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          Validando sessão...
        </motion.p>
      </motion.div>
    </section>
  );
}

function App() {
  const auth = useAuth();
  const canAccessCatalog = auth.isAuthenticated || auth.isGuest;

  // Barra de progresso de scroll
  useEffect(() => {
    function updateProgress() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
      document.documentElement.style.setProperty("--scroll-progress", String(progress));
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  // Scroll reveal — fallback para browsers sem animation-timeline: view()
  useEffect(() => {
    if (!canAccessCatalog) return;
    if (CSS.supports("animation-timeline", "view()")) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Pequeno delay para o DOM estar pronto após a transição de entrada
    const timer = window.setTimeout(() => {
      document.querySelectorAll(".section-block, .about-summary-card, .tech-group-row, .social-badges").forEach((el) => {
        el.classList.add("reveal");
        observer.observe(el);
      });
    }, 600);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [canAccessCatalog]);

  if (auth.status === "checking") {
    return <CheckingScreen />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!canAccessCatalog ? (
        <motion.div
          key="login"
          initial={false}
          style={{ willChange: "opacity" }}
          exit={{
            opacity: 0,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <LoginForm
            isSubmitting={auth.isSubmitting}
            error={auth.error}
            onSubmit={auth.login}
            onGuestAccess={auth.enterAsGuest}
          />
        </motion.div>
      ) : (
        <motion.div
          key="catalog"
          style={{ willChange: "transform, opacity" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
        >
          <AppShell
            username={auth.user?.username ?? (auth.isGuest ? "Visitante" : undefined)}
            onLogout={auth.isAuthenticated ? auth.logout : () => { /* guest: sem logout */ }}
          >
            <CatalogPage />
          </AppShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
