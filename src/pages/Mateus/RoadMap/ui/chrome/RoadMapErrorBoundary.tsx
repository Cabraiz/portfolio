import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
} from "react";

type RoadMapErrorBoundaryProps = Readonly<{
  children?: ReactNode;
  sectionLabel?: string;
  fallbackTitle?: string;
  resetKey?: string | number | boolean | null;
  minHeight?: CSSProperties["minHeight"];
  fullHeight?: boolean;
}>;

type RoadMapErrorBoundaryState = Readonly<{
  hasError: boolean;
  errorMessage: string | null;
  componentStack: string | null;
  errorStack: string | null;
}>;

const isDev = import.meta.env.DEV;

const INITIAL_STATE: RoadMapErrorBoundaryState = {
  hasError: false,
  errorMessage: null,
  componentStack: null,
  errorStack: null,
};

const shellBaseStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "100%",
  minWidth: 0,
  padding: "18px",
  borderRadius: "22px",
  border: "1px solid rgba(239, 68, 68, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,242,242,0.98) 100%)",
  boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const topRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  minHeight: "22px",
  padding: "0 9px",
  borderRadius: "999px",
  background: "rgba(239, 68, 68, 0.08)",
  color: "#b91c1c",
  fontSize: "0.68rem",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#7f1d1d",
  fontSize: "1rem",
  fontWeight: 900,
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#7f1d1d",
  fontSize: "0.92rem",
  lineHeight: 1.6,
};

const messageBoxStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(239, 68, 68, 0.14)",
  background: "rgba(255, 255, 255, 0.78)",
};

const messageLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#991b1b",
  fontSize: "0.74rem",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const messageTextStyle: CSSProperties = {
  margin: 0,
  color: "#450a0a",
  fontSize: "0.88rem",
  fontWeight: 600,
  lineHeight: 1.55,
  overflowWrap: "anywhere",
};

const detailsStyle: CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.04)",
  overflow: "hidden",
};

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  listStyle: "none",
  padding: "12px 14px",
  color: "#334155",
  fontSize: "0.8rem",
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: "0.02em",
};

const detailsContentStyle: CSSProperties = {
  padding: "0 14px 14px",
};

const preStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.78rem",
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const actionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const retryButtonStyle: CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(127, 29, 29, 0.14)",
  background: "#ffffff",
  color: "#7f1d1d",
  borderRadius: "12px",
  minHeight: "40px",
  padding: "0 14px",
  fontSize: "0.88rem",
  fontWeight: 800,
  cursor: "pointer",
};

const hintTextStyle: CSSProperties = {
  margin: 0,
  color: "#7f1d1d",
  fontSize: "0.82rem",
  lineHeight: 1.5,
};

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Falha inesperada ao renderizar esta seção.";
}

function resolveSafeErrorStack(error: unknown): string | null {
  if (
    error instanceof Error &&
    typeof error.stack === "string" &&
    error.stack.trim()
  ) {
    return error.stack;
  }

  return null;
}

export default class RoadMapErrorBoundary extends Component<
  RoadMapErrorBoundaryProps,
  RoadMapErrorBoundaryState
> {
  public state: RoadMapErrorBoundaryState = INITIAL_STATE;

  public static getDerivedStateFromError(
    error: unknown,
  ): Partial<RoadMapErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: resolveSafeErrorMessage(error),
      errorStack: resolveSafeErrorStack(error),
    };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    this.setState({
      hasError: true,
      errorMessage: resolveSafeErrorMessage(error),
      componentStack: errorInfo.componentStack || null,
      errorStack: resolveSafeErrorStack(error),
    });

    console.error("[RoadMapErrorBoundary]", {
      sectionLabel: this.props.sectionLabel ?? "RoadMap",
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  public componentDidUpdate(
    prevProps: Readonly<RoadMapErrorBoundaryProps>,
  ): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.resetBoundary();
    }
  }

  private resetBoundary = (): void => {
    this.setState(INITIAL_STATE);
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children ?? null;
    }

    const sectionLabel = this.props.sectionLabel ?? "RoadMap";
    const title =
      this.props.fallbackTitle ?? `A seção ${sectionLabel} quebrou`;

    const shellStyle: CSSProperties = {
      ...shellBaseStyle,
      minHeight: this.props.minHeight,
      height: this.props.fullHeight ? "100%" : undefined,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "stretch",
    };

    return (
      <div style={shellStyle} role="alert" aria-live="assertive">
        <div style={cardStyle}>
          <div style={topRowStyle}>
            <span style={eyebrowStyle}>Falha em runtime</span>

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={this.resetBoundary}
                style={retryButtonStyle}
              >
                Tentar novamente
              </button>
            </div>
          </div>

          <div>
            <h2 style={titleStyle}>{title}</h2>
          </div>

          <p style={descriptionStyle}>
            O restante da aplicação pode continuar funcional, mas esta área
            lançou uma exceção durante a renderização.
          </p>

          <div style={messageBoxStyle}>
            <span style={messageLabelStyle}>Mensagem do erro</span>
            <p style={messageTextStyle}>
              {this.state.errorMessage ??
                "Falha inesperada ao renderizar esta seção."}
            </p>
          </div>

          <p style={hintTextStyle}>
            Se isso continuar acontecendo, revise o módulo responsável por esta
            renderização e confira o console para detalhes adicionais.
          </p>

          {isDev && this.state.componentStack ? (
            <details style={detailsStyle}>
              <summary style={summaryStyle}>Stack do componente</summary>
              <div style={detailsContentStyle}>
                <pre style={preStyle}>{this.state.componentStack}</pre>
              </div>
            </details>
          ) : null}

          {isDev && this.state.errorStack ? (
            <details style={detailsStyle}>
              <summary style={summaryStyle}>Stack do erro</summary>
              <div style={detailsContentStyle}>
                <pre style={preStyle}>{this.state.errorStack}</pre>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    );
  }
}
