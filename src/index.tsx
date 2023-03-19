import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App";

import { BrowserRouter } from "react-router-dom";

import { store } from './redux/hooks/store';
import { Provider } from 'react-redux';

import { worker } from './redux/mocks/browser'
import { ChakraProvider } from '@chakra-ui/react'

async function main() {
  if (process.env.NODE_ENV === 'development') {
    if (window.location.pathname === '/login') {
      window.location.pathname = '/login/'
      return
    }
    const { worker } = require('./redux/mocks/browser')
    await worker.start({
      serviceWorker: {
        url: '/login/mockServiceWorker.js',
      },
    })
  }

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
}
main()