// Monta a config de cada viewport e a definição final de cada seção.
import {
	Suspense,
	createElement,
	lazy,
	type ComponentType,
	type CSSProperties,
} from "react";

import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";

import LandingSectionSkeleton from "./LandingSectionSkeleton";
import type {
	LandingSectionBehavior,
	LandingSectionViewportMode,
} from "./landing.types";
import {
	resolveLandingNavbarOffsetPx,
	resolveLandingScrollMarginTop,
	resolveLandingSectionMinHeight,
	type LandingSectionHeightRole,
} from "./landingLayout.tokens";
import type {
	LandingRenderableViewportMode,
	LandingSectionConfig,
	LandingSectionRenderHints,
	LandingSectionResolvedDefinition,
	LandingSectionViewportConfig,
} from "./landingSections.config.types";
import {
	DESKTOP_STABLE_CONTENT_RENDER_HINTS,
	MOBILE_DEFAULT_RENDER_HINTS,
} from "./landingSections.config.behaviors";

const RoadMap = lazy(() => import("../RoadMap/RoadMap"));
const RoadMapMobile = lazy(() => import("../RoadMap/RoadMapMobile"));
const Services = lazy(() => import("../Services/Services"));

const SHOW_LEGACY_ROADMAP = false;

function renderSuspenseFallback(
	variant: "hero" | "hero-mobile" | "portfolio" | "roadmap" | "content",
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
                preferDynamicViewport?: boolean;
		sectionStyle?: CSSProperties;
		contentStyle?: CSSProperties;
		renderHints?: LandingSectionRenderHints;
	}>
): LandingSectionViewportConfig {
	const sectionRole = options?.sectionRole ?? "content";

	const expectedMinHeight = resolveLandingSectionMinHeight(viewportMode, {
                preferDynamicViewport: options?.preferDynamicViewport ?? viewportMode === "desktop",
		sectionRole,
		subtractNavbarOffset: options?.subtractNavbarOffset,
	});

	const scrollMarginTop = resolveLandingScrollMarginTop(viewportMode);
	const isHeroSection = sectionRole === "hero";

	const defaultSectionStyle: CSSProperties = {
		minHeight: expectedMinHeight,
                height: isHeroSection || viewportMode === "mobile" ? expectedMinHeight : "auto",
		scrollMarginTop,
	};

        const defaultContentStyle: CSSProperties = isHeroSection || viewportMode === "mobile"
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
						? viewportMode === "mobile" ? "hero-mobile" : "hero"
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

export {
	ServicesDesktopEntry,
	ServicesMobileEntry,
	createViewportConfig,
	normalizeConfigViewportMode,
	toLandingSectionDefinition,
};
