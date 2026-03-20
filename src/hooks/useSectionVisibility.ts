import { useMemo } from "react";
import useHashSectionSync from "@/features/scroll/useHashSectionSync";

type SectionVisibilityState = Readonly<{
  currentSection: string;
  isNavHidden: boolean;
  isFloatingHidden: boolean;
  isLandingHidden: boolean;
  isNarrativeMode: boolean;
}>;

type UseSectionVisibilityParams = Readonly<{
  defaultSectionId?: string;
  navHiddenSections?: readonly string[];
  floatingHiddenSections?: readonly string[];
  landingHiddenSections?: readonly string[];
  narrativeSections?: readonly string[];
}>;

function normalizeSectionList(sections: readonly string[]): Set<string> {
  return new Set(
    sections
      .map((section) => section.trim().replace(/^#/, ""))
      .filter(Boolean)
  );
}

export function useSectionVisibility({
  defaultSectionId = "home",
  navHiddenSections = ["enigma"],
  floatingHiddenSections = ["enigma"],
  landingHiddenSections = ["enigma"],
  narrativeSections = ["enigma"],
}: UseSectionVisibilityParams = {}): SectionVisibilityState {
  const { currentSectionId } = useHashSectionSync({
    defaultSectionId,
  });

  const navHiddenSet = useMemo(
    () => normalizeSectionList(navHiddenSections),
    [navHiddenSections]
  );

  const floatingHiddenSet = useMemo(
    () => normalizeSectionList(floatingHiddenSections),
    [floatingHiddenSections]
  );

  const landingHiddenSet = useMemo(
    () => normalizeSectionList(landingHiddenSections),
    [landingHiddenSections]
  );

  const narrativeSet = useMemo(
    () => normalizeSectionList(narrativeSections),
    [narrativeSections]
  );

  const currentSection = currentSectionId || defaultSectionId;

  return useMemo(
    () => ({
      currentSection,
      isNavHidden: navHiddenSet.has(currentSection),
      isFloatingHidden: floatingHiddenSet.has(currentSection),
      isLandingHidden: landingHiddenSet.has(currentSection),
      isNarrativeMode: narrativeSet.has(currentSection),
    }),
    [
      currentSection,
      floatingHiddenSet,
      landingHiddenSet,
      narrativeSet,
      navHiddenSet,
    ]
  );
}

export default useSectionVisibility;
