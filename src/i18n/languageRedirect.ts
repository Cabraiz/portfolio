import {
  ENGLISH_PATH_PREFIX,
  getLanguageFromPath,
  isLandingPath,
  stripLanguagePrefix,
} from "../features/navigation/landingSections";

const LANGUAGE_REDIRECT_KEY = "cabraiz-language-redirected";
// Robôs (buscadores, IAs, prévias de link) e navegadores automatizados não são
// redirecionados: cada idioma precisa ser rastreado no próprio endereço.
const AUTOMATED_AGENT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|lighthouse|headless|inspectiontool|chrome-lighthouse|gptbot|claude|perplexity/i;

/**
 * Antes o idioma vinha do navegador. Para manter a experiência de quem usa o
 * navegador em inglês, a primeira visita a uma página em português leva para
 * a versão /en uma única vez (a escolha fica salva; voltar para o português
 * depois é respeitado).
 */
export function redirectFirstEnglishVisit(): boolean {
  const browserWindow = globalThis.window;
  if (!browserWindow) return false;

  const { pathname, search, hash } = browserWindow.location;
  if (getLanguageFromPath(pathname) === "en" || !isLandingPath(pathname)) {
    return false;
  }

  const navigatorLanguage = browserWindow.navigator.language?.toLowerCase() ?? "";
  if (
    !navigatorLanguage.startsWith("en") ||
    AUTOMATED_AGENT_PATTERN.test(browserWindow.navigator.userAgent) ||
    browserWindow.navigator.webdriver
  ) {
    return false;
  }

  try {
    if (browserWindow.localStorage.getItem(LANGUAGE_REDIRECT_KEY)) return false;
    browserWindow.localStorage.setItem(LANGUAGE_REDIRECT_KEY, "1");
  } catch {
    return false;
  }

  const sectionPath = stripLanguagePrefix(pathname);
  const target = `${ENGLISH_PATH_PREFIX}${sectionPath === "/" ? "/home" : sectionPath}`;
  browserWindow.location.replace(`${target}${search}${hash}`);
  return true;
}
