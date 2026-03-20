import { useLayoutEffect } from "react";
import type { RefObject } from "react";

import { createScrollTrigger, refreshScrollRuntime } from "./gsapRuntime";

type SectionElement = HTMLElement;
type SectionTriggerInstance = ReturnType<typeof createScrollTrigger>;

type UseSectionTriggersParams = Readonly<{
  containerRef: RefObject<HTMLElement | null>;
  sectionSelector?: string;
  activeClassName?: string;
  triggerStart?: string;
  triggerEnd?: string;
  refreshOnMount?: boolean;
  onSectionChange?: (sectionId: string, element: SectionElement) => void;
}>;

function getSections(
  container: HTMLElement,
  sectionSelector: string,
): SectionElement[] {
  return Array.from(
    container.querySelectorAll<SectionElement>(sectionSelector),
  );
}

function getSectionId(section: SectionElement): string {
  return (
    section.dataset.section ??
    section.getAttribute("data-section") ??
    section.id ??
    ""
  );
}

function setActiveSection(
  sections: SectionElement[],
  nextActiveSection: SectionElement,
  activeClassName: string,
  onSectionChange?: (sectionId: string, element: SectionElement) => void,
): void {
  sections.forEach((section) => {
    const isActive = section === nextActiveSection;
    section.classList.toggle(activeClassName, isActive);
    section.dataset.sectionActive = isActive ? "true" : "false";
  });

  const sectionId = getSectionId(nextActiveSection);

  if (sectionId && onSectionChange) {
    onSectionChange(sectionId, nextActiveSection);
  }
}

function clearActiveSection(
  sections: SectionElement[],
  activeClassName: string,
): void {
  sections.forEach((section) => {
    section.classList.remove(activeClassName);
    delete section.dataset.sectionActive;
  });
}

export function useSectionTriggers({
  containerRef,
  sectionSelector = "section[id], section[data-section]",
  activeClassName = "is-active",
  triggerStart = "top center",
  triggerEnd = "bottom center",
  refreshOnMount = false,
  onSectionChange,
}: UseSectionTriggersParams): void {
  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const sections = getSections(container, sectionSelector);

    if (sections.length === 0) {
      return;
    }

    const createdTriggers: SectionTriggerInstance[] = [];

    sections.forEach((section, index) => {
      const resolvedSectionId = getSectionId(section) || String(index);

      const trigger = createScrollTrigger({
        id: `section-trigger:${resolvedSectionId}`,
        trigger: section,
        start: triggerStart,
        end: triggerEnd,
        onEnter: () => {
          setActiveSection(
            sections,
            section,
            activeClassName,
            onSectionChange,
          );
        },
        onEnterBack: () => {
          setActiveSection(
            sections,
            section,
            activeClassName,
            onSectionChange,
          );
        },
      });

      createdTriggers.push(trigger);
    });

    if (!sections.some((section) => section.classList.contains(activeClassName))) {
      setActiveSection(
        sections,
        sections[0],
        activeClassName,
        onSectionChange,
      );
    }

    if (refreshOnMount) {
      refreshScrollRuntime();
    }

    return () => {
      createdTriggers.forEach((trigger) => trigger.kill());
      clearActiveSection(sections, activeClassName);
    };
  }, [
    activeClassName,
    containerRef,
    onSectionChange,
    refreshOnMount,
    sectionSelector,
    triggerEnd,
    triggerStart,
  ]);
}

export default useSectionTriggers;
