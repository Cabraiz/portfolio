// Tipos públicos de useLandingActiveSection.
import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionViewportMode } from "../landing.types";
import type { LandingActiveSectionCommitTokens } from "../landingActiveSection.tokens";
import type {
  LandingCommittedSectionReason,
  LandingSectionObservation,
} from "./useLandingCommittedSection";

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
