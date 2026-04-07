import { useState } from "react";
import type { FormEvent } from "react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";

interface LoginFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (input: { username: string; password: string }) => Promise<boolean>;
  onGuestAccess: () => void | Promise<void>;
}

export function LoginForm({ isSubmitting, error, onSubmit, onGuestAccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeAction, setActiveAction] = useState<"login" | "guest" | null>(null);
  const { text } = useLanguage();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveAction("login");
    try {
      await onSubmit({ username: username.trim(), password });
    } finally {
      setActiveAction(null);
    }
  }

  async function handleGuestAccess() {
    setActiveAction("guest");
    try {
      await Promise.all([
        Promise.resolve(onGuestAccess()),
        new Promise((resolve) => window.setTimeout(resolve, 850)),
      ]);
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="login-screen" aria-label={text.loginScreenAria}>
      <form className="login-box" onSubmit={handleSubmit}>
        <div className="login-box-topbar">
          <LanguageToggle />
        </div>
        <div className="login-brand">
          <p className="login-kicker">Catalogo X</p>
          <h1 className="login-title">{text.loginTitle}</h1>
          <p className="login-subtitle">{text.loginSubtitle}</p>
        </div>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="login-input"
          type="text"
          placeholder={text.username}
          aria-label={text.username}
          required
          disabled={isSubmitting || activeAction === "guest"}
        />

        <input
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="login-input"
          type="password"
          placeholder={text.password}
          aria-label={text.password}
          required
          disabled={isSubmitting || activeAction === "guest"}
        />

        <button
          className={`login-btn${activeAction === "login" || isSubmitting ? " loading" : ""}`}
          type="submit"
          disabled={isSubmitting || activeAction === "guest"}
        >
          <span className="login-text">{text.login}</span>
          <span className="login-spinner" aria-hidden="true" />
        </button>

        <button
          className={`login-btn login-btn-guest${activeAction === "guest" ? " loading" : ""}`}
          type="button"
          disabled={isSubmitting || activeAction === "guest"}
          onClick={handleGuestAccess}
        >
          <span className="login-text">{text.guestAccess}</span>
          <span className="login-spinner" aria-hidden="true" />
        </button>

        <p className="login-helper">{text.guestHelper}</p>

        <p className="login-error">{error ?? ""}</p>
      </form>
    </section>
  );
}
