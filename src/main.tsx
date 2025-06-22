import App from "./App/App";
import ReactDOM from "react-dom/client";
import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ChakraProvider } from "@chakra-ui/react";
import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";

import { store } from "./redux/app/store";
import { system } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";
import "lenis/dist/lenis.css";
import "./index.css";
import "./i18n/i18n";

import FloatingChat from "./pages/Mateus/FloatingChat";

// ✅ Fonte dinâmica responsiva
const setFontFamily = () => {
  if (window.innerWidth < 768) {
    document.documentElement.style.setProperty(
      "--font-family-base",
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
    );
  } else {
    document.documentElement.style.setProperty(
      "--font-family-base",
      "'Playfair Display', serif"
    );
  }
};

window.addEventListener("resize", setFontFamily);
setFontFamily(); // Executa na primeira carga

// ✅ Redirecionamento de URL opcional
const redirectedPath = window.location.search.slice(1);
if (redirectedPath && redirectedPath.startsWith("/")) {
  window.history.replaceState({}, "", redirectedPath);
}

// ✅ App principal com Lenis aplicado globalmente
const MainApp: React.FC = () => {
  return (
    <React.StrictMode>
        <Provider store={store}>
          <ChakraProvider value={system}>
            <BrowserRouter>
              <App />
              <FloatingChat />
            </BrowserRouter>
          </ChakraProvider>
        </Provider>
    </React.StrictMode>
  );
};

// ✅ Renderização
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<MainApp />);
} else {
  console.error("❌ Elemento root não encontrado");
}
