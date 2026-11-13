// Tipos da configuração das seções da landing.
import type { ComponentType, CSSProperties } from "react";

import type { LandingSectionId } from "@/features/navigation/landingSections";

import type {
	LandingSectionBehavior,
	LandingSectionDefinition,
} from "./landing.types";
import type { LandingSectionHeightRole } from "./landingLayout.tokens";

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

export type { LandingRenderableViewportMode, LandingSectionViewportConfig };
