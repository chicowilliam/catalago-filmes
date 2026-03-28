import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="login-screen">
          <p>Algo deu errado. Tente recarregar a página.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
