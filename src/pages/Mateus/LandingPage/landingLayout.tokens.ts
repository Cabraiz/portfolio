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

const DESKTOP_NAVBAR_OFFSET_PX = 88;
const MOBILE_NAVBAR_OFFSET_PX = 88;

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
    scrollMarginTop: {
      desktop: `${DESKTOP_NAVBAR_OFFSET_PX}px`,
      mobile: `${MOBILE_NAVBAR_OFFSET_PX}px`,
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
  navbarOffsetPx: number,
): CSSProperties["minHeight"] {
  return `max(0px, calc(${baseMinHeight} - ${navbarOffsetPx}px))`;
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

  return toViewportHeightMinusNavbar(
    baseMinHeight,
    resolveLandingNavbarOffsetPx(normalizedViewportMode),
  );
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

  return toViewportHeightMinusNavbar(
    stableMinHeight,
    resolveLandingNavbarOffsetPx(normalizedViewportMode),
  );
}
