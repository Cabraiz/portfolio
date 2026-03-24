import type { CSSProperties } from "react";

import type { LandingSectionViewportMode } from "./landing.types";

export type LandingRenderableViewportMode = "desktop" | "mobile";

export type LandingResponsiveSpacing = Readonly<{
  sectionPaddingInline: CSSProperties["paddingInline"];
  sectionPaddingBlockStart: CSSProperties["paddingTop"];
  sectionPaddingBlockEnd: CSSProperties["paddingBottom"];
  contentGap: CSSProperties["gap"];
}>;

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
      desktop: 88,
      mobile: 88,
    },
    scrollMarginTop: {
      desktop: "88px",
      mobile: "88px",
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

export function resolveLandingNavbarOffsetPx(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): number {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.navbar.offsetPx[normalizedViewportMode];
}

export function resolveLandingScrollMarginTop(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): CSSProperties["scrollMarginTop"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.navbar.scrollMarginTop[normalizedViewportMode];
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

export function resolveLandingSectionMinHeight(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
  options?: Readonly<{
    preferDynamicViewport?: boolean;
  }>,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  const shouldPreferDynamicViewport =
    options?.preferDynamicViewport ??
    normalizedViewportMode === "desktop";

  const sectionMinHeight =
    landingLayoutTokens.sectionMinHeight[normalizedViewportMode];

  return shouldPreferDynamicViewport
    ? sectionMinHeight.dynamic
    : sectionMinHeight.stable;
}

export function resolveLandingSectionViewportFallback(
  viewportMode?: LandingSectionViewportMode | LandingRenderableViewportMode,
): CSSProperties["minHeight"] {
  const normalizedViewportMode =
    normalizeLandingRenderableViewportMode(viewportMode);

  return landingLayoutTokens.sectionMinHeight[normalizedViewportMode].stable;
}
