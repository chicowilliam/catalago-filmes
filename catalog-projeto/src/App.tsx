import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { CatalogPage } from "@/pages/CatalogPage";

function CheckingScreen() {
  const { text } = useLanguage();

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
          {text.checkingSession}
        </motion.p>
      </motion.div>
    </section>
  );
}

function App() {
  const auth = useAuth();
  const { text } = useLanguage();
  const canAccessCatalog = auth.isAuthenticated || auth.isGuest;
  const playCatalogIntro = auth.catalogIntroToken > 0;

  if (auth.status === "checking") {
    return <CheckingScreen />;
  }

  return (
    <AnimatePresence mode="sync" initial={false}>
      {!canAccessCatalog ? (
        <motion.div
          key="login"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          style={{ willChange: "opacity" }}
          exit={{
            opacity: 0,
          }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
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
          key={`catalog-${auth.catalogIntroToken}`}
          style={{ willChange: "transform, opacity" }}
          initial={playCatalogIntro ? { opacity: 0, y: 18, scale: 0.985 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: playCatalogIntro ? 0.58 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <CatalogPage
            username={auth.user?.username ?? (auth.isGuest ? text.guestUsername : undefined)}
            onLogout={auth.logout}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
