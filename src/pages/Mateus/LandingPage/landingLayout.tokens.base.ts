// Tipos, constantes e tokens base do layout da landing.
import type { CSSProperties } from "react";

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
      preferred: "100dvh",
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

export { LANDING_NAVBAR_SCROLL_ALIGNMENT_PX, LANDING_NAVBAR_SELECTOR_CANDIDATES };
