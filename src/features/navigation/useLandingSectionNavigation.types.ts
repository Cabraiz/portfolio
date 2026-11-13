// Tipos do useLandingSectionNavigation (movidos do arquivo original).

import type { LandingSectionId } from "./landingSections";
import type { LandingActiveSectionCommitTokens } from "../../pages/Mateus/LandingPage/landingActiveSection.tokens";
import type {
  ActiveSectionChangeReason,
  UseLandingActiveSectionSchedulingOptions,
} from "../../pages/Mateus/LandingPage/hooks/useLandingActiveSection";
import type { LandingSectionObservation } from "../../pages/Mateus/LandingPage/hooks/useLandingCommittedSection";
import type { LandingSectionViewportMode } from "../../pages/Mateus/LandingPage/landing.types";

type LenisLike =
  | Readonly<{
      scrollTo: (
        target: number | HTMLElement,
        options?: Readonly<{
          offset?: number;
          duration?: number;
          easing?: (value: number) => number;
          force?: boolean;
          onComplete?: () => void;
        }>,
      ) => void;
    }>
  | null
  | undefined;

export type LandingSectionNavigationNavigateOptions = Readonly<{
  replace?: boolean;
  syncUrl?: boolean;
  forceScroll?: boolean;
  offsetPx?: number;
  duration?: number;
}>;

export type UseLandingSectionNavigationParams = Readonly<{
  containerRef?: Readonly<{ current: HTMLElement | null }>;
  defaultSectionId?: LandingSectionId;
  sectionIds?: readonly LandingSectionId[];
  sectionSelector?: string;
  viewportMode?: LandingSectionViewportMode;
  navbarOffsetPx?: number;
  activationViewportRatio?: number;
  disabled?: boolean;
  viewportWidth?: number | null;
  tokens?: Partial<LandingActiveSectionCommitTokens>;
  scheduling?: UseLandingActiveSectionSchedulingOptions;
  urlSyncEligibleSectionIds?: readonly LandingSectionId[];
  syncUrl?: boolean;
  scrollDuration?: number;
}>;

export type UseLandingSectionNavigationResult = Readonly<{
  activeSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  committedSectionId: LandingSectionId;
  routeSectionId: LandingSectionId;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  controllerReady: boolean;
  navigateToSection: (
    sectionId: LandingSectionId,
    options?: LandingSectionNavigationNavigateOptions,
  ) => void;
  replaceRouteSection: (
    sectionId: LandingSectionId,
    options?: Readonly<{
      replace?: boolean;
    }>,
  ) => void;
  resolveRoutePath: (sectionId: LandingSectionId) => string;
  isUrlSyncEligible: (sectionId: LandingSectionId) => boolean;
  refreshActiveSection: (reason?: ActiveSectionChangeReason) => void;
  resolveObservationBySectionId: (
    sectionId: LandingSectionId,
  ) => LandingSectionObservation<LandingSectionId> | null;
  getSectionElement: (sectionId: LandingSectionId) => HTMLElement | null;
  setActiveSectionId: (sectionId: LandingSectionId) => void;
}>;

type LandingSectionNavigationStoreState = Readonly<{
  activeSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  committedSectionId: LandingSectionId;
  routeSectionId: LandingSectionId;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  controllerReady: boolean;
  getSectionElement: ((sectionId: LandingSectionId) => HTMLElement | null) | null;
  resolveObservationBySectionId:
    | ((sectionId: LandingSectionId) => LandingSectionObservation<LandingSectionId> | null)
    | null;
  refreshActiveSection: ((reason?: ActiveSectionChangeReason) => void) | null;
  setActiveSectionId: ((sectionId: LandingSectionId) => void) | null;
}>;

export type { LandingSectionNavigationStoreState, LenisLike };
