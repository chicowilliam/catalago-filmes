import { Component, type ErrorInfo, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  static contextType = LanguageContext;
  declare context: LanguageContextValue;

  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, info.componentStack);
  }

  render() {
    const text = this.context?.text ?? translations["pt-BR"];

    if (this.state.hasError) {
      return (
        <section className="login-screen">
          <p>{text.errorBoundaryMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            {text.reload}
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
