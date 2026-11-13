// Comparação de observações, agendamento padrão e escolha estável da seção.
import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionViewportMode } from "../landing.types";
import type { resolveLandingActiveSectionTokens } from "../landingActiveSection.tokens";
import type { LandingSectionObservation } from "./useLandingCommittedSection";
import type { UseLandingActiveSectionSchedulingOptions } from "./useLandingActiveSection.types";

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
  _viewportMode: LandingSectionViewportMode,
): Required<UseLandingActiveSectionSchedulingOptions> {
  return {
    eventSource: "window-only",
    attachWindowScroll: true,
    attachContainerScroll: false,
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

export {
  areObservationsEquivalent,
  resolveDefaultSchedulingOptions,
  resolveShouldAttachWindowScroll,
  resolveShouldAttachContainerScroll,
  resolveStableObservedSectionId,
};
