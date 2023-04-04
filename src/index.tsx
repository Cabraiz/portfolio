import App from "./App";
import ReactDOM from "react-dom/client";
import React, { FC, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { useReportWebVitals } from "./reportWebVitals";

import { Provider } from "react-redux";
import { store } from "./redux/app/store";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { worker } from "./redux/mocks/browser";

const handleWebVitals = (metric: any) => {};

interface ReportWebVitalsProps {
  children: React.ReactNode;
}

const ReportWebVitals: FC<ReportWebVitalsProps> = ({ children }) => {
  useReportWebVitals(handleWebVitals);
  return <>{children}</>;
};

const MainApp: FC = () => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <ChakraProvider>
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

const rootElement = document.getElementById("root");
if (rootElement) {
  worker.start({ onUnhandledRequest: "bypass", quiet: true }).then(() => {
    ReactDOM.createRoot(rootElement).render(<MainApp />);
  });
} else {
  console.error("Não foi possível encontrar o elemento raiz");
}
