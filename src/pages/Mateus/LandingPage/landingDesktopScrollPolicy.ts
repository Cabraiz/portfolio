import {
  DEFAULT_LANDING_SECTION_ID,
  type LandingSectionId,
} from "../../../features/navigation/landingSections";

import {
  resolveLandingActiveSectionTokens,
  type LandingActiveSectionCommitTokens,
} from "./landingActiveSection.tokens";
import { resolveLandingNavbarOffsetPx } from "./landingLayout.tokens";
import {
  getLandingRenderPolicyOptions,
  getLandingSectionDefinitions,
  type LandingRenderPolicyOptions,
} from "./landingSections.config";

const DEFAULT_DESKTOP_SECTION_SELECTOR =
  ":scope > section[data-page-section='true']";

export type LandingDesktopScrollEventSource =
  | "window-only"
  | "container-only";

export type LandingDesktopObservedPolicy = Readonly<{
  navbarOffsetPx: number;
  activationViewportRatio: number;
}>;

export type LandingDesktopCommitPolicy = Readonly<{
  commitVisibilityThreshold: number;
  releaseVisibilityThreshold: number;
  swapScoreDelta: number;
  distanceHysteresisPx: number;
  commitIdleMs: number;
}>;

export type LandingDesktopSchedulingPolicy = Readonly<{
  eventSource: LandingDesktopScrollEventSource;
  attachWindowScroll: boolean;
  attachContainerScroll: boolean;
  attachResizeObserver: boolean;
  listenResize: boolean;
  listenOrientationChange: boolean;
  useAnimationFrame: boolean;
  cancelPendingAnimationFrame: boolean;
  debounceMs: number;
}>;

export type LandingDesktopUrlPolicy = Readonly<{
  historyMode: "replace";
  eligibleSectionIds: readonly LandingSectionId[];
}>;

export type LandingDesktopScrollPolicy = Readonly<{
  viewportMode: "desktop";
  defaultSectionId: LandingSectionId;
  sectionSelector: string;
  sectionIds: readonly LandingSectionId[];
  tokens: ReturnType<typeof resolveLandingActiveSectionTokens>;
  observed: LandingDesktopObservedPolicy;
  commit: LandingDesktopCommitPolicy;
  render: LandingRenderPolicyOptions;
  scheduling: LandingDesktopSchedulingPolicy;
  url: LandingDesktopUrlPolicy;
}>;

export type ResolveLandingDesktopScrollPolicyOptions = Readonly<{
  defaultSectionId?: LandingSectionId;
  viewportWidth?: number | null;
  sectionSelector?: string;
  tokenOverrides?: Partial<LandingActiveSectionCommitTokens>;
  renderPolicyOverrides?: Partial<
    Pick<
      LandingRenderPolicyOptions,
      | "nearDistance"
      | "stableNearDistance"
      | "disableFar"
      | "alwaysMountedSectionIds"
      | "stableSectionIds"
      | "urlSyncEligibleSectionIds"
    >
  >;
}>;

export type LandingDesktopSectionRenderPolicyProps = Readonly<{
  viewportMode: "desktop";
  renderPolicy: LandingRenderPolicyOptions;
}>;

function uniqueSectionIds(
  sectionIds: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  return Array.from(new Set(sectionIds));
}

function sanitizePositiveInteger(
  value: number | undefined,
  fallbackValue: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallbackValue;
  }

  return Math.max(0, Math.floor(value));
}

function resolveDefaultDesktopSectionId(
  sectionIds: readonly LandingSectionId[],
  requestedDefaultSectionId: LandingSectionId,
): LandingSectionId {
  if (sectionIds.includes(requestedDefaultSectionId)) {
    return requestedDefaultSectionId;
  }

  return sectionIds[0] ?? DEFAULT_LANDING_SECTION_ID;
}

function shouldDisableFarOnDesktop(
  baseRenderPolicy: LandingRenderPolicyOptions,
  overrideDisableFar?: boolean,
): boolean {
  if (typeof overrideDisableFar === "boolean") {
    return overrideDisableFar;
  }

  return baseRenderPolicy.disableFar;
}

function mergeSectionIdLists(
  baseSectionIds: readonly LandingSectionId[],
  overrideSectionIds?: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  return uniqueSectionIds([
    ...baseSectionIds,
    ...(overrideSectionIds ?? []),
  ]);
}

export function resolveLandingDesktopScrollPolicy(
  options: ResolveLandingDesktopScrollPolicyOptions = {},
): LandingDesktopScrollPolicy {
  const tokens = resolveLandingActiveSectionTokens("desktop", {
    viewportWidth: options.viewportWidth,
    overrides: options.tokenOverrides,
  });

  const sections = getLandingSectionDefinitions("desktop");
  const sectionIds = sections.map((section) => section.id);

  const defaultSectionId = resolveDefaultDesktopSectionId(
    sectionIds,
    options.defaultSectionId ?? DEFAULT_LANDING_SECTION_ID,
  );

  const baseRenderPolicy = getLandingRenderPolicyOptions("desktop");

  const nearDistance = Math.max(
    sanitizePositiveInteger(
      options.renderPolicyOverrides?.nearDistance,
      baseRenderPolicy.nearDistance,
    ),
    baseRenderPolicy.nearDistance,
    tokens.preferredNearDistance,
  );

  const stableNearDistance = Math.max(
    sanitizePositiveInteger(
      options.renderPolicyOverrides?.stableNearDistance,
      baseRenderPolicy.stableNearDistance,
    ),
    baseRenderPolicy.stableNearDistance,
    nearDistance,
  );

  const disableFar = shouldDisableFarOnDesktop(
    baseRenderPolicy,
    options.renderPolicyOverrides?.disableFar,
  );

  const render: LandingRenderPolicyOptions = {
    nearDistance,
    stableNearDistance,
    disableFar,
    alwaysMountedSectionIds: mergeSectionIdLists(
      baseRenderPolicy.alwaysMountedSectionIds,
      options.renderPolicyOverrides?.alwaysMountedSectionIds,
    ),
    stableSectionIds: mergeSectionIdLists(
      [
        ...baseRenderPolicy.stableSectionIds,
        ...baseRenderPolicy.alwaysMountedSectionIds,
      ],
      options.renderPolicyOverrides?.stableSectionIds,
    ),
    urlSyncEligibleSectionIds: mergeSectionIdLists(
      baseRenderPolicy.urlSyncEligibleSectionIds,
      options.renderPolicyOverrides?.urlSyncEligibleSectionIds,
    ),
  };

  return {
    viewportMode: "desktop",
    defaultSectionId,
    sectionSelector:
      options.sectionSelector ?? DEFAULT_DESKTOP_SECTION_SELECTOR,
    sectionIds,
    tokens,
    observed: {
      navbarOffsetPx: resolveLandingNavbarOffsetPx("desktop"),
      activationViewportRatio: tokens.activationViewportRatio,
    },
    commit: {
      commitVisibilityThreshold: tokens.commitVisibilityThreshold,
      releaseVisibilityThreshold: tokens.releaseVisibilityThreshold,
      swapScoreDelta: tokens.swapScoreDelta,
      distanceHysteresisPx: tokens.distanceHysteresisPx,
      commitIdleMs: tokens.commitIdleMs,
    },
    render,
    scheduling: {
      eventSource: "window-only",
      attachWindowScroll: true,
      attachContainerScroll: false,
      attachResizeObserver: true,
      listenResize: true,
      listenOrientationChange: true,
      useAnimationFrame: true,
      cancelPendingAnimationFrame: true,
      debounceMs: 0,
    },
    url: {
      historyMode: "replace",
      eligibleSectionIds: render.urlSyncEligibleSectionIds,
    },
  };
}

export function resolveLandingDesktopSectionRenderPolicyProps(
  policy: LandingDesktopScrollPolicy,
): LandingDesktopSectionRenderPolicyProps {
  return {
    viewportMode: policy.viewportMode,
    renderPolicy: policy.render,
  };
}

export function shouldLandingDesktopAttachContainerScroll(
  _container: HTMLElement | null,
): boolean {
  return false;
}

export function isLandingDesktopUrlSyncEligible(
  sectionId: LandingSectionId,
  policy: LandingDesktopScrollPolicy,
): boolean {
  return policy.url.eligibleSectionIds.includes(sectionId);
}
