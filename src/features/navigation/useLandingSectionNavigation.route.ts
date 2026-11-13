// Rotas e rolagem até a seção (movido do useLandingSectionNavigation).

import {
  DEFAULT_LANDING_SECTION_ID,
  LANDING_SECTIONS,
  getSectionIdByPath,
  isLandingPath,
  type LandingSectionId,
} from "./landingSections";
import {
  clearPendingLandingScrollTarget,
  setPendingLandingScrollTarget,
} from "../scroll/landingScrollTarget";
import { DEFAULT_SECTION_IDS } from "./useLandingSectionNavigation.store";
import type { LenisLike } from "./useLandingSectionNavigation.types";

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) {
    return "/";
  }

  const withoutHash = pathname.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  const trimmed = withoutQuery.trim();

  if (!trimmed) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsedSlashes !== "/" && collapsedSlashes.endsWith("/")) {
    return collapsedSlashes.slice(0, -1);
  }

  return collapsedSlashes;
}

function createEaseOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function normalizeSectionIds(
  sectionIds?: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  const base = sectionIds?.length ? sectionIds : DEFAULT_SECTION_IDS;

  return Array.from(new Set(base));
}

function resolveEligibleFallbackSectionId(
  defaultSectionId: LandingSectionId,
  sectionIds: readonly LandingSectionId[],
): LandingSectionId {
  if (sectionIds.includes(defaultSectionId)) {
    return defaultSectionId;
  }

  return sectionIds[0] ?? DEFAULT_LANDING_SECTION_ID;
}

function resolveRouteSectionIdFromPathname(params: Readonly<{
  pathname: string | null | undefined;
  defaultSectionId: LandingSectionId;
  eligibleSectionIds: readonly LandingSectionId[];
}>): LandingSectionId {
  const { pathname, defaultSectionId, eligibleSectionIds } = params;

  const fallbackSectionId = resolveEligibleFallbackSectionId(
    defaultSectionId,
    eligibleSectionIds,
  );

  if (!isLandingPath(pathname)) {
    return fallbackSectionId;
  }

  // getSectionIdByPath desconta o prefixo de idioma (/en, /es).
  const nextSectionId = getSectionIdByPath(pathname);

  if (nextSectionId && eligibleSectionIds.includes(nextSectionId)) {
    return nextSectionId;
  }

  const normalizedPath = normalizePathname(pathname);

  for (const section of LANDING_SECTIONS) {
    if (normalizePathname(section.path) === normalizedPath) {
      return eligibleSectionIds.includes(section.id)
        ? section.id
        : fallbackSectionId;
    }
  }

  return fallbackSectionId;
}

function resolveExactWindowScrollTop(
  target: HTMLElement,
  offsetPx: number,
): number | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  const browserWindow = globalThis.window;
  const targetTop = browserWindow.scrollY + target.getBoundingClientRect().top;

  return Math.max(0, Math.round(targetTop - offsetPx));
}

function scrollToSectionTarget(params: Readonly<{
  target: HTMLElement;
  lenis: LenisLike;
  offsetPx: number;
  duration: number;
}>): void {
  const { target, lenis, offsetPx, duration } = params;

  const targetScrollTop = resolveExactWindowScrollTop(target, offsetPx);

  if (targetScrollTop !== null) {
    setPendingLandingScrollTarget(targetScrollTop);
  }

  if (targetScrollTop !== null && lenis) {
    const browserWindow = globalThis.window;
    // Na landing desktop a roda e o teclado só paginam (useDesktopSectionPaging)
    // e não movem a página no meio da animação: lá eles não a interrompem, e
    // o alvo pendente marca a navegação em curso até ela terminar.
    const interruptionEvents = document.querySelector(
      "main[data-landing-viewport='desktop']",
    )
      ? (["touchstart", "pointerdown"] as const)
      : (["wheel", "touchstart", "pointerdown", "keydown"] as const);

    // O Lenis não chama onComplete quando o usuário interrompe a animação;
    // sem isso o alvo antigo ficaria pendente e seria reaplicado depois.
    // Nem toda conclusão passa pelo onComplete (ex.: rolagem nativa do teclado
    // em andamento), então a duração conhecida também libera o alvo.
    let releaseTimerId: number | undefined;
    const releaseTarget = () => {
      interruptionEvents.forEach((eventName) => {
        browserWindow?.removeEventListener(eventName, releaseTarget, true);
      });
      browserWindow?.clearTimeout(releaseTimerId);
      clearPendingLandingScrollTarget(targetScrollTop);
    };

    interruptionEvents.forEach((eventName) => {
      browserWindow?.addEventListener(eventName, releaseTarget, {
        capture: true,
        passive: true,
      });
    });
    releaseTimerId = browserWindow?.setTimeout(
      releaseTarget,
      Math.max(250, duration * 1000 + 250),
    );

    lenis.scrollTo(targetScrollTop, {
      duration,
      easing: createEaseOutCubic,
      // Uma navegação nova sempre vence a anterior, mesmo com o Lenis parado.
      force: true,
      onComplete: releaseTarget,
    });
    return;
  }

  if (targetScrollTop !== null && typeof globalThis.window !== "undefined") {
    globalThis.window.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
    globalThis.window.setTimeout(
      () => clearPendingLandingScrollTarget(targetScrollTop),
      Math.max(250, duration * 1000 + 100)
    );
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function writeRoutePathToBrowserHistory(params: Readonly<{
  nextPath: string;
  sectionId: LandingSectionId;
  replace?: boolean;
}>): void {
  if (typeof globalThis.window === "undefined") {
    return;
  }

  const { nextPath, sectionId, replace = true } = params;
  const browserWindow = globalThis.window;
  const normalizedNextPath = normalizePathname(nextPath);
  const historyState = {
    ...(browserWindow.history.state ?? {}),
    landingSectionId: sectionId,
  };

  if (replace) {
    browserWindow.history.replaceState(historyState, "", normalizedNextPath);
    return;
  }

  browserWindow.history.pushState(historyState, "", normalizedNextPath);
}

export {
  normalizePathname,
  normalizeSectionIds,
  resolveEligibleFallbackSectionId,
  resolveRouteSectionIdFromPathname,
  scrollToSectionTarget,
  writeRoutePathToBrowserHistory,
};
