import App from "./App";
import ReactDOM from "react-dom/client";
import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/app/store";
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import './i18n/i18n';


// Componente principal encapsulando toda a aplicação
const MainApp: React.FC = () => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <ChakraProvider value={system}>
          <BrowserRouter>
            <Suspense fallback={<div>Loading...</div>}>
              <App />
            </Suspense>
          </BrowserRouter>
        </ChakraProvider>
      </Provider>
    </React.StrictMode>
  );
};

// Inicializando a aplicação no elemento root
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<MainApp />);
} else {
  console.error("Elemento root não encontrado");
}
