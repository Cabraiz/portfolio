import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
  type LandingSectionId,
} from "../../../../features/navigation/landingSections";
import { resolveLandingNavbarOffsetPx } from "../landingLayout.tokens";
import type { LandingSectionViewportMode } from "../landing.types";
import {
  resolveLandingActiveSectionTokens,
  type LandingActiveSectionCommitTokens,
} from "../landingActiveSection.tokens";
import useLandingCommittedSection, {
  type LandingCommittedSectionReason,
  type LandingSectionObservation,
} from "./useLandingCommittedSection";

const DEFAULT_SECTION_SELECTOR = ":scope > section[data-page-section='true']";

export type ActiveSectionChangeReason =
  | "initial"
  | "scroll"
  | "resize"
  | "refresh";

export type LandingScrollEventSource =
  | "window-only"
  | "container-only";

export type UseLandingActiveSectionSchedulingOptions = Readonly<{
  eventSource?: LandingScrollEventSource;
  attachWindowScroll?: boolean;
  attachContainerScroll?: boolean;
  attachResizeObserver?: boolean;
  listenResize?: boolean;
  listenOrientationChange?: boolean;
  useAnimationFrame?: boolean;
  cancelPendingAnimationFrame?: boolean;
  debounceMs?: number;
}>;

export type LandingObservedSectionChangeMeta = Readonly<{
  previousSectionId: LandingSectionId;
  element: HTMLElement | null;
  reason: ActiveSectionChangeReason;
  observation: LandingSectionObservation<LandingSectionId> | null;
}>;

export type LandingCommittedSectionChangeMeta = Readonly<{
  previousSectionId: LandingSectionId;
  element: HTMLElement | null;
  reason: LandingCommittedSectionReason;
  observation: LandingSectionObservation<LandingSectionId> | null;
}>;

export type UseLandingActiveSectionParams = Readonly<{
  containerRef: { current: HTMLElement | null };
  defaultSectionId?: LandingSectionId;
  sectionIds: readonly LandingSectionId[];
  sectionSelector?: string;
  viewportMode?: LandingSectionViewportMode;
  navbarOffsetPx?: number;
  activationViewportRatio?: number;
  disabled?: boolean;
  viewportWidth?: number | null;
  tokens?: Partial<LandingActiveSectionCommitTokens>;
  scheduling?: UseLandingActiveSectionSchedulingOptions;
  onObservedSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingObservedSectionChangeMeta,
  ) => void;
  onCommittedSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingCommittedSectionChangeMeta,
  ) => void;
  onActiveSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingCommittedSectionChangeMeta,
  ) => void;
}>;

export type UseLandingActiveSectionResult = Readonly<{
  activeSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  committedSectionId: LandingSectionId;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  observedObservation: LandingSectionObservation<LandingSectionId> | null;
  committedObservation: LandingSectionObservation<LandingSectionId> | null;
  refreshActiveSection: (reason?: ActiveSectionChangeReason) => void;
  resolveObservationBySectionId: (
    sectionId: LandingSectionId,
  ) => LandingSectionObservation<LandingSectionId> | null;
  getSectionElement: (sectionId: LandingSectionId) => HTMLElement | null;
  setActiveSectionId: (sectionId: LandingSectionId) => void;
}>;

type SectionComputationResult = Readonly<{
  observedSectionId: LandingSectionId | null;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
}>;

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

function querySectionElements(
  container: HTMLElement,
  sectionSelector: string,
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(sectionSelector));
}

function resolveSectionIdFromElement(
  element: HTMLElement,
  sectionIdLookup: ReadonlySet<LandingSectionId>,
): LandingSectionId | null {
  const candidates = [
    element.dataset.sectionId,
    element.getAttribute("data-section-id") ?? undefined,
    element.getAttribute("data-page-section-id") ?? undefined,
    element.id || undefined,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      sectionIdLookup.has(candidate as LandingSectionId)
    ) {
      return candidate as LandingSectionId;
    }
  }

  return null;
}

function getSectionElementById(
  container: HTMLElement,
  sectionId: LandingSectionId,
  sectionSelector: string,
): HTMLElement | null {
  const sectionIdLookup = new Set<LandingSectionId>([sectionId]);
  const sectionElements = querySectionElements(container, sectionSelector);

  for (const element of sectionElements) {
    const resolvedSectionId = resolveSectionIdFromElement(
      element,
      sectionIdLookup,
    );

    if (resolvedSectionId === sectionId) {
      return element;
    }
  }

  return null;
}

function resolveSectionOrderLookup(
  sectionIds: readonly LandingSectionId[],
): Map<LandingSectionId, number> {
  return new Map(sectionIds.map((sectionId, index) => [sectionId, index]));
}

function computeSectionObservations({
  container,
  sectionSelector,
  sectionIds,
  navbarOffsetPx,
  activationViewportRatio,
}: Readonly<{
  container: HTMLElement;
  sectionSelector: string;
  sectionIds: readonly LandingSectionId[];
  navbarOffsetPx: number;
  activationViewportRatio: number;
}>): SectionComputationResult {
  const browserWindow = getBrowserWindow();

  if (browserWindow === null) {
    return {
      observedSectionId: null,
      observations: [],
    };
  }

  const sectionElements = querySectionElements(container, sectionSelector);

  if (sectionElements.length === 0) {
    return {
      observedSectionId: null,
      observations: [],
    };
  }

  const sectionIdLookup = new Set(sectionIds);
  const sectionOrderLookup = resolveSectionOrderLookup(sectionIds);
  const viewportHeight = browserWindow.innerHeight || 0;
  const timestamp = browserWindow.performance?.now?.() ?? Date.now();

  const activationLine =
    navbarOffsetPx +
    Math.max(0, viewportHeight - navbarOffsetPx) * activationViewportRatio;

  const observations: LandingSectionObservation<LandingSectionId>[] = [];
  let bestVisibleMatch: LandingSectionObservation<LandingSectionId> | null = null;
  let bestFallbackMatch: LandingSectionObservation<LandingSectionId> | null =
    null;

  for (const element of sectionElements) {
    const sectionId = resolveSectionIdFromElement(element, sectionIdLookup);

    if (sectionId === null) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const rectHeight = Math.max(rect.height, 1);

    const visibleTop = Math.max(rect.top, navbarOffsetPx);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    const normalizedHeight = Math.max(
      Math.min(rectHeight, Math.max(viewportHeight - navbarOffsetPx, 1)),
      1,
    );

    const visibilityRatio = visibleHeight / normalizedHeight;
    const elementCenter = rect.top + rectHeight / 2;
    const distanceToActivationLine = Math.abs(elementCenter - activationLine);
    const orderPenalty = sectionOrderLookup.get(sectionId) ?? 0;

    const score =
      visibilityRatio * 1000 -
      distanceToActivationLine -
      orderPenalty * 0.001;

    const observation: LandingSectionObservation<LandingSectionId> = {
      sectionId,
      score,
      visibilityRatio,
      distanceToActivationLine,
      rectTop: rect.top,
      rectBottom: rect.bottom,
      rectHeight,
      timestamp,
    };

    observations.push(observation);

    if (
      bestFallbackMatch === null ||
      observation.distanceToActivationLine <
        bestFallbackMatch.distanceToActivationLine ||
      (observation.distanceToActivationLine ===
        bestFallbackMatch.distanceToActivationLine &&
        observation.score > bestFallbackMatch.score)
    ) {
      bestFallbackMatch = observation;
    }

    if (visibleHeight <= 0) {
      continue;
    }

    if (
      bestVisibleMatch === null ||
      observation.score > bestVisibleMatch.score
    ) {
      bestVisibleMatch = observation;
    }
  }

  observations.sort((left, right) => right.score - left.score);

  return {
    observedSectionId:
      bestVisibleMatch?.sectionId ?? bestFallbackMatch?.sectionId ?? null,
    observations,
  };
}

function areNumbersClose(
  left: number,
  right: number,
  tolerance: number,
): boolean {
  return Math.abs(left - right) <= tolerance;
}

function areObservationsEquivalent(
  left: readonly LandingSectionObservation<LandingSectionId>[],
  right: readonly LandingSectionObservation<LandingSectionId>[],
): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftItem = left[index];
    const rightItem = right[index];

    if (leftItem.sectionId !== rightItem.sectionId) {
      return false;
    }

    if (!areNumbersClose(leftItem.score, rightItem.score, 0.5)) {
      return false;
    }

    if (
      !areNumbersClose(
        leftItem.visibilityRatio,
        rightItem.visibilityRatio,
        0.001,
      )
    ) {
      return false;
    }

    if (
      !areNumbersClose(
        leftItem.distanceToActivationLine,
        rightItem.distanceToActivationLine,
        0.5,
      )
    ) {
      return false;
    }

    if (!areNumbersClose(leftItem.rectTop, rightItem.rectTop, 0.5)) {
      return false;
    }

    if (!areNumbersClose(leftItem.rectBottom, rightItem.rectBottom, 0.5)) {
      return false;
    }
  }

  return true;
}

function resolveDefaultSchedulingOptions(
  viewportMode: LandingSectionViewportMode,
): Required<UseLandingActiveSectionSchedulingOptions> {
  const isDesktop = viewportMode !== "mobile";

  return {
    eventSource: isDesktop ? "window-only" : "container-only",
    attachWindowScroll: isDesktop,
    attachContainerScroll: !isDesktop,
    attachResizeObserver: true,
    listenResize: true,
    listenOrientationChange: true,
    useAnimationFrame: true,
    cancelPendingAnimationFrame: true,
    debounceMs: 0,
  };
}

function resolveShouldAttachWindowScroll(
  scheduling: Required<UseLandingActiveSectionSchedulingOptions>,
): boolean {
  if (scheduling.eventSource === "container-only") {
    return false;
  }

  return scheduling.attachWindowScroll;
}

function resolveShouldAttachContainerScroll(
  container: HTMLElement,
  scheduling: Required<UseLandingActiveSectionSchedulingOptions>,
): boolean {
  if (scheduling.eventSource === "window-only") {
    return false;
  }

  return (
    scheduling.attachContainerScroll &&
    container !== document.body &&
    container !== document.documentElement
  );
}

function resolveObservationFromList(
  observations: readonly LandingSectionObservation<LandingSectionId>[],
  sectionId: LandingSectionId | null | undefined,
): LandingSectionObservation<LandingSectionId> | null {
  if (sectionId == null) {
    return null;
  }

  return (
    observations.find((observation) => observation.sectionId === sectionId) ??
    null
  );
}

function resolveStableObservedSectionId(params: Readonly<{
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  immediateObservedSectionId: LandingSectionId | null;
  previousObservedSectionId: LandingSectionId | null;
  defaultSectionId: LandingSectionId;
  tokens: ReturnType<typeof resolveLandingActiveSectionTokens>;
}>): LandingSectionId {
  const {
    observations,
    immediateObservedSectionId,
    previousObservedSectionId,
    defaultSectionId,
    tokens,
  } = params;

  const topObservation = observations[0] ?? null;
  const immediateObservedObservation = resolveObservationFromList(
    observations,
    immediateObservedSectionId,
  );

  if (topObservation === null && immediateObservedObservation === null) {
    return previousObservedSectionId ?? defaultSectionId;
  }

  if (previousObservedSectionId == null) {
    return (
      immediateObservedObservation?.sectionId ??
      topObservation?.sectionId ??
      defaultSectionId
    );
  }

  const previousObservation = resolveObservationFromList(
    observations,
    previousObservedSectionId,
  );

  if (previousObservation === null) {
    return (
      immediateObservedObservation?.sectionId ??
      topObservation?.sectionId ??
      defaultSectionId
    );
  }

  const candidateObservation =
    immediateObservedObservation ?? topObservation ?? previousObservation;

  if (candidateObservation.sectionId === previousObservation.sectionId) {
    return previousObservation.sectionId;
  }

  const candidateScoreLead =
    candidateObservation.score - previousObservation.score;
  const candidateDistanceLead =
    previousObservation.distanceToActivationLine -
    candidateObservation.distanceToActivationLine;

  const previousStillStable =
    previousObservation.visibilityRatio >= tokens.releaseVisibilityThreshold;

  const candidateClearlyBetter =
    candidateObservation.visibilityRatio >= tokens.commitVisibilityThreshold &&
    (
      candidateScoreLead >= Math.max(16, tokens.swapScoreDelta * 0.5) ||
      candidateDistanceLead >= Math.max(24, tokens.distanceHysteresisPx * 0.5)
    );

  if (previousStillStable && !candidateClearlyBetter) {
    return previousObservation.sectionId;
  }

  return candidateObservation.sectionId;
}

export default function useLandingActiveSection({
  containerRef,
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  sectionIds,
  sectionSelector = DEFAULT_SECTION_SELECTOR,
  viewportMode = "desktop",
  navbarOffsetPx,
  activationViewportRatio,
  disabled = false,
  viewportWidth,
  tokens,
  scheduling,
  onObservedSectionChange,
  onCommittedSectionChange,
  onActiveSectionChange,
}: UseLandingActiveSectionParams): UseLandingActiveSectionResult {
  const animationFrameRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReasonRef = useRef<ActiveSectionChangeReason | null>(null);
  const observationsRef = useRef<
    readonly LandingSectionObservation<LandingSectionId>[]
  >([]);
  const observedSectionIdRef = useRef<LandingSectionId>(defaultSectionId);

  const resolvedTokenOverrides = useMemo<
    Partial<LandingActiveSectionCommitTokens>
  >(() => {
    return {
      ...(tokens ?? {}),
      ...(typeof activationViewportRatio === "number"
        ? { activationViewportRatio }
        : {}),
    };
  }, [activationViewportRatio, tokens]);

  const resolvedTokens = useMemo(() => {
    return resolveLandingActiveSectionTokens(viewportMode, {
      viewportWidth,
      overrides: resolvedTokenOverrides,
    });
  }, [resolvedTokenOverrides, viewportMode, viewportWidth]);

  const resolvedNavbarOffsetPx = useMemo(() => {
    return navbarOffsetPx ?? resolveLandingNavbarOffsetPx(viewportMode);
  }, [navbarOffsetPx, viewportMode]);

  const resolvedScheduling = useMemo<
    Required<UseLandingActiveSectionSchedulingOptions>
  >(() => {
    return {
      ...resolveDefaultSchedulingOptions(viewportMode),
      ...(scheduling ?? {}),
    };
  }, [scheduling, viewportMode]);

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

  const [observedSectionIdState, setObservedSectionIdState] =
    useState<LandingSectionId>(defaultSectionId);

  const [observationsState, setObservationsState] = useState<
    readonly LandingSectionObservation<LandingSectionId>[]
  >([]);

  useEffect(() => {
    observedSectionIdRef.current = observedSectionIdState;
  }, [observedSectionIdState]);

  useEffect(() => {
    observationsRef.current = observationsState;
  }, [observationsState]);

  const {
    committedSectionId,
    observedSectionId,
    observedObservation,
    committedObservation,
    resolveObservationBySectionId,
  } = useLandingCommittedSection({
    observedSectionId: observedSectionIdState,
    observations: observationsState,
    defaultSectionId,
    viewportMode,
    disabled,
    viewportWidth,
    tokens: resolvedTokenOverrides,
    onCommittedSectionChange: (nextSectionId, meta) => {
      const nextObservation =
        observationsRef.current.find(
          (entry) => entry.sectionId === nextSectionId,
        ) ?? null;

      const nextMeta: LandingCommittedSectionChangeMeta = {
        previousSectionId: meta.previousSectionId,
        element: getSectionElement(nextSectionId),
        reason: meta.reason,
        observation: nextObservation,
      };

      onCommittedSectionChange?.(nextSectionId, nextMeta);
      onActiveSectionChange?.(nextSectionId, nextMeta);
    },
  });

  const setActiveSectionId = useCallback((sectionId: LandingSectionId): void => {
    setObservedSectionIdState((previousSectionId) => {
      if (previousSectionId === sectionId) {
        return previousSectionId;
      }

      return sectionId;
    });
  }, []);

  const refreshActiveSection = useCallback(
    (reason: ActiveSectionChangeReason = "refresh"): void => {
      if (disabled) {
        return;
      }

      const container = containerRef.current;

      if (container === null) {
        return;
      }

      const nextComputation = computeSectionObservations({
        container,
        sectionSelector,
        sectionIds,
        navbarOffsetPx: resolvedNavbarOffsetPx,
        activationViewportRatio: resolvedTokens.activationViewportRatio,
      });

      const nextObservedSectionId = resolveStableObservedSectionId({
        observations: nextComputation.observations,
        immediateObservedSectionId: nextComputation.observedSectionId,
        previousObservedSectionId: observedSectionIdRef.current,
        defaultSectionId,
        tokens: resolvedTokens,
      });

      setObservationsState((previousObservations) => {
        return areObservationsEquivalent(
          previousObservations,
          nextComputation.observations,
        )
          ? previousObservations
          : nextComputation.observations;
      });

      setObservedSectionIdState((previousSectionId) => {
        if (previousSectionId === nextObservedSectionId) {
          return previousSectionId;
        }

        const nextObservation =
          nextComputation.observations.find(
            (entry) => entry.sectionId === nextObservedSectionId,
          ) ?? null;

        onObservedSectionChange?.(nextObservedSectionId, {
          previousSectionId,
          element: getSectionElement(nextObservedSectionId),
          reason,
          observation: nextObservation,
        });

        return nextObservedSectionId;
      });
    },
    [
      containerRef,
      defaultSectionId,
      disabled,
      getSectionElement,
      onObservedSectionChange,
      resolvedNavbarOffsetPx,
      resolvedTokens,
      sectionIds,
      sectionSelector,
    ],
  );

  const flushScheduledRefresh = useCallback(
    (reason: ActiveSectionChangeReason): void => {
      const browserWindow = getBrowserWindow();

      if (browserWindow === null) {
        refreshActiveSection(reason);
        return;
      }

      pendingReasonRef.current = reason;

      if (!resolvedScheduling.useAnimationFrame) {
        const nextReason = pendingReasonRef.current ?? reason;
        pendingReasonRef.current = null;
        refreshActiveSection(nextReason);
        return;
      }

      if (animationFrameRef.current !== null) {
        if (resolvedScheduling.cancelPendingAnimationFrame) {
          browserWindow.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        } else {
          return;
        }
      }

      animationFrameRef.current = browserWindow.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        const nextReason = pendingReasonRef.current ?? reason;
        pendingReasonRef.current = null;
        refreshActiveSection(nextReason);
      });
    },
    [refreshActiveSection, resolvedScheduling],
  );

  const scheduleRefresh = useCallback(
    (reason: ActiveSectionChangeReason): void => {
      const safeDebounceMs = Math.max(
        0,
        Math.floor(resolvedScheduling.debounceMs),
      );

      if (debounceTimerRef.current !== null) {
        globalThis.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (safeDebounceMs <= 0) {
        flushScheduledRefresh(reason);
        return;
      }

      pendingReasonRef.current = reason;

      debounceTimerRef.current = globalThis.setTimeout(() => {
        debounceTimerRef.current = null;
        flushScheduledRefresh(pendingReasonRef.current ?? reason);
      }, safeDebounceMs);
    },
    [flushScheduledRefresh, resolvedScheduling.debounceMs],
  );

  useEffect(() => {
    if (!disabled) {
      refreshActiveSection("initial");
    }
  }, [disabled, refreshActiveSection]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const browserWindow = getBrowserWindow();
    const container = containerRef.current;

    if (browserWindow === null || container === null) {
      return;
    }

    const handleScroll = (): void => {
      scheduleRefresh("scroll");
    };

    const handleResize = (): void => {
      scheduleRefresh("resize");
    };

    const shouldAttachWindowScroll = resolveShouldAttachWindowScroll(
      resolvedScheduling,
    );

    if (shouldAttachWindowScroll) {
      browserWindow.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    if (resolvedScheduling.listenResize) {
      browserWindow.addEventListener("resize", handleResize);
    }

    if (resolvedScheduling.listenOrientationChange) {
      browserWindow.addEventListener("orientationchange", handleResize);
    }

    const shouldAttachContainerScroll = resolveShouldAttachContainerScroll(
      container,
      resolvedScheduling,
    );

    if (shouldAttachContainerScroll) {
      container.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    let resizeObserverInstance: ResizeObserver | null = null;

    if (
      resolvedScheduling.attachResizeObserver &&
      typeof globalThis.ResizeObserver === "function"
    ) {
      resizeObserverInstance = new globalThis.ResizeObserver(() => {
        scheduleRefresh("resize");
      });

      resizeObserverInstance.observe(container);

      querySectionElements(container, sectionSelector).forEach((element) => {
        resizeObserverInstance?.observe(element);
      });
    }

    return () => {
      if (shouldAttachWindowScroll) {
        browserWindow.removeEventListener("scroll", handleScroll);
      }

      if (resolvedScheduling.listenResize) {
        browserWindow.removeEventListener("resize", handleResize);
      }

      if (resolvedScheduling.listenOrientationChange) {
        browserWindow.removeEventListener("orientationchange", handleResize);
      }

      if (shouldAttachContainerScroll) {
        container.removeEventListener("scroll", handleScroll);
      }

      if (resizeObserverInstance !== null) {
        resizeObserverInstance.disconnect();
      }

      if (debounceTimerRef.current !== null) {
        globalThis.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        browserWindow.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      pendingReasonRef.current = null;
    };
  }, [
    containerRef,
    disabled,
    resolvedScheduling,
    scheduleRefresh,
    sectionSelector,
  ]);

  useEffect(() => {
    if (!disabled) {
      scheduleRefresh("refresh");
    }
  }, [
    defaultSectionId,
    disabled,
    resolvedNavbarOffsetPx,
    resolvedTokens.activationViewportRatio,
    scheduleRefresh,
    sectionIds,
    sectionSelector,
    viewportMode,
  ]);

  return {
    activeSectionId: committedSectionId,
    observedSectionId,
    committedSectionId,
    observations: observationsState,
    observedObservation,
    committedObservation,
    refreshActiveSection,
    resolveObservationBySectionId,
    getSectionElement,
    setActiveSectionId,
  };
}
