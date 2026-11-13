// Comportamentos e dicas de render padrão por viewport.
import type { LandingSectionBehavior } from "./landing.types";
import { resolveLandingSectionMinHeight } from "./landingLayout.tokens";
import type { LandingSectionRenderHints } from "./landingSections.config.types";

const DESKTOP_HERO_STABLE_BEHAVIOR: LandingSectionBehavior = {
	renderStrategy: "always-mounted",
	measurementStrategy: "none",
	cacheMeasurements: false,
	keepMountedWhenNear: true,
	placeholderFallbackMinHeight: resolveLandingSectionMinHeight("desktop", {
		preferDynamicViewport: true,
		sectionRole: "hero",
	}),
};

const DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR: LandingSectionBehavior = {
	renderStrategy: "placeholder-when-far",
	measurementStrategy: "resize-observer",
	cacheMeasurements: true,
	keepMountedWhenNear: true,
	placeholderFallbackMinHeight: resolveLandingSectionMinHeight("desktop", {
		preferDynamicViewport: true,
		sectionRole: "content",
	}),
};

const MOBILE_HERO_STABLE_BEHAVIOR: LandingSectionBehavior = {
	renderStrategy: "always-mounted",
	measurementStrategy: "none",
	cacheMeasurements: false,
	keepMountedWhenNear: true,
	placeholderFallbackMinHeight: resolveLandingSectionMinHeight("mobile", {
		preferDynamicViewport: false,
		sectionRole: "hero",
	}),
};

const MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR: LandingSectionBehavior = {
	renderStrategy: "placeholder-when-far",
	measurementStrategy: "resize-observer",
	cacheMeasurements: true,
	keepMountedWhenNear: true,
	placeholderFallbackMinHeight: resolveLandingSectionMinHeight("mobile", {
		preferDynamicViewport: false,
		sectionRole: "content",
	}),
};

const DESKTOP_HERO_RENDER_HINTS: LandingSectionRenderHints = {
	alwaysMountedOnDesktop: true,
	prefersStableRender: true,
	urlSyncEligible: true,
	preferredNearDistance: 1,
	disableFarOnDesktop: false,
};

const DESKTOP_STABLE_CONTENT_RENDER_HINTS: LandingSectionRenderHints = {
	alwaysMountedOnDesktop: false,
	prefersStableRender: false,
	urlSyncEligible: true,
	preferredNearDistance: 1,
	disableFarOnDesktop: false,
};

const MOBILE_DEFAULT_RENDER_HINTS: LandingSectionRenderHints = {
	alwaysMountedOnDesktop: false,
	prefersStableRender: false,
	urlSyncEligible: true,
	preferredNearDistance: 1,
	disableFarOnDesktop: false,
};

export {
	DESKTOP_HERO_STABLE_BEHAVIOR,
	DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
	MOBILE_HERO_STABLE_BEHAVIOR,
	MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
	DESKTOP_HERO_RENDER_HINTS,
	DESKTOP_STABLE_CONTENT_RENDER_HINTS,
	MOBILE_DEFAULT_RENDER_HINTS,
};
