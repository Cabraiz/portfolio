import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ChakraProvider } from "@chakra-ui/react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import App from "./App/App";
import FloatingChat from "./pages/Mateus/FloatingChat";
import RoadMapErrorBoundary from "./pages/Mateus/RoadMap/ui/chrome/RoadMapErrorBoundary";

import { store } from "./redux/app/store";
import { system } from "./theme";

import "bootstrap/dist/css/bootstrap.min.css";
import "lenis/dist/lenis.css";
import "./index.css";
import "./i18n/i18n";

const GLOBAL_RUNTIME_FALLBACK_ID = "global-runtime-fallback";

const BASE_FONT_FAMILY =
  "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function applyBaseFontFamily(): void {
  if (typeof globalThis.document === "undefined") {
    return;
  }

  globalThis.document.documentElement.style.setProperty(
    "--font-family-base",
    BASE_FONT_FAMILY,
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Falha inesperada ao inicializar a aplicação.";
}

function resolveUnknownErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.stack?.trim() || error.message || String(error);
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function renderGlobalRuntimeFallback(
  title: string,
  message: string,
  details?: string,
): void {
  if (typeof globalThis.document === "undefined") {
    return;
  }

  let container =
    globalThis.document.getElementById(GLOBAL_RUNTIME_FALLBACK_ID);

  if (!container) {
    container = globalThis.document.createElement("div");
    container.id = GLOBAL_RUNTIME_FALLBACK_ID;
    globalThis.document.body.appendChild(container);
  }

  container.setAttribute("role", "alert");
  container.setAttribute("aria-live", "assertive");

  container.innerHTML = `
    <div
      style="
        position: fixed;
        inset: 16px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      "
    >
      <div
        style="
          width: min(760px, calc(100vw - 32px));
          max-height: calc(100vh - 32px);
          overflow: auto;
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(239, 68, 68, 0.18);
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,242,242,0.98) 100%);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
          box-sizing: border-box;
          font-family: ${BASE_FONT_FAMILY};
          pointer-events: auto;
        "
      >
        <span
          style="
            display: inline-flex;
            align-items: center;
            width: fit-content;
            min-height: 22px;
            padding: 0 9px;
            border-radius: 999px;
            background: rgba(239, 68, 68, 0.08);
            color: #b91c1c;
            font-size: 0.68rem;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          "
        >
          Falha global
        </span>

        <h1
          style="
            margin: 0;
            color: #7f1d1d;
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.02em;
          "
        >
          ${escapeHtml(title)}
        </h1>

        <p
          style="
            margin: 0;
            color: #450a0a;
            font-size: 0.9rem;
            font-weight: 500;
            line-height: 1.6;
            overflow-wrap: anywhere;
          "
        >
          ${escapeHtml(message)}
        </p>

        ${
          details
            ? `
              <details
                style="
                  border-radius: 14px;
                  border: 1px solid rgba(148, 163, 184, 0.16);
                  background: rgba(15, 23, 42, 0.04);
                  overflow: hidden;
                "
              >
                <summary
                  style="
                    cursor: pointer;
                    list-style: none;
                    padding: 12px 14px;
                    color: #334155;
                    font-size: 0.8rem;
                    font-weight: 600;
                    line-height: 1.2;
                    letter-spacing: 0.02em;
                  "
                >
                  Detalhes técnicos
                </summary>

                <pre
                  style="
                    margin: 0;
                    padding: 0 14px 14px;
                    color: #334155;
                    font-size: 0.78rem;
                    line-height: 1.55;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                    font-family: ${BASE_FONT_FAMILY};
                  "
                >${escapeHtml(details)}</pre>
              </details>
            `
            : ""
        }
      </div>
    </div>
  `;
}

function installGlobalRuntimeHandlers(): void {
  if (typeof globalThis.window === "undefined") {
    return;
  }

  globalThis.window.addEventListener("error", (event) => {
    const message = resolveUnknownErrorMessage(event.error ?? event.message);
    const details =
      resolveUnknownErrorDetails(event.error ?? event.message) +
      (event.filename
        ? `\n\nArquivo: ${event.filename}:${event.lineno}:${event.colno}`
        : "");

    console.error("[global-error]", event.error ?? event.message);
    renderGlobalRuntimeFallback(
      "A aplicação encontrou um erro global",
      message,
      details,
    );
  });

  globalThis.window.addEventListener("unhandledrejection", (event) => {
    const message = resolveUnknownErrorMessage(event.reason);
    const details = resolveUnknownErrorDetails(event.reason);

    console.error("[unhandled-rejection]", event.reason);
    renderGlobalRuntimeFallback(
      "A aplicação encontrou uma rejeição não tratada",
      message,
      details,
    );
  });
}

if (typeof globalThis.window !== "undefined") {
  applyBaseFontFamily();

  const redirectedPath = globalThis.window.location.search.slice(1);
  if (redirectedPath && redirectedPath.startsWith("/")) {
    globalThis.window.history.replaceState({}, "", redirectedPath);
  }

  installGlobalRuntimeHandlers();
}

const MainApp: React.FC = () => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <ChakraProvider value={system}>
          <RoadMapErrorBoundary
            sectionLabel="App shell"
            fallbackTitle="A aplicação principal quebrou"
            resetKey="main-app-shell"
            minHeight="100vh"
            fullHeight
          >
            <BrowserRouter>
              <App />
              <FloatingChat />
            </BrowserRouter>
          </RoadMapErrorBoundary>
        </ChakraProvider>
      </Provider>
    </React.StrictMode>
  );
};

const rootElement = globalThis.document.getElementById("root");

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(<MainApp />);
  } catch (error) {
    console.error("[bootstrap-error]", error);

    renderGlobalRuntimeFallback(
      "Falha ao montar a aplicação",
      resolveUnknownErrorMessage(error),
      resolveUnknownErrorDetails(error),
    );
  }
} else {
  console.error("Elemento root não encontrado");
  renderGlobalRuntimeFallback(
    "Não foi possível iniciar a aplicação",
    "O elemento root não foi encontrado no documento.",
  );
}
