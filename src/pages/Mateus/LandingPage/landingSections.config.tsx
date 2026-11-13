import { lazy } from "react";

import {
	VISIBLE_LANDING_SECTION_IDS,
	SHOW_LEGACY_LIVE_SECTION,
	type LandingSectionId,
} from "@/features/navigation/landingSections";

import type { LandingSectionViewportMode } from "./landing.types";
import { resolveLandingSectionMinHeight } from "./landingLayout.tokens";
import type {
	LandingRenderPolicyOptions,
	LandingSectionConfig,
	LandingSectionResolvedDefinition,
} from "./landingSections.config.types";
import {
	DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
	DESKTOP_HERO_RENDER_HINTS,
	DESKTOP_HERO_STABLE_BEHAVIOR,
	DESKTOP_STABLE_CONTENT_RENDER_HINTS,
	MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
	MOBILE_DEFAULT_RENDER_HINTS,
	MOBILE_HERO_STABLE_BEHAVIOR,
} from "./landingSections.config.behaviors";
import {
	ServicesDesktopEntry,
	ServicesMobileEntry,
	createViewportConfig,
	normalizeConfigViewportMode,
	toLandingSectionDefinition,
} from "./landingSections.config.factory";

export type {
	LandingSectionRenderHints,
	LandingSectionConfig,
	LandingSectionResolvedDefinition,
	LandingRenderPolicyOptions,
} from "./landingSections.config.types";

const ContactDesktop = lazy(() => import("../Contact/ContactDesktop"));
const ContactMobile = lazy(() => import("../Contact/ContactMobile"));
const HomeDesktop = lazy(() => import("../Home/variants/HomeDesktop"));
const HomeMobile = lazy(() => import("../Home/variants/HomeMobile"));
const Live = lazy(() => import("../Live/Live"));
const Portfolio = lazy(() => import("../Portfolio/Portfolio"));
const CognitiveNetwork = lazy(
	() => import("../CognitiveNetwork/CognitiveNetwork")
);

export const LANDING_SECTIONS_CONFIG = [
	{
		id: "home",
		order: 0,
		desktop: createViewportConfig(
			"desktop",
			HomeDesktop,
			DESKTOP_HERO_STABLE_BEHAVIOR,
			{
				sectionRole: "hero",
				sectionStyle: {
					overflow: "visible",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
				},
				renderHints: DESKTOP_HERO_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			HomeMobile,
			MOBILE_HERO_STABLE_BEHAVIOR,
			{
				sectionRole: "hero",
				subtractNavbarOffset: true,
				sectionStyle: {
					minHeight: resolveLandingSectionMinHeight("mobile", {
						preferDynamicViewport: false,
						sectionRole: "hero",
						subtractNavbarOffset: true,
					}),
					height: resolveLandingSectionMinHeight("mobile", {
						preferDynamicViewport: false,
						sectionRole: "hero",
						subtractNavbarOffset: true,
					}),
					padding: 0,
					overflow: "visible",
					background: "transparent",
					backgroundImage: "none",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
					padding: 0,
				},
				renderHints: {
					...MOBILE_DEFAULT_RENDER_HINTS,
					prefersStableRender: true,
					preferredNearDistance: 2,
				},
			}
		),
	},
	{
		id: "portfolio",
		order: 1,
		desktop: createViewportConfig(
			"desktop",
			Portfolio,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				renderHints: DESKTOP_STABLE_CONTENT_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			Portfolio,
                        MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
                        {
                                sectionRole: "content",
                                subtractNavbarOffset: false,
                                preferDynamicViewport: true,
                                sectionStyle: {
                                        scrollMarginTop: 0,
                                        background: "#dcefeb",
					backgroundImage: "none",
				},
			}
		),
	},
	{
		id: "roadMap",
		order: 2,
		desktop: createViewportConfig(
			"desktop",
			ServicesDesktopEntry,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				sectionStyle: {
					height: resolveLandingSectionMinHeight("desktop", {
						preferDynamicViewport: true,
						sectionRole: "content",
					}),
					overflow: "visible",
					background: "#171717",
					backgroundImage: "none",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
				},
				renderHints: {
					...DESKTOP_STABLE_CONTENT_RENDER_HINTS,
					preferredNearDistance: 0,
				},
			}
		),
		mobile: createViewportConfig(
			"mobile",
			ServicesMobileEntry,
			MOBILE_HERO_STABLE_BEHAVIOR,
			{
				sectionRole: "content",
				subtractNavbarOffset: true,
				sectionStyle: {
					height: resolveLandingSectionMinHeight("mobile", {
						preferDynamicViewport: false,
						sectionRole: "content",
						subtractNavbarOffset: true,
					}),
					overflow: "visible",
					background: "#171717",
					backgroundImage: "none",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
				},
			}
		),
	},
	{
		id: "technologies",
		order: 3,
		desktop: createViewportConfig(
			"desktop",
			CognitiveNetwork,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				sectionStyle: {
					height: resolveLandingSectionMinHeight("desktop", {
						preferDynamicViewport: true,
						sectionRole: "content",
					}),
					overflow: "visible",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
				},
				renderHints: DESKTOP_STABLE_CONTENT_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			CognitiveNetwork,
			MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				subtractNavbarOffset: true,
				sectionStyle: {
					height: resolveLandingSectionMinHeight("mobile", {
						preferDynamicViewport: false,
						sectionRole: "content",
						subtractNavbarOffset: true,
					}),
					overflow: "visible",
				},
				contentStyle: {
					minHeight: "100%",
					height: "100%",
					overflow: "visible",
				},
			}
		),
	},
	{
		id: "live",
		order: 4,
		desktop: createViewportConfig(
			"desktop",
			Live,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				renderHints: DESKTOP_STABLE_CONTENT_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			Live,
			MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				subtractNavbarOffset: true,
			}
		),
	},
	{
		id: "contact",
		order: 5,
		desktop: createViewportConfig(
			"desktop",
			ContactDesktop,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				renderHints: DESKTOP_STABLE_CONTENT_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			ContactMobile,
			MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				subtractNavbarOffset: true,
			}
		),
	},
] as const satisfies readonly LandingSectionConfig[];

export const LANDING_SECTION_ORDER: ReadonlyArray<LandingSectionId> =
	getLandingSectionsConfig().map((section) => section.id);

export function getLandingSectionsConfig(): readonly LandingSectionConfig[] {
	return SHOW_LEGACY_LIVE_SECTION
		? LANDING_SECTIONS_CONFIG
		: LANDING_SECTIONS_CONFIG.filter((section) => section.id !== "live");
}

export function getLandingSectionConfig(
	sectionId: LandingSectionId
): LandingSectionConfig | undefined {
	return getLandingSectionsConfig().find((section) => section.id === sectionId);
}

export function getLandingSectionDefinition(
	sectionId: LandingSectionId,
	viewportMode: LandingSectionViewportMode
): LandingSectionResolvedDefinition | null {
	const config = getLandingSectionConfig(sectionId);

	if (!config) {
		return null;
	}

	return toLandingSectionDefinition(
		config,
		normalizeConfigViewportMode(viewportMode)
	);
}

export function getLandingSectionDefinitions(
	viewportMode: LandingSectionViewportMode
): ReadonlyArray<LandingSectionResolvedDefinition> {
	const normalizedViewportMode = normalizeConfigViewportMode(viewportMode);

	return getLandingSectionsConfig()
		.filter((section) => VISIBLE_LANDING_SECTION_IDS.includes(section.id))
		.sort((left, right) => left.order - right.order)
		.map((section) =>
			toLandingSectionDefinition(section, normalizedViewportMode)
		);
}

export function getLandingUrlSyncEligibleSectionIds(
	viewportMode: LandingSectionViewportMode
): readonly LandingSectionId[] {
	return getLandingSectionDefinitions(viewportMode)
		.filter((section) => section.urlSyncEligible !== false)
		.map((section) => section.id);
}

export function getLandingRenderPolicyOptions(
	viewportMode: LandingSectionViewportMode
): LandingRenderPolicyOptions {
	const sections = getLandingSectionDefinitions(viewportMode);

	const alwaysMountedSectionIds = sections
		.filter((section) => section.alwaysMountedOnDesktop)
		.map((section) => section.id);

	const stableSectionIds = sections
		.filter((section) => section.prefersStableRender)
		.map((section) => section.id);

	const urlSyncEligibleSectionIds = sections
		.filter((section) => section.urlSyncEligible !== false)
		.map((section) => section.id);

	const preferredNearDistance = sections.reduce((maxDistance, section) => {
		if (section.alwaysMountedOnDesktop) {
			return maxDistance;
		}

		return Math.max(maxDistance, section.preferredNearDistance ?? 1);
	}, 0);

	const disableFar =
		viewportMode !== "mobile" &&
		sections.every((section) => section.disableFarOnDesktop === true);

	return {
		nearDistance: preferredNearDistance,
		stableNearDistance: preferredNearDistance,
		disableFar,
		alwaysMountedSectionIds,
		stableSectionIds,
		urlSyncEligibleSectionIds,
	};
}
