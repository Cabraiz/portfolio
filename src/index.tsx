import React from 'react'
import ReactDOM from 'react-dom/client'
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import App from "./App";
import { store } from './redux/app/store'

import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from '@chakra-ui/react'

import { worker } from './redux/mocks/browser'
import { Provider } from 'react-redux'

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <ChakraProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChakraProvider>
      </Provider>
    </React.StrictMode>
);