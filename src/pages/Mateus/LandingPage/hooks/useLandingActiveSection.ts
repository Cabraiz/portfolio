import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "@/features/navigation/landingSections";

import type { LandingSectionViewportMode } from "../landing.types";
import { resolveLandingNavbarOffsetPx } from "../landingLayout.tokens";

const DEFAULT_SECTION_SELECTOR =
  "section[id], section[data-section], [data-section], [data-page-section='true'][id]";

type ActiveSectionChangeReason = "scroll" | "resize" | "refresh";

type VisibleSectionMatch = Readonly<{
  sectionId: LandingSectionId;
  score: number;
}>;

type FallbackSectionMatch = Readonly<{
  sectionId: LandingSectionId;
  distance: number;
}>;

type UseLandingActiveSectionParams = Readonly<{
  containerRef: RefObject<HTMLElement | null>;
  defaultSectionId?: LandingSectionId;
  sectionIds?: readonly LandingSectionId[];
  sectionSelector?: string;
  viewportMode?: LandingSectionViewportMode;
  navbarOffsetPx?: number;
  activationViewportRatio?: number;
  disabled?: boolean;
  onActiveSectionChange?: (
    sectionId: LandingSectionId,
    meta: Readonly<{
      previousSectionId: LandingSectionId | null;
      element: HTMLElement | null;
      reason: ActiveSectionChangeReason;
    }>,
  ) => void;
}>;

export type UseLandingActiveSectionResult = Readonly<{
  activeSectionId: LandingSectionId;
  setActiveSectionId: (sectionId: LandingSectionId) => void;
  refreshActiveSection: (reason?: ActiveSectionChangeReason) => void;
  getSectionElement: (sectionId: LandingSectionId) => HTMLElement | null;
}>;

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

function resolveSectionIdFromElement(
  element: HTMLElement,
): LandingSectionId | null {
  return (
    normalizeLandingSectionId(element.dataset.section ?? null) ??
    normalizeLandingSectionId(element.id)
  );
}

function querySectionElements(
  container: HTMLElement,
  sectionSelector: string,
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(sectionSelector));
}

function getSectionOrderLookup(
  sectionIds: readonly LandingSectionId[],
): ReadonlyMap<LandingSectionId, number> {
  return new Map(
    sectionIds.map((sectionId, index) => [sectionId, index] as const),
  );
}

function resolveOrderedSectionIds(
  container: HTMLElement,
  sectionSelector: string,
  sectionIds?: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  if (sectionIds !== undefined && sectionIds.length > 0) {
    return sectionIds;
  }

  return querySectionElements(container, sectionSelector)
    .map(resolveSectionIdFromElement)
    .filter((sectionId): sectionId is LandingSectionId => sectionId !== null);
}

function getSectionElementById(
  container: HTMLElement,
  sectionId: LandingSectionId,
  sectionSelector: string,
): HTMLElement | null {
  const sectionElements = querySectionElements(container, sectionSelector);

  return (
    sectionElements.find(
      (element) => resolveSectionIdFromElement(element) === sectionId,
    ) ?? null
  );
}

function pickBestVisibleSection(params: Readonly<{
  container: HTMLElement;
  sectionSelector: string;
  sectionIds?: readonly LandingSectionId[];
  navbarOffsetPx: number;
  activationViewportRatio: number;
}>): LandingSectionId | null {
  const {
    container,
    sectionSelector,
    sectionIds,
    navbarOffsetPx,
    activationViewportRatio,
  } = params;

  const browserWindow = getBrowserWindow();

  if (browserWindow === null) {
    return null;
  }

  const sectionElements = querySectionElements(container, sectionSelector);

  if (sectionElements.length === 0) {
    return null;
  }

  const orderedSectionIds = resolveOrderedSectionIds(
    container,
    sectionSelector,
    sectionIds,
  );

  const sectionOrderLookup = getSectionOrderLookup(orderedSectionIds);
  const viewportHeight = browserWindow.innerHeight || 0;

  const activationLine =
    navbarOffsetPx +
    Math.max(0, viewportHeight - navbarOffsetPx) * activationViewportRatio;

  let bestVisibleMatch: VisibleSectionMatch | null = null;
  let bestFallbackMatch: FallbackSectionMatch | null = null;

  for (const element of sectionElements) {
    const sectionId = resolveSectionIdFromElement(element);

    if (sectionId === null) {
      continue;
    }

    const rect = element.getBoundingClientRect();

    const visibleTop = Math.max(rect.top, navbarOffsetPx);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    const elementCenter = rect.top + rect.height / 2;
    const distanceToActivationLine = Math.abs(elementCenter - activationLine);

    if (
      bestFallbackMatch === null ||
      distanceToActivationLine < bestFallbackMatch.distance
    ) {
      bestFallbackMatch = {
        sectionId,
        distance: distanceToActivationLine,
      };
    }

    if (visibleHeight <= 0) {
      continue;
    }

    const normalizedHeight = Math.max(
      Math.min(rect.height, Math.max(viewportHeight - navbarOffsetPx, 1)),
      1,
    );

    const visibilityRatio = visibleHeight / normalizedHeight;
    const orderPenalty = sectionOrderLookup.get(sectionId) ?? 0;

    const score =
      visibilityRatio * 1000 -
      distanceToActivationLine -
      orderPenalty * 0.001;

    if (bestVisibleMatch === null || score > bestVisibleMatch.score) {
      bestVisibleMatch = {
        sectionId,
        score,
      };
    }
  }

  if (bestVisibleMatch !== null) {
    return bestVisibleMatch.sectionId;
  }

  if (bestFallbackMatch !== null) {
    return bestFallbackMatch.sectionId;
  }

  return null;
}

export default function useLandingActiveSection({
  containerRef,
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  sectionIds,
  sectionSelector = DEFAULT_SECTION_SELECTOR,
  viewportMode = "desktop",
  navbarOffsetPx,
  activationViewportRatio = 0.42,
  disabled = false,
  onActiveSectionChange,
}: UseLandingActiveSectionParams): UseLandingActiveSectionResult {
  const [activeSectionIdState, setActiveSectionIdState] =
    useState<LandingSectionId>(defaultSectionId);

  const activeSectionIdRef = useRef<LandingSectionId>(defaultSectionId);
  const animationFrameRef = useRef<number | null>(null);

  const resolvedNavbarOffsetPx = useMemo(() => {
    return navbarOffsetPx ?? resolveLandingNavbarOffsetPx(viewportMode);
  }, [navbarOffsetPx, viewportMode]);

  const getSectionElement = useCallback(
    (sectionId: LandingSectionId): HTMLElement | null => {
      const container = containerRef.current;

      if (container === null) {
        return null;
      }

      return getSectionElementById(container, sectionId, sectionSelector);
    },
    [containerRef, sectionSelector],
  );

  const updateActiveSection = useCallback(
    (
      nextSectionId: LandingSectionId,
      reason: ActiveSectionChangeReason,
    ): void => {
      const previousSectionId = activeSectionIdRef.current;

      if (previousSectionId === nextSectionId) {
        return;
      }

      activeSectionIdRef.current = nextSectionId;
      setActiveSectionIdState(nextSectionId);

      onActiveSectionChange?.(nextSectionId, {
        previousSectionId,
        element: getSectionElement(nextSectionId),
        reason,
      });
    },
    [getSectionElement, onActiveSectionChange],
  );

  const refreshActiveSection = useCallback(
    (reason: ActiveSectionChangeReason = "refresh"): void => {
      if (disabled) {
        return;
      }

      const container = containerRef.current;

      if (container === null) {
        return;
      }

      const nextSectionId =
        pickBestVisibleSection({
          container,
          sectionSelector,
          sectionIds,
          navbarOffsetPx: resolvedNavbarOffsetPx,
          activationViewportRatio,
        }) ?? defaultSectionId;

      updateActiveSection(nextSectionId, reason);
    },
    [
      activationViewportRatio,
      containerRef,
      defaultSectionId,
      disabled,
      resolvedNavbarOffsetPx,
      sectionIds,
      sectionSelector,
      updateActiveSection,
    ],
  );

  const scheduleRefresh = useCallback(
    (reason: ActiveSectionChangeReason): void => {
      const browserWindow = getBrowserWindow();

      if (browserWindow === null) {
        return;
      }

      if (animationFrameRef.current !== null) {
        browserWindow.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = browserWindow.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        refreshActiveSection(reason);
      });
    },
    [refreshActiveSection],
  );

  const setActiveSectionId = useCallback(
    (sectionId: LandingSectionId): void => {
      updateActiveSection(sectionId, "refresh");
    },
    [updateActiveSection],
  );

  useEffect(() => {
    activeSectionIdRef.current = activeSectionIdState;
  }, [activeSectionIdState]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const handleScroll = (): void => {
      scheduleRefresh("scroll");
    };

    const handleResize = (): void => {
      scheduleRefresh("resize");
    };

    browserWindow.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    browserWindow.addEventListener("resize", handleResize, {
      passive: true,
    });

    browserWindow.addEventListener("orientationchange", handleResize);

    const shouldAttachContainerScroll =
      container !== document.body && container !== document.documentElement;

    if (shouldAttachContainerScroll) {
      container.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        scheduleRefresh("resize");
      });

      resizeObserver.observe(container);

      const sectionElements = querySectionElements(container, sectionSelector);

      for (const element of sectionElements) {
        resizeObserver.observe(element);
      }
    }

    scheduleRefresh("refresh");

    return () => {
      browserWindow.removeEventListener("scroll", handleScroll);
      browserWindow.removeEventListener("resize", handleResize);
      browserWindow.removeEventListener("orientationchange", handleResize);

      if (shouldAttachContainerScroll) {
        container.removeEventListener("scroll", handleScroll);
      }

      resizeObserver?.disconnect();

      if (animationFrameRef.current !== null) {
        browserWindow.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [containerRef, disabled, scheduleRefresh, sectionSelector]);

  return {
    activeSectionId: activeSectionIdState,
    setActiveSectionId,
    refreshActiveSection,
    getSectionElement,
  };
}
