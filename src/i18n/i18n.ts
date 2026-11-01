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
  // Na landing (/home, /portfolio, /en/...) o idioma é o da URL; nas outras
  // páginas (jogos, páginas privadas) segue o navegador, como antes.
  lookup: () => {
    const pathname = globalThis.window?.location.pathname;
    if (getLanguageFromPath(pathname) === "en") return "en";
    return isLandingPath(pathname) ? "pt" : undefined;
  },
});

i18n
  .use(HttpApi)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "pt",
    supportedLngs: ["pt", "en"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    // Na landing o idioma vem da URL (/en/... é inglês, o resto é português),
    // para que cada idioma tenha endereço próprio para o Google e as IAs. A
    // ida automática de navegadores em inglês para /en fica em languageRedirect.
    detection: {
      order: ["languageFromPath", "localStorage", "navigator", "htmlTag"],
      caches: [],
    },
  });

const updateDocumentLanguage = () => {
  document.documentElement.lang = i18n.resolvedLanguage === 'en' ? 'en' : 'pt-BR';
};
i18n.on('initialized', updateDocumentLanguage);
i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;
