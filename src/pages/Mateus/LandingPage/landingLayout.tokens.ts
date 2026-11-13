import type { CSSProperties } from "react";

import {
  NAVBAR_HEIGHT_CSS_VAR,
  getNavbarHeight,
} from "../../../App/NavBar/navbar.constants";
import type { LandingSectionViewportMode } from "./landing.types";
import {
  LANDING_NAVBAR_SCROLL_ALIGNMENT_PX,
  landingLayoutTokens,
  normalizeLandingRenderableViewportMode,
  type LandingRenderableViewportMode,
  type LandingResponsiveSpacing,
  type LandingSectionHeightRole,
  type LandingSectionMinHeightOptions,
} from "./landingLayout.tokens.base";
import { resolveLandingNavbarOffsetCssValue } from "./landingLayout.tokens.navbar";

export type {
  LandingRenderableViewportMode,
  LandingSectionHeightRole,
  LandingResponsiveSpacing,
  LandingSectionMinHeightOptions,
} from "./landingLayout.tokens.base";
export {
  landingLayoutTokens,
  normalizeLandingRenderableViewportMode,
  resolveLandingViewportModeByWidth,
} from "./landingLayout.tokens.base";
export {
  resolveLandingNavbarFallbackOffsetPx,
  resolveLandingNavbarOffsetPx,
  syncLandingNavbarOffset,
  subscribeToLandingNavbarOffset,
} from "./landingLayout.tokens.navbar";

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
    normalizedViewportMode === "mobile" || (options?.preferDynamicViewport ?? true);

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
    normalizedViewportMode === "mobile" || (options?.preferDynamicViewport ?? true);

  const sectionMinHeight =
    landingLayoutTokens.sectionMinHeight[normalizedViewportMode];

  return shouldPreferDynamicViewport
    ? sectionMinHeight.dynamic
    : sectionMinHeight.stable;
}

function shouldSubtractNavbarOffset(
  _viewportMode: LandingRenderableViewportMode,
  _sectionRole: LandingSectionHeightRole,
  explicitPreference?: boolean,
): boolean {
  if (typeof explicitPreference === "boolean") {
    return explicitPreference;
  }

	return false;
}

function toViewportHeightMinusNavbar(
  baseMinHeight: CSSProperties["minHeight"],
  viewportMode: LandingRenderableViewportMode,
  sectionRole: LandingSectionHeightRole,
): CSSProperties["minHeight"] {
  const navbarHeight = getNavbarHeight(viewportMode === "mobile");
  const alignment = viewportMode === "mobile" && sectionRole === "content"
    ? ` - ${LANDING_NAVBAR_SCROLL_ALIGNMENT_PX}px`
    : "";

  const headerHeight = viewportMode === 'mobile' && sectionRole === 'hero'
    ? `${navbarHeight}px`
    : `var(${NAVBAR_HEIGHT_CSS_VAR}, ${navbarHeight}px)`;
  return `max(0px, calc(${baseMinHeight} - ${headerHeight}${alignment}))`;
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

  return toViewportHeightMinusNavbar(baseMinHeight, normalizedViewportMode, sectionRole);
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

  return toViewportHeightMinusNavbar(stableMinHeight, normalizedViewportMode, sectionRole);
}
