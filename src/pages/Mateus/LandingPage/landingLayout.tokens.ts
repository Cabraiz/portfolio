import type { CSSProperties } from "react";

import { NAVBAR_HEIGHT_CSS_VAR } from "../../../App/NavBar/navbar.constants";
import type { LandingSectionViewportMode } from "./landing.types";

export type LandingRenderableViewportMode = "desktop" | "mobile";
export type LandingSectionHeightRole = "hero" | "content";

export type LandingResponsiveSpacing = Readonly<{
  sectionPaddingInline: CSSProperties["paddingInline"];
  sectionPaddingBlockStart: CSSProperties["paddingTop"];
  sectionPaddingBlockEnd: CSSProperties["paddingBottom"];
  contentGap: CSSProperties["gap"];
}>;

export type LandingSectionMinHeightOptions = Readonly<{
  preferDynamicViewport?: boolean;
  sectionRole?: LandingSectionHeightRole;
  subtractNavbarOffset?: boolean;
}>;

const DESKTOP_NAVBAR_OFFSET_PX = 74;
const MOBILE_NAVBAR_OFFSET_PX = 76;
const LANDING_NAVBAR_SCROLL_ALIGNMENT_PX = 2;

const LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VAR = "--landing-navbar-offset-desktop";
const LANDING_MOBILE_NAVBAR_OFFSET_CSS_VAR = "--landing-navbar-offset-mobile";

const LANDING_NAVBAR_SELECTOR_CANDIDATES = [
  "[style*='--app-navbar-height']",
  "header[class*='navbar']",
  ".navbar",
  "header",
] as const;

const LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VALUE = `var(${LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VAR}, ${DESKTOP_NAVBAR_OFFSET_PX}px)`;
const LANDING_MOBILE_NAVBAR_OFFSET_CSS_VALUE = `var(${LANDING_MOBILE_NAVBAR_OFFSET_CSS_VAR}, ${MOBILE_NAVBAR_OFFSET_PX}px)`;

export const landingLayoutTokens = {
  breakpoints: {
    desktopMinWidth: 992,
  },

  viewportHeight: {
    stable: "100vh",
    dynamic: "100dvh",
  },

  sectionMinHeight: {
    desktop: {
      stable: "100vh",
      dynamic: "100dvh",
      preferred: "100dvh",
    },
    mobile: {
      stable: "100vh",
      dynamic: "100dvh",
      preferred: "100vh",
    },
  },

  navbar: {
    offsetPx: {
      desktop: DESKTOP_NAVBAR_OFFSET_PX,
      mobile: MOBILE_NAVBAR_OFFSET_PX,
    },
    offsetCssVar: {
      desktop: LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VAR,
      mobile: LANDING_MOBILE_NAVBAR_OFFSET_CSS_VAR,
    },
    offsetCssValue: {
      desktop: LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VALUE,
      mobile: LANDING_MOBILE_NAVBAR_OFFSET_CSS_VALUE,
    },
    scrollMarginTop: {
      desktop: LANDING_DESKTOP_NAVBAR_OFFSET_CSS_VALUE,
      mobile: LANDING_MOBILE_NAVBAR_OFFSET_CSS_VALUE,
    },
  },

  spacing: {
    desktop: {
      sectionPaddingInline: "0px",
      sectionPaddingBlockStart: "0px",
      sectionPaddingBlockEnd: "0px",
      contentGap: "0px",
    },
    mobile: {
      sectionPaddingInline: "0px",
      sectionPaddingBlockStart: "0px",
      sectionPaddingBlockEnd: "0px",
      contentGap: "0px",
    },
  },
} as const;

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

export function normalizeLandingRenderableViewportMode(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): LandingRenderableViewportMode {
  return viewportMode === "mobile" ? "mobile" : "desktop";
}

export function resolveLandingViewportModeByWidth(
  viewportWidth: number,
): LandingRenderableViewportMode {
  return viewportWidth < landingLayoutTokens.breakpoints.desktopMinWidth
    ? "mobile"
    : "desktop";
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

export function resolveLandingScrollMarginTop(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): CSSProperties["scrollMarginTop"] {
  return resolveLandingNavbarOffsetCssValue(viewportMode);
}

export function resolveLandingResponsiveSpacing(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): LandingResponsiveSpacing {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.spacing[normalizedViewportMode];
}

export function resolveLandingViewportHeightUnit(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Readonly<{
    preferDynamicViewport?: boolean;
  }>,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const shouldPreferDynamicViewport =
    options?.preferDynamicViewport ?? normalizedViewportMode === "desktop";

  return shouldPreferDynamicViewport
    ? landingLayoutTokens.viewportHeight.dynamic
    : landingLayoutTokens.viewportHeight.stable;
}

function resolveLandingBaseSectionMinHeight(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Readonly<{
    preferDynamicViewport?: boolean;
  }>,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const shouldPreferDynamicViewport =
    options?.preferDynamicViewport ?? normalizedViewportMode === "desktop";

  const sectionMinHeight =
    landingLayoutTokens.sectionMinHeight[normalizedViewportMode];

  return shouldPreferDynamicViewport
    ? sectionMinHeight.dynamic
    : sectionMinHeight.stable;
}

function shouldSubtractNavbarOffset(
  viewportMode: LandingRenderableViewportMode,
  sectionRole: LandingSectionHeightRole,
  explicitPreference?: boolean,
): boolean {
  if (typeof explicitPreference === "boolean") {
    return explicitPreference;
  }

  return viewportMode === "desktop" && sectionRole === "content";
}

function toViewportHeightMinusNavbar(
  baseMinHeight: CSSProperties["minHeight"],
  viewportMode: LandingRenderableViewportMode,
): CSSProperties["minHeight"] {
  return `max(0px, calc(${baseMinHeight} - ${resolveLandingNavbarOffsetCssValue(
    viewportMode,
  )}))`;
}

export function resolveLandingSectionMinHeight(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: LandingSectionMinHeightOptions,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const sectionRole = options?.sectionRole ?? "hero";

  const baseMinHeight = resolveLandingBaseSectionMinHeight(
    normalizedViewportMode,
    {
      preferDynamicViewport: options?.preferDynamicViewport,
    },
  );

  if (
    !shouldSubtractNavbarOffset(
      normalizedViewportMode,
      sectionRole,
      options?.subtractNavbarOffset,
    )
  ) {
    return baseMinHeight;
  }

  return toViewportHeightMinusNavbar(baseMinHeight, normalizedViewportMode);
}

export function resolveLandingHeroSectionMinHeight(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Omit<LandingSectionMinHeightOptions, "sectionRole">,
): CSSProperties["minHeight"] {
  return resolveLandingSectionMinHeight(viewportMode, {
    ...options,
    sectionRole: "hero",
    subtractNavbarOffset: false,
  });
}

export function resolveLandingContentSectionMinHeight(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Omit<LandingSectionMinHeightOptions, "sectionRole">,
): CSSProperties["minHeight"] {
  return resolveLandingSectionMinHeight(viewportMode, {
    ...options,
    sectionRole: "content",
  });
}

export function resolveLandingSectionViewportFallback(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Pick<
    LandingSectionMinHeightOptions,
    "sectionRole" | "subtractNavbarOffset"
  >,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const sectionRole = options?.sectionRole ?? "hero";

  const stableMinHeight =
    landingLayoutTokens.sectionMinHeight[normalizedViewportMode].stable;

  if (
    !shouldSubtractNavbarOffset(
      normalizedViewportMode,
      sectionRole,
      options?.subtractNavbarOffset,
    )
  ) {
    return stableMinHeight;
  }

  return toViewportHeightMinusNavbar(stableMinHeight, normalizedViewportMode);
}
