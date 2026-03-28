import { useMemo } from "react";

import type { LandingRenderPolicyOptions } from "./landingSections.config";
import type { LandingSectionViewportMode } from "./landing.types";

export type SectionRenderState = "active" | "near" | "far";

export type SectionRenderPolicySection = Readonly<{
  id: string;
  alwaysMountedOnDesktop?: boolean;
  prefersStableRender?: boolean;
  urlSyncEligible?: boolean;
  preferredNearDistance?: number;
  disableFarOnDesktop?: boolean;
}>;

export type SectionRenderPolicyItem = Readonly<{
  id: string;
  state: SectionRenderState;
  index: number;
  distanceFromActive: number;
  effectiveNearDistance: number;
  alwaysMounted: boolean;
  prefersStableRender: boolean;
  farDisabled: boolean;
  urlSyncEligible: boolean;
}>;

type ResolvedRenderPolicy = Readonly<{
  nearDistance: number;
  stableNearDistance: number;
  disableFar: boolean;
  alwaysMountedSectionIds: readonly string[];
  stableSectionIds: readonly string[];
  urlSyncEligibleSectionIds: readonly string[];
}>;

type UseSectionRenderPolicyParams = Readonly<{
  sections: readonly SectionRenderPolicySection[];
  activeSectionId: string;
  renderPolicy?: Partial<LandingRenderPolicyOptions>;
  nearDistance?: number;
  stableNearDistance?: number;
  disableFar?: boolean;
  viewportMode?: LandingSectionViewportMode;
}>;

type SectionRenderPolicyResult = Readonly<{
  activeIndex: number;
  getSectionState: (sectionId: string) => SectionRenderState;
  getSectionDistance: (sectionId: string) => number;
  items: readonly SectionRenderPolicyItem[];
  stateMap: ReadonlyMap<string, SectionRenderState>;
}>;

function normalizeSectionIdList(
  sectionIds?: readonly string[],
): readonly string[] {
  return Array.from(new Set(sectionIds ?? []));
}

function resolveResolvedRenderPolicy(params: Readonly<{
  renderPolicy?: Partial<LandingRenderPolicyOptions>;
  nearDistance?: number;
  stableNearDistance?: number;
  disableFar?: boolean;
}>): ResolvedRenderPolicy {
  const safeNearDistance = Math.max(
    0,
    Math.floor(params.renderPolicy?.nearDistance ?? params.nearDistance ?? 1),
  );

  const safeStableNearDistance = Math.max(
    safeNearDistance,
    Math.floor(
      params.renderPolicy?.stableNearDistance ??
        params.stableNearDistance ??
        3,
    ),
  );

  return {
    nearDistance: safeNearDistance,
    stableNearDistance: safeStableNearDistance,
    disableFar: Boolean(
      params.renderPolicy?.disableFar ?? params.disableFar ?? false,
    ),
    alwaysMountedSectionIds: normalizeSectionIdList(
      params.renderPolicy?.alwaysMountedSectionIds,
    ),
    stableSectionIds: normalizeSectionIdList(
      params.renderPolicy?.stableSectionIds,
    ),
    urlSyncEligibleSectionIds: normalizeSectionIdList(
      params.renderPolicy?.urlSyncEligibleSectionIds,
    ),
  };
}

function resolveEffectiveNearDistance(
  section: SectionRenderPolicySection,
  baseNearDistance: number,
  stableNearDistance: number,
  isDesktop: boolean,
  alwaysMounted: boolean,
  prefersStableRender: boolean,
  farDisabled: boolean,
): number {
  if (!isDesktop) {
    return baseNearDistance;
  }

  if (alwaysMounted || farDisabled) {
    return Number.POSITIVE_INFINITY;
  }

  let nextNearDistance = baseNearDistance;

  if (prefersStableRender) {
    nextNearDistance = Math.max(nextNearDistance, stableNearDistance);
  }

  if (typeof section.preferredNearDistance === "number") {
    nextNearDistance = Math.max(
      nextNearDistance,
      Math.max(0, Math.floor(section.preferredNearDistance)),
    );
  }

  return nextNearDistance;
}

function resolveSectionState(
  distanceFromActive: number,
  effectiveNearDistance: number,
  farDisabled: boolean,
): SectionRenderState {
  if (distanceFromActive === 0) {
    return "active";
  }

  if (farDisabled) {
    return "near";
  }

  if (distanceFromActive <= effectiveNearDistance) {
    return "near";
  }

  return "far";
}

export default function useSectionRenderPolicy({
  sections,
  activeSectionId,
  renderPolicy,
  nearDistance,
  stableNearDistance,
  disableFar,
  viewportMode = "desktop",
}: UseSectionRenderPolicyParams): SectionRenderPolicyResult {
  return useMemo(() => {
    const resolvedRenderPolicy = resolveResolvedRenderPolicy({
      renderPolicy,
      nearDistance,
      stableNearDistance,
      disableFar,
    });

    const isDesktop = viewportMode !== "mobile";

    const alwaysMountedSectionIdSet = new Set(
      resolvedRenderPolicy.alwaysMountedSectionIds,
    );
    const stableSectionIdSet = new Set(resolvedRenderPolicy.stableSectionIds);
    const urlSyncEligibleSectionIdSet = new Set(
      resolvedRenderPolicy.urlSyncEligibleSectionIds,
    );

    const activeIndex = sections.findIndex(
      (section) => section.id === activeSectionId,
    );

    const fallbackActiveIndex = activeIndex >= 0 ? activeIndex : 0;

    const items = sections.map((section, index) => {
      const distanceFromActive = Math.abs(index - fallbackActiveIndex);

      const alwaysMounted =
        isDesktop &&
        (Boolean(section.alwaysMountedOnDesktop) ||
          alwaysMountedSectionIdSet.has(section.id));

      const prefersStableRender =
        isDesktop &&
        (Boolean(section.prefersStableRender) ||
          stableSectionIdSet.has(section.id) ||
          alwaysMounted);

      const farDisabled =
        isDesktop &&
        (resolvedRenderPolicy.disableFar ||
          Boolean(section.disableFarOnDesktop) ||
          alwaysMounted);

      const effectiveNearDistance = resolveEffectiveNearDistance(
        section,
        resolvedRenderPolicy.nearDistance,
        resolvedRenderPolicy.stableNearDistance,
        isDesktop,
        alwaysMounted,
        prefersStableRender,
        farDisabled,
      );

      return {
        id: section.id,
        state: resolveSectionState(
          distanceFromActive,
          effectiveNearDistance,
          farDisabled,
        ),
        index,
        distanceFromActive,
        effectiveNearDistance,
        alwaysMounted,
        prefersStableRender,
        farDisabled,
        urlSyncEligible:
          Boolean(section.urlSyncEligible) ||
          urlSyncEligibleSectionIdSet.has(section.id),
      } satisfies SectionRenderPolicyItem;
    });

    const stateMap = new Map<string, SectionRenderState>(
      items.map((item) => [item.id, item.state]),
    );

    return {
      activeIndex: fallbackActiveIndex,
      getSectionState: (sectionId: string): SectionRenderState =>
        stateMap.get(sectionId) ?? "far",
      getSectionDistance: (sectionId: string): number => {
        const item = items.find((entry) => entry.id === sectionId);
        return item?.distanceFromActive ?? Number.POSITIVE_INFINITY;
      },
      items,
      stateMap,
    };
  }, [
    activeSectionId,
    disableFar,
    nearDistance,
    renderPolicy,
    sections,
    stableNearDistance,
    viewportMode,
  ]);
}
