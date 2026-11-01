import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

import {
  getLanguageFromPath,
  isLandingPath,
} from "../features/navigation/landingSections";

const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: "languageFromPath",
  // Na landing (/home, /en/..., /es/...) o idioma é o da URL; nas outras
  // páginas (jogos, páginas privadas) segue o navegador, como antes.
  lookup: () => {
    const pathname = globalThis.window?.location.pathname;
    return isLandingPath(pathname) ? getLanguageFromPath(pathname) : undefined;
  },
});

i18n
  .use(HttpApi)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Espanhol sem tradução cai no inglês; o resto, no português.
    fallbackLng: { es: ["en"], default: ["pt"] },
    supportedLngs: ["pt", "en", "es"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    // Na landing o idioma vem da URL (/en inglês, /es espanhol, o resto
    // português), para que cada idioma tenha endereço próprio para o Google e
    // as IAs. A raiz escolhe o idioma em languageRedirect.
    detection: {
      order: ["languageFromPath", "localStorage", "navigator", "htmlTag"],
      caches: [],
    },
  });

const DOCUMENT_LANGUAGE: Record<string, string> = { en: 'en', es: 'es', pt: 'pt-BR' };
const updateDocumentLanguage = () => {
  document.documentElement.lang = DOCUMENT_LANGUAGE[i18n.resolvedLanguage ?? 'pt'] ?? 'pt-BR';
};
i18n.on('initialized', updateDocumentLanguage);
i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;
