import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { getSectionIdByPath } from "@/features/navigation/landingSections";

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

function normalizeSectionKey(section: string): string {
  return section
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function normalizeSectionList(sections: readonly string[]): Set<string> {
  return new Set(sections.map(normalizeSectionKey).filter(Boolean));
}

function resolveCurrentSectionFromPathname(
  pathname: string,
  defaultSectionId: string,
): string {
  const landingSectionId = getSectionIdByPath(pathname);

  if (landingSectionId) {
    return landingSectionId;
  }

  const normalizedPath = pathname.trim();

  if (!normalizedPath || normalizedPath === "/") {
    return defaultSectionId;
  }

  const routeSection = normalizeSectionKey(normalizedPath);

  return routeSection || defaultSectionId;
}

export function useSectionVisibility({
  defaultSectionId = "home",
  navHiddenSections = ["enigma"],
  floatingHiddenSections = ["enigma"],
  landingHiddenSections = ["enigma"],
  narrativeSections = ["enigma"],
}: UseSectionVisibilityParams = {}): SectionVisibilityState {
  const location = useLocation();

  const navHiddenSet = useMemo(
    () => normalizeSectionList(navHiddenSections),
    [navHiddenSections],
  );

  const floatingHiddenSet = useMemo(
    () => normalizeSectionList(floatingHiddenSections),
    [floatingHiddenSections],
  );

  const landingHiddenSet = useMemo(
    () => normalizeSectionList(landingHiddenSections),
    [landingHiddenSections],
  );

  const narrativeSet = useMemo(
    () => normalizeSectionList(narrativeSections),
    [narrativeSections],
  );

  const currentSection = useMemo(
    () => resolveCurrentSectionFromPathname(location.pathname, defaultSectionId),
    [defaultSectionId, location.pathname],
  );

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
    ],
  );
}

export default useSectionVisibility;
