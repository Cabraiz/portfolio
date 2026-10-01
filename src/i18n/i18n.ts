import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
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
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

const updateDocumentLanguage = () => {
  document.documentElement.lang = i18n.resolvedLanguage ?? 'pt';
};
i18n.on('initialized', updateDocumentLanguage);
i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;
