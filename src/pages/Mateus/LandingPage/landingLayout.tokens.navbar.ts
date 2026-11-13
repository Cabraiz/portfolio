// Medição, sincronização e observação do deslocamento da navbar.
import { NAVBAR_HEIGHT_CSS_VAR } from "../../../App/NavBar/navbar.constants";
import type { LandingSectionViewportMode } from "./landing.types";
import {
  LANDING_NAVBAR_SCROLL_ALIGNMENT_PX,
  LANDING_NAVBAR_SELECTOR_CANDIDATES,
  landingLayoutTokens,
  normalizeLandingRenderableViewportMode,
  type LandingRenderableViewportMode,
} from "./landingLayout.tokens.base";

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

function getBrowserDocument(): Document | null {
  if (typeof globalThis.document === "undefined") {
    return null;
  }

  return globalThis.document;
}

function parsePxValue(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isVisibleElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function isLikelyNavbarElement(
  browserWindow: Window,
  element: HTMLElement,
): boolean {
  if (!isVisibleElement(element)) {
    return false;
  }

  const computedStyle = browserWindow.getComputedStyle(element);
  const position = computedStyle.position;
  const top = parsePxValue(computedStyle.top) ?? 0;

  if (position !== "fixed" && position !== "sticky") {
    return false;
  }

  return Math.abs(top) <= 2;
}

function resolveLandingNavbarOffsetCssVarName(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): string {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.navbar.offsetCssVar[normalizedViewportMode];
}

function resolveLandingNavbarOffsetCssValue(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): string {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.navbar.offsetCssValue[normalizedViewportMode];
}

function readElementCssVarPx(
  element: Element,
  cssVarName: string,
): number | null {
  const browserWindow = getBrowserWindow();

  if (browserWindow === null) {
    return null;
  }

  return parsePxValue(browserWindow.getComputedStyle(element).getPropertyValue(cssVarName));
}

function findLandingNavbarElement(): HTMLElement | null {
  const browserWindow = getBrowserWindow();
  const browserDocument = getBrowserDocument();

  if (browserWindow === null || browserDocument === null) {
    return null;
  }

  for (const selector of LANDING_NAVBAR_SELECTOR_CANDIDATES) {
    const elements = Array.from(
      browserDocument.querySelectorAll<HTMLElement>(selector),
    );

    const matchingElement = elements.find((element) =>
      isLikelyNavbarElement(browserWindow, element),
    );

    if (matchingElement) {
      return matchingElement;
    }
  }

  return null;
}

function resolveMeasuredNavbarOffsetPx(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): number | null {
  const browserWindow = getBrowserWindow();
  const browserDocument = getBrowserDocument();

  if (browserWindow === null || browserDocument === null) {
    return null;
  }

  const navbarElement = findLandingNavbarElement();

  if (navbarElement !== null) {
    const computedStyle = browserWindow.getComputedStyle(navbarElement);
    const rect = navbarElement.getBoundingClientRect();
    const borderBottomWidth =
      parsePxValue(computedStyle.borderBottomWidth) ?? 0;

    const measuredOffset = Math.ceil(
      rect.height +
        borderBottomWidth +
        LANDING_NAVBAR_SCROLL_ALIGNMENT_PX,
    );

    if (measuredOffset > 0) {
      return measuredOffset;
    }
  }

  const rootElement = browserDocument.documentElement;

  const cssVarHeight =
    readElementCssVarPx(rootElement, NAVBAR_HEIGHT_CSS_VAR) ??
    (navbarElement ? readElementCssVarPx(navbarElement, NAVBAR_HEIGHT_CSS_VAR) : null);

  if (cssVarHeight !== null && cssVarHeight > 0) {
    return Math.ceil(cssVarHeight + LANDING_NAVBAR_SCROLL_ALIGNMENT_PX);
  }

  return null;
}

function writeLandingNavbarOffsetCssVar(
  viewportMode: LandingRenderableViewportMode,
  offsetPx: number,
): void {
  const browserDocument = getBrowserDocument();

  if (browserDocument === null) {
    return;
  }

  browserDocument.documentElement.style.setProperty(
    resolveLandingNavbarOffsetCssVarName(viewportMode),
    `${offsetPx}px`,
  );
}

export function resolveLandingNavbarFallbackOffsetPx(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): number {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.navbar.offsetPx[normalizedViewportMode];
}

export function resolveLandingNavbarOffsetPx(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): number {
  return (
    resolveMeasuredNavbarOffsetPx(viewportMode) ??
    resolveLandingNavbarFallbackOffsetPx(viewportMode)
  );
}

export function syncLandingNavbarOffset(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): number {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const resolvedOffsetPx = resolveLandingNavbarOffsetPx(normalizedViewportMode);

  writeLandingNavbarOffsetCssVar(normalizedViewportMode, resolvedOffsetPx);

  return resolvedOffsetPx;
}

export function subscribeToLandingNavbarOffset(
  viewportMode: LandingRenderableViewportMode,
  onChange: (offsetPx: number) => void,
): () => void {
  const browserWindow = getBrowserWindow();
  const browserDocument = getBrowserDocument();

  if (browserWindow === null || browserDocument === null) {
    onChange(resolveLandingNavbarFallbackOffsetPx(viewportMode));

    return () => {};
  }

  let animationFrameId: number | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let observedNavbarElement: HTMLElement | null = null;

  const cleanupResizeObserver = (): void => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const connectResizeObserver = (): void => {
    const nextNavbarElement = findLandingNavbarElement();

    if (nextNavbarElement === observedNavbarElement) {
      return;
    }

    cleanupResizeObserver();
    observedNavbarElement = nextNavbarElement;

    if (
      observedNavbarElement === null ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      scheduleSync();
    });

    resizeObserver.observe(observedNavbarElement);
  };

  const commitSync = (): void => {
    animationFrameId = null;
    connectResizeObserver();

    const nextOffsetPx = syncLandingNavbarOffset(viewportMode);
    onChange(nextOffsetPx);
  };

  const scheduleSync = (): void => {
    if (animationFrameId !== null) {
      browserWindow.cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = browserWindow.requestAnimationFrame(commitSync);
  };

  connectResizeObserver();
  scheduleSync();

  browserWindow.addEventListener("resize", scheduleSync, {
    passive: true,
  });
  browserWindow.addEventListener("orientationchange", scheduleSync, {
    passive: true,
  });

  if (typeof MutationObserver !== "undefined") {
    mutationObserver = new MutationObserver(() => {
      scheduleSync();
    });

    mutationObserver.observe(browserDocument.body, {
      childList: true,
      subtree: true,
    });
  }

  return () => {
    if (animationFrameId !== null) {
      browserWindow.cancelAnimationFrame(animationFrameId);
    }

    cleanupResizeObserver();
    mutationObserver?.disconnect();

    browserWindow.removeEventListener("resize", scheduleSync);
    browserWindow.removeEventListener("orientationchange", scheduleSync);
  };
}

export { resolveLandingNavbarOffsetCssValue };
