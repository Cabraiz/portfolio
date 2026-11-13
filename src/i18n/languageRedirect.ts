import {
  getLanguagePath,
  LANDING_LANGUAGES,
  type LandingLanguage,
} from "../features/navigation/landingSections";
import { isHomeElevatorStandaloneHost } from "../App/appHostRouting";

// Idioma escolhido no seletor (EN · PT · ES); vale para as próximas visitas à raiz.
export const PREFERRED_LANGUAGE_KEY = "cabraiz-preferred-language";

function isLandingLanguage(value: unknown): value is LandingLanguage {
  return LANDING_LANGUAGES.includes(value as LandingLanguage);
}

export function rememberPreferredLanguage(language: LandingLanguage): void {
  try {
    globalThis.window?.localStorage.setItem(PREFERRED_LANGUAGE_KEY, language);
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a escolha vale só agora.
  }
}

function readPreferredLanguage(): LandingLanguage | null {
  try {
    const stored = globalThis.window?.localStorage.getItem(PREFERRED_LANGUAGE_KEY);
    return isLandingLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Primeiro idioma do navegador que o site tem; o padrão é inglês (foco internacional). */
export function resolveBrowserLanguage(
  languages: readonly string[] | undefined,
): LandingLanguage {
  for (const value of languages ?? []) {
    const base = value.toLowerCase().split("-")[0];
    if (isLandingLanguage(base)) return base;
  }
  return "en";
}

/**
 * Só a raiz (cabraiz.com/) escolhe o idioma: a escolha salva no seletor ou o
 * idioma do navegador, com inglês como padrão. As páginas de cada idioma
 * (/home, /en/home, /es/home) nunca redirecionam, como pede o Google para
 * sites multilíngues; a troca é pelos links visíveis do seletor.
 */
export function redirectRootToLanguage(): boolean {
  const browserWindow = globalThis.window;
  if (!browserWindow) return false;

  const { pathname, search, hash } = browserWindow.location;
  if (pathname !== "/" && pathname !== "/index.html") return false;
  if (isHomeElevatorStandaloneHost()) return false;

  const navigatorLanguages = browserWindow.navigator.languages?.length
    ? browserWindow.navigator.languages
    : [browserWindow.navigator.language];
  const language = readPreferredLanguage() ?? resolveBrowserLanguage(navigatorLanguages);
  browserWindow.location.replace(`${getLanguagePath(language, "/")}${search}${hash}`);
  return true;
}
