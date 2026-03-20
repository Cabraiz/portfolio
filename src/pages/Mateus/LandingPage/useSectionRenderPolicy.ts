import { useMemo } from "react";

export type SectionRenderState = "active" | "near" | "far";

export type SectionRenderPolicyItem = Readonly<{
  id: string;
  state: SectionRenderState;
  index: number;
  distanceFromActive: number;
}>;

type SectionDefinition = Readonly<{
  id: string;
}>;

type UseSectionRenderPolicyParams = Readonly<{
  sections: readonly SectionDefinition[];
  activeSectionId: string;
  nearDistance?: number;
}>;

type SectionRenderPolicyResult = Readonly<{
  activeIndex: number;
  getSectionState: (sectionId: string) => SectionRenderState;
  getSectionDistance: (sectionId: string) => number;
  items: readonly SectionRenderPolicyItem[];
  stateMap: ReadonlyMap<string, SectionRenderState>;
}>;

function resolveSectionState(
  distanceFromActive: number,
  nearDistance: number,
): SectionRenderState {
  if (distanceFromActive === 0) {
    return "active";
  }

  if (distanceFromActive <= nearDistance) {
    return "near";
  }

  return "far";
}

export default function useSectionRenderPolicy({
  sections,
  activeSectionId,
  nearDistance = 1,
}: UseSectionRenderPolicyParams): SectionRenderPolicyResult {
  return useMemo(() => {
    const safeNearDistance = Math.max(0, nearDistance);

    const activeIndex = sections.findIndex(
      (section) => section.id === activeSectionId,
    );

    const fallbackActiveIndex = activeIndex >= 0 ? activeIndex : 0;

    const items = sections.map((section, index) => {
      const distanceFromActive = Math.abs(index - fallbackActiveIndex);

      return {
        id: section.id,
        state: resolveSectionState(distanceFromActive, safeNearDistance),
        index,
        distanceFromActive,
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
  }, [activeSectionId, nearDistance, sections]);
}
