import { useState } from "react";
import type { FormEvent } from "react";

interface LoginFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (input: { username: string; password: string }) => Promise<boolean>;
}

export function LoginForm({ isSubmitting, error, onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ username: username.trim(), password });
  }

  return (
    <section className="login-screen" aria-label="Tela de login">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="login-title">Acesso</h1>

        <label className="input-label" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="text-input"
          type="text"
          required
          disabled={isSubmitting}
        />

        <label className="input-label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="text-input"
          type="password"
          required
          disabled={isSubmitting}
        />

        <button className="primary-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>

        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
