import {
  createElement,
  type ComponentType,
  type CSSProperties,
} from "react";

import type { LandingSectionId } from "@/features/navigation/landingSections";

import MateusDesktop from "../MateusDesktop";
import ContactDesktop from "../Contact/ContactDesktop";
import ContactMobile from "../Contact/ContactMobile";
import Live from "../Live/Live";
import MateusMobile from "../MateusMobile/MateusMobile";
import Portfolio from "../Portfolio/Portfolio";
import Pricing from "../Pricing/Pricing";
import RoadMap from "../RoadMap/RoadMap";
import RoadMapMobile from "../RoadMap/RoadMapMobile";

import type {
  LandingSectionBehavior,
  LandingSectionDefinition,
  LandingSectionViewportMode,
} from "./landing.types";
import {
  resolveLandingNavbarOffsetPx,
  resolveLandingScrollMarginTop,
  resolveLandingSectionMinHeight,
} from "./landingLayout.tokens";

type LandingRenderableViewportMode = "desktop" | "mobile";

type LandingSectionViewportConfig = Readonly<{
  Component: ComponentType;
  expectedMinHeight: CSSProperties["minHeight"];
  navbarOffsetPx: number;
  scrollMarginTop: CSSProperties["scrollMarginTop"];
  behavior?: LandingSectionBehavior;
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
}>;

export type LandingSectionConfig = Readonly<{
  id: LandingSectionId;
  order: number;
  desktop: LandingSectionViewportConfig;
  mobile: LandingSectionViewportConfig;
}>;

const DESKTOP_VIRTUALIZED_BEHAVIOR: LandingSectionBehavior = {
  renderStrategy: "placeholder-when-far",
  measurementStrategy: "resize-observer",
  cacheMeasurements: true,
  keepMountedWhenNear: true,
  placeholderFallbackMinHeight: resolveLandingSectionMinHeight("desktop"),
};

const MOBILE_STABLE_BEHAVIOR: LandingSectionBehavior = {
  renderStrategy: "always-mounted",
  measurementStrategy: "none",
  cacheMeasurements: false,
  keepMountedWhenNear: true,
  placeholderFallbackMinHeight: resolveLandingSectionMinHeight("mobile", {
    preferDynamicViewport: false,
  }),
};

function createViewportConfig(
  viewportMode: LandingRenderableViewportMode,
  Component: ComponentType,
  behavior: LandingSectionBehavior,
): LandingSectionViewportConfig {
  const expectedMinHeight = resolveLandingSectionMinHeight(viewportMode, {
    preferDynamicViewport: viewportMode === "desktop",
  });

  const scrollMarginTop = resolveLandingScrollMarginTop(viewportMode);

  return {
    Component,
    expectedMinHeight,
    navbarOffsetPx: resolveLandingNavbarOffsetPx(viewportMode),
    scrollMarginTop,
    behavior,
    sectionStyle: {
      minHeight: expectedMinHeight,
      scrollMarginTop,
    },
    contentStyle: {
      minHeight: "100%",
    },
  };
}

export const LANDING_SECTIONS_CONFIG = [
  {
    id: "home",
    order: 0,
    desktop: createViewportConfig(
      "desktop",
      MateusDesktop,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      MateusMobile,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
  {
    id: "portfolio",
    order: 1,
    desktop: createViewportConfig(
      "desktop",
      Portfolio,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      Portfolio,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
  {
    id: "roadMap",
    order: 2,
    desktop: createViewportConfig(
      "desktop",
      RoadMap,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      RoadMapMobile,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
  {
    id: "pricing",
    order: 3,
    desktop: createViewportConfig(
      "desktop",
      Pricing,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      Pricing,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
  {
    id: "live",
    order: 4,
    desktop: createViewportConfig(
      "desktop",
      Live,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      Live,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
  {
    id: "contact",
    order: 5,
    desktop: createViewportConfig(
      "desktop",
      ContactDesktop,
      DESKTOP_VIRTUALIZED_BEHAVIOR,
    ),
    mobile: createViewportConfig(
      "mobile",
      ContactMobile,
      MOBILE_STABLE_BEHAVIOR,
    ),
  },
] as const satisfies readonly LandingSectionConfig[];

export const LANDING_SECTION_ORDER: ReadonlyArray<LandingSectionId> =
  LANDING_SECTIONS_CONFIG.map((section) => section.id);

function normalizeConfigViewportMode(
  viewportMode?: LandingSectionViewportMode,
): LandingRenderableViewportMode {
  return viewportMode === "mobile" ? "mobile" : "desktop";
}

export function getLandingSectionsConfig(): readonly LandingSectionConfig[] {
  return LANDING_SECTIONS_CONFIG;
}

export function getLandingSectionConfig(
  sectionId: LandingSectionId,
): LandingSectionConfig | undefined {
  return LANDING_SECTIONS_CONFIG.find((section) => section.id === sectionId);
}

export function getLandingSectionDefinition(
  sectionId: LandingSectionId,
  viewportMode: LandingSectionViewportMode,
): LandingSectionDefinition<LandingSectionId> | null {
  const config = getLandingSectionConfig(sectionId);

  if (!config) {
    return null;
  }

  const normalizedViewportMode = normalizeConfigViewportMode(viewportMode);
  const viewportConfig = config[normalizedViewportMode];

  return {
    id: config.id,
    viewportMode: normalizedViewportMode,
    content: createElement(viewportConfig.Component),
    placeholderMinHeight: viewportConfig.expectedMinHeight,
    sectionStyle: viewportConfig.sectionStyle,
    contentStyle: viewportConfig.contentStyle,
    behavior: viewportConfig.behavior,
  };
}

export function getLandingSectionDefinitions(
  viewportMode: LandingSectionViewportMode,
): ReadonlyArray<LandingSectionDefinition<LandingSectionId>> {
  const normalizedViewportMode = normalizeConfigViewportMode(viewportMode);

  return LANDING_SECTIONS_CONFIG
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => {
      const viewportConfig = section[normalizedViewportMode];

      return {
        id: section.id,
        viewportMode: normalizedViewportMode,
        content: createElement(viewportConfig.Component),
        placeholderMinHeight: viewportConfig.expectedMinHeight,
        sectionStyle: viewportConfig.sectionStyle,
        contentStyle: viewportConfig.contentStyle,
        behavior: viewportConfig.behavior,
      } satisfies LandingSectionDefinition<LandingSectionId>;
    });
}
