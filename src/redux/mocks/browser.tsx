import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Isso configura um Service Worker com os manipuladores de requisição fornecidos.
export const worker = setupWorker(...handlers);
