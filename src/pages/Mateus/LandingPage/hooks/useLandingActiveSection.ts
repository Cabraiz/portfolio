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
import {
  resolveLandingActiveSectionTokens,
  type LandingActiveSectionCommitTokens,
} from "../landingActiveSection.tokens";
import useLandingCommittedSection, {
  type LandingSectionObservation,
} from "./useLandingCommittedSection";
import type {
  ActiveSectionChangeReason,
  LandingCommittedSectionChangeMeta,
  UseLandingActiveSectionParams,
  UseLandingActiveSectionResult,
  UseLandingActiveSectionSchedulingOptions,
} from "./useLandingActiveSection.types";
import {
  computeSectionObservations,
  getBrowserWindow,
  getSectionElementById,
} from "./useLandingActiveSection.observations";
import {
  areObservationsEquivalent,
  resolveDefaultSchedulingOptions,
  resolveStableObservedSectionId,
} from "./useLandingActiveSection.resolvers";
import { useLandingActiveSectionListeners } from "./useLandingActiveSection.listeners";

export type {
  ActiveSectionChangeReason,
  LandingScrollEventSource,
  UseLandingActiveSectionSchedulingOptions,
  LandingObservedSectionChangeMeta,
  LandingCommittedSectionChangeMeta,
  UseLandingActiveSectionParams,
  UseLandingActiveSectionResult,
} from "./useLandingActiveSection.types";

const DEFAULT_SECTION_SELECTOR = ":scope > section[data-page-section='true']";

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
    setCommittedSectionId,
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

  const setActiveSectionId = useCallback(
    (sectionId: LandingSectionId): void => {
      setObservedSectionIdState((previousSectionId) => {
        if (previousSectionId === sectionId) {
          return previousSectionId;
        }

        return sectionId;
      });
      setCommittedSectionId(sectionId);
    },
    [setCommittedSectionId],
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

  useLandingActiveSectionListeners({
    containerRef,
    disabled,
    resolvedScheduling,
    scheduleRefresh,
    sectionSelector,
    animationFrameRef,
    debounceTimerRef,
    pendingReasonRef,
  });

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
