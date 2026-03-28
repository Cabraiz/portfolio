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
import type { LandingSectionViewportMode } from "../landing.types";
import {
  resolveLandingActiveSectionTokens,
  type LandingActiveSectionCommitTokens,
} from "../landingActiveSection.tokens";

export type LandingSectionObservation<
  SectionId extends string = LandingSectionId,
> = Readonly<{
  sectionId: SectionId;
  score: number;
  visibilityRatio: number;
  distanceToActivationLine: number;
  rectTop: number;
  rectBottom: number;
  rectHeight: number;
  timestamp: number;
}>;

export type LandingCommittedSectionReason =
  | "initial"
  | "sync"
  | "swap"
  | "release";

export type LandingCommittedSectionChangeMeta = Readonly<{
  previousSectionId: LandingSectionId;
  reason: LandingCommittedSectionReason;
  observation: LandingSectionObservation<LandingSectionId> | null;
}>;

export type UseLandingCommittedSectionParams = Readonly<{
  observedSectionId?: LandingSectionId | null;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  defaultSectionId?: LandingSectionId;
  viewportMode?: LandingSectionViewportMode;
  disabled?: boolean;
  viewportWidth?: number | null;
  tokens?: Partial<LandingActiveSectionCommitTokens>;
  onCommittedSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingCommittedSectionChangeMeta,
  ) => void;
}>;

export type UseLandingCommittedSectionResult = Readonly<{
  committedSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  observedObservation: LandingSectionObservation<LandingSectionId> | null;
  committedObservation: LandingSectionObservation<LandingSectionId> | null;
  resolveObservationBySectionId: (
    sectionId: LandingSectionId,
  ) => LandingSectionObservation<LandingSectionId> | null;
}>;

function buildObservationLookup(
  observations: readonly LandingSectionObservation<LandingSectionId>[],
): ReadonlyMap<LandingSectionId, LandingSectionObservation<LandingSectionId>> {
  return new Map(
    observations.map((observation) => [observation.sectionId, observation] as const),
  );
}

function resolveElapsedSinceLastCommit(
  timestamp: number,
  lastCommitAt: number,
): number {
  if (!Number.isFinite(timestamp) || !Number.isFinite(lastCommitAt)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, timestamp - lastCommitAt);
}

function shouldCommitObservedSection(params: Readonly<{
  observedObservation: LandingSectionObservation<LandingSectionId>;
  committedObservation: LandingSectionObservation<LandingSectionId>;
  tokens: ReturnType<typeof resolveLandingActiveSectionTokens>;
  lastCommitAt: number;
}>): boolean {
  const {
    observedObservation,
    committedObservation,
    tokens,
    lastCommitAt,
  } = params;

  const elapsedSinceLastCommit = resolveElapsedSinceLastCommit(
    observedObservation.timestamp,
    lastCommitAt,
  );

  if (elapsedSinceLastCommit < tokens.commitIdleMs) {
    return false;
  }

  if (observedObservation.visibilityRatio < tokens.commitVisibilityThreshold) {
    return false;
  }

  const committedReleased =
    committedObservation.visibilityRatio <= tokens.releaseVisibilityThreshold;

  const scoreLead = observedObservation.score - committedObservation.score;
  const distanceLead =
    committedObservation.distanceToActivationLine -
    observedObservation.distanceToActivationLine;

  const winsByScore = scoreLead >= tokens.swapScoreDelta;
  const winsByDistance = distanceLead >= tokens.distanceHysteresisPx;

  return committedReleased || winsByScore || winsByDistance;
}

export default function useLandingCommittedSection({
  observedSectionId,
  observations,
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  viewportMode = "desktop",
  disabled = false,
  viewportWidth,
  tokens,
  onCommittedSectionChange,
}: UseLandingCommittedSectionParams): UseLandingCommittedSectionResult {
  const resolvedTokens = useMemo(() => {
    return resolveLandingActiveSectionTokens(viewportMode, {
      viewportWidth,
      overrides: tokens,
    });
  }, [tokens, viewportMode, viewportWidth]);

  const observationLookup = useMemo(() => {
    return buildObservationLookup(observations);
  }, [observations]);

  const resolveObservationBySectionId = useCallback(
    (
      sectionId: LandingSectionId,
    ): LandingSectionObservation<LandingSectionId> | null => {
      return observationLookup.get(sectionId) ?? null;
    },
    [observationLookup],
  );

  const normalizedObservedSectionId =
    observedSectionId ?? defaultSectionId;

  const [committedSectionIdState, setCommittedSectionIdState] =
    useState<LandingSectionId>(() => {
      return observedSectionId ?? defaultSectionId;
    });

  const committedSectionIdRef = useRef<LandingSectionId>(committedSectionIdState);
  const lastCommitAtRef = useRef<number>(0);

  useEffect(() => {
    committedSectionIdRef.current = committedSectionIdState;
  }, [committedSectionIdState]);

  const observedObservation = useMemo(() => {
    return resolveObservationBySectionId(normalizedObservedSectionId);
  }, [normalizedObservedSectionId, resolveObservationBySectionId]);

  const committedObservation = useMemo(() => {
    return resolveObservationBySectionId(committedSectionIdState);
  }, [committedSectionIdState, resolveObservationBySectionId]);

  const commitSection = useCallback(
    (
      nextSectionId: LandingSectionId,
      reason: LandingCommittedSectionReason,
      observationOverride?: LandingSectionObservation<LandingSectionId> | null,
    ): void => {
      setCommittedSectionIdState((previousSectionId) => {
        if (previousSectionId === nextSectionId) {
          return previousSectionId;
        }

        const nextObservation =
          observationOverride ??
          observationLookup.get(nextSectionId) ??
          null;

        lastCommitAtRef.current =
          nextObservation?.timestamp ?? globalThis.Date.now();

        onCommittedSectionChange?.(nextSectionId, {
          previousSectionId,
          reason,
          observation: nextObservation,
        });

        return nextSectionId;
      });
    },
    [observationLookup, onCommittedSectionChange],
  );

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (observations.length === 0) {
      setCommittedSectionIdState((previousSectionId) => {
        if (previousSectionId === defaultSectionId) {
          return previousSectionId;
        }

        lastCommitAtRef.current = 0;
        return defaultSectionId;
      });
      return;
    }

    if (observedObservation === null) {
      return;
    }

    const currentCommittedSectionId = committedSectionIdRef.current;
    const currentCommittedObservation =
      observationLookup.get(currentCommittedSectionId) ?? null;

    if (currentCommittedObservation === null) {
      if (currentCommittedSectionId !== observedObservation.sectionId) {
        commitSection(
          observedObservation.sectionId,
          "initial",
          observedObservation,
        );
      } else if (lastCommitAtRef.current <= 0) {
        lastCommitAtRef.current =
          observedObservation.timestamp ?? globalThis.Date.now();
      }
      return;
    }

    if (currentCommittedSectionId === observedObservation.sectionId) {
      if (lastCommitAtRef.current <= 0) {
        lastCommitAtRef.current =
          observedObservation.timestamp ?? globalThis.Date.now();
      }
      return;
    }

    const shouldCommit = shouldCommitObservedSection({
      observedObservation,
      committedObservation: currentCommittedObservation,
      tokens: resolvedTokens,
      lastCommitAt: lastCommitAtRef.current,
    });

    if (!shouldCommit) {
      return;
    }

    const nextReason: LandingCommittedSectionReason =
      currentCommittedObservation.visibilityRatio <=
      resolvedTokens.releaseVisibilityThreshold
        ? "release"
        : "swap";

    commitSection(
      observedObservation.sectionId,
      nextReason,
      observedObservation,
    );
  }, [
    commitSection,
    defaultSectionId,
    disabled,
    observationLookup,
    observations.length,
    observedObservation,
    resolvedTokens,
  ]);

  return {
    committedSectionId: committedSectionIdState,
    observedSectionId: normalizedObservedSectionId,
    observedObservation,
    committedObservation,
    resolveObservationBySectionId,
  };
}
