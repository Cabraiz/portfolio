import React from 'react'
import ReactDOM from 'react-dom/client'
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App";

import { BrowserRouter } from "react-router-dom";

import { Provider } from 'react-redux';

import { worker } from './redux/mocks/browser'
import { ChakraProvider } from '@chakra-ui/react'
import { store } from './redux/app/store'

// Initialize the msw worker, wait for the service worker registration to resolve, then mount
worker.start({ quiet: true }).then(() =>
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <ChakraProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChakraProvider>
      </Provider>
    </React.StrictMode>
  )
)