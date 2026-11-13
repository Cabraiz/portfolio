// Leitura das seções no DOM e cálculo das observações de visibilidade.
import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionObservation } from "./useLandingCommittedSection";

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

export {
  getBrowserWindow,
  querySectionElements,
  getSectionElementById,
  computeSectionObservations,
};
