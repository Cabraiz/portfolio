import {
	Suspense,
	createElement,
	lazy,
	type ComponentType,
	type CSSProperties,
} from "react";

import type { LandingSectionId } from "@/features/navigation/landingSections";

import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";

import LandingSectionSkeleton from "./LandingSectionSkeleton";
import type {
	LandingSectionBehavior,
	LandingSectionDefinition,
	LandingSectionViewportMode,
} from "./landing.types";
import {
	resolveLandingNavbarOffsetPx,
	resolveLandingScrollMarginTop,
	resolveLandingSectionMinHeight,
	type LandingSectionHeightRole,
} from "./landingLayout.tokens";

const ContactDesktop = lazy(() => import("../Contact/ContactDesktop"));
const ContactMobile = lazy(() => import("../Contact/ContactMobile"));
const HomeDesktop = lazy(() => import("../Home/variants/HomeDesktop"));
const HomeMobile = lazy(() => import("../Home/variants/HomeMobile"));
const Live = lazy(() => import("../Live/Live"));
const Portfolio = lazy(() => import("../Portfolio/Portfolio"));
const RoadMap = lazy(() => import("../RoadMap/RoadMap"));
const RoadMapMobile = lazy(() => import("../RoadMap/RoadMapMobile"));
const Services = lazy(() => import("../Services/Services"));
const Technologies = lazy(() => import("../Technologies/Technologies"));

const SHOW_LEGACY_ROADMAP = false;

type LandingRenderableViewportMode = "desktop" | "mobile";

export type LandingSectionRenderHints = Readonly<{
	alwaysMountedOnDesktop?: boolean;
	prefersStableRender?: boolean;
	urlSyncEligible?: boolean;
	preferredNearDistance?: number;
	disableFarOnDesktop?: boolean;
}>;

type LandingSectionViewportConfig = Readonly<{
	Component: ComponentType;
	sectionRole: LandingSectionHeightRole;
	expectedMinHeight: CSSProperties["minHeight"];
	navbarOffsetPx: number;
	scrollMarginTop: CSSProperties["scrollMarginTop"];
	behavior?: LandingSectionBehavior;
	sectionStyle?: CSSProperties;
	contentStyle?: CSSProperties;
	renderHints?: LandingSectionRenderHints;
}>;

export type LandingSectionConfig = Readonly<{
	id: LandingSectionId;
	order: number;
	desktop: LandingSectionViewportConfig;
	mobile: LandingSectionViewportConfig;
}>;

export type LandingSectionResolvedDefinition = Readonly<
	LandingSectionDefinition<LandingSectionId> &
		LandingSectionRenderHints & {
			order: number;
			navbarOffsetPx: number;
			expectedMinHeight: CSSProperties["minHeight"];
			scrollMarginTop: CSSProperties["scrollMarginTop"];
		}
>;

export type LandingRenderPolicyOptions = Readonly<{
	nearDistance: number;
	stableNearDistance: number;
	disableFar: boolean;
	alwaysMountedSectionIds: readonly LandingSectionId[];
	stableSectionIds: readonly LandingSectionId[];
	urlSyncEligibleSectionIds: readonly LandingSectionId[];
}>;

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

function renderSuspenseFallback(
	variant: "hero" | "portfolio" | "roadmap" | "content",
	minHeight: CSSProperties["minHeight"] = "100%"
) {
	return (
		<LandingSectionSkeleton
			variant={variant}
			fullHeight
			minHeight={minHeight}
		/>
	);
}

function RoadMapDesktopWithBoundary() {
	return (
		<RoadMapErrorBoundary
			sectionLabel="RoadMap desktop"
			fallbackTitle="A seção RoadMap desktop quebrou"
			resetKey="roadmap-desktop"
			fullHeight
			minHeight="100%"
		>
			<Suspense fallback={renderSuspenseFallback("roadmap", "100%")}>
				<RoadMap />
			</Suspense>
		</RoadMapErrorBoundary>
	);
}

function RoadMapMobileWithBoundary() {
	return (
		<RoadMapErrorBoundary
			sectionLabel="RoadMap mobile"
			fallbackTitle="A seção RoadMap mobile quebrou"
			resetKey="roadmap-mobile"
			fullHeight
			minHeight="100%"
		>
			<Suspense fallback={renderSuspenseFallback("roadmap", "100%")}>
				<RoadMapMobile />
			</Suspense>
		</RoadMapErrorBoundary>
	);
}

function ServicesDesktopEntry() {
	return SHOW_LEGACY_ROADMAP ? <RoadMapDesktopWithBoundary /> : <Services />;
}

function ServicesMobileEntry() {
	return SHOW_LEGACY_ROADMAP ? <RoadMapMobileWithBoundary /> : <Services />;
}

function createViewportConfig(
	viewportMode: LandingRenderableViewportMode,
	Component: ComponentType,
	behavior: LandingSectionBehavior,
	options?: Readonly<{
		sectionRole?: LandingSectionHeightRole;
		subtractNavbarOffset?: boolean;
		sectionStyle?: CSSProperties;
		contentStyle?: CSSProperties;
		renderHints?: LandingSectionRenderHints;
	}>
): LandingSectionViewportConfig {
	const sectionRole = options?.sectionRole ?? "content";

	const expectedMinHeight = resolveLandingSectionMinHeight(viewportMode, {
		preferDynamicViewport: viewportMode === "desktop",
		sectionRole,
		subtractNavbarOffset: options?.subtractNavbarOffset,
	});

	const scrollMarginTop = resolveLandingScrollMarginTop(viewportMode);
	const isHeroSection = sectionRole === "hero";

	const defaultSectionStyle: CSSProperties = {
		minHeight: expectedMinHeight,
		height: isHeroSection ? expectedMinHeight : "auto",
		scrollMarginTop,
	};

	const defaultContentStyle: CSSProperties = isHeroSection
		? {
				minHeight: "100%",
				height: "100%",
			}
		: {
				minHeight: "100%",
				height: "auto",
			};

	return {
		Component,
		sectionRole,
		expectedMinHeight,
		navbarOffsetPx: resolveLandingNavbarOffsetPx(viewportMode),
		scrollMarginTop,
		behavior,
		sectionStyle: {
			...defaultSectionStyle,
			...options?.sectionStyle,
		},
		contentStyle: {
			...defaultContentStyle,
			...options?.contentStyle,
		},
		renderHints:
			viewportMode === "desktop"
				? {
						...DESKTOP_STABLE_CONTENT_RENDER_HINTS,
						...options?.renderHints,
					}
				: {
						...MOBILE_DEFAULT_RENDER_HINTS,
						...options?.renderHints,
					},
	};
}

function normalizeConfigViewportMode(
	viewportMode?: LandingSectionViewportMode
): LandingRenderableViewportMode {
	return viewportMode === "mobile" ? "mobile" : "desktop";
}

function toLandingSectionDefinition(
	config: LandingSectionConfig,
	viewportMode: LandingRenderableViewportMode
): LandingSectionResolvedDefinition {
	const viewportConfig = config[viewportMode];
	const renderHints = viewportConfig.renderHints ?? {};

	return {
		id: config.id,
		order: config.order,
		viewportMode,
		content: (
			<Suspense
				fallback={renderSuspenseFallback(
					config.id === "home"
						? "hero"
						: config.id === "portfolio"
							? "portfolio"
							: config.id === "roadMap"
								? "roadmap"
								: "content",
					viewportConfig.expectedMinHeight
				)}
			>
				{createElement(viewportConfig.Component)}
			</Suspense>
		),
		placeholderMinHeight: viewportConfig.expectedMinHeight,
		sectionStyle: viewportConfig.sectionStyle,
		contentStyle: viewportConfig.contentStyle,
		behavior: viewportConfig.behavior,
		navbarOffsetPx: viewportConfig.navbarOffsetPx,
		expectedMinHeight: viewportConfig.expectedMinHeight,
		scrollMarginTop: viewportConfig.scrollMarginTop,
		alwaysMountedOnDesktop: renderHints.alwaysMountedOnDesktop,
		prefersStableRender: renderHints.prefersStableRender,
		urlSyncEligible: renderHints.urlSyncEligible,
		preferredNearDistance: renderHints.preferredNearDistance,
		disableFarOnDesktop: renderHints.disableFarOnDesktop,
	};
}

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
				sectionStyle: {
					minHeight: resolveLandingSectionMinHeight("mobile", {
						preferDynamicViewport: false,
						sectionRole: "hero",
					}),
					height: "auto",
					padding: 0,
					overflow: "visible",
					background: "transparent",
					backgroundImage: "none",
				},
				contentStyle: {
					minHeight: "100%",
					height: "auto",
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
			Technologies,
			DESKTOP_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
				renderHints: DESKTOP_STABLE_CONTENT_RENDER_HINTS,
			}
		),
		mobile: createViewportConfig(
			"mobile",
			Technologies,
			MOBILE_CONTENT_VIRTUALIZED_BEHAVIOR,
			{
				sectionRole: "content",
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
			}
		),
	},
] as const satisfies readonly LandingSectionConfig[];

export const LANDING_SECTION_ORDER: ReadonlyArray<LandingSectionId> =
	LANDING_SECTIONS_CONFIG.map((section) => section.id);

export function getLandingSectionsConfig(): readonly LandingSectionConfig[] {
	return LANDING_SECTIONS_CONFIG;
}

export function getLandingSectionConfig(
	sectionId: LandingSectionId
): LandingSectionConfig | undefined {
	return LANDING_SECTIONS_CONFIG.find((section) => section.id === sectionId);
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

	return LANDING_SECTIONS_CONFIG.slice()
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
