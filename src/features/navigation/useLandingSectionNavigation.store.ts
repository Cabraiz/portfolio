// Store compartilhado da navegação por seções (movido do useLandingSectionNavigation).

import { useEffect } from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
  LANDING_SECTIONS,
  type LandingSectionId,
} from "./landingSections";
import type { UseLandingActiveSectionResult } from "../../pages/Mateus/LandingPage/hooks/useLandingActiveSection";
import type { LandingSectionNavigationStoreState } from "./useLandingSectionNavigation.types";

const DEFAULT_SECTION_IDS = LANDING_SECTIONS.map(
  (section) => section.id,
) as readonly LandingSectionId[];

const INITIAL_STORE_STATE: LandingSectionNavigationStoreState = {
  activeSectionId: DEFAULT_LANDING_SECTION_ID,
  observedSectionId: DEFAULT_LANDING_SECTION_ID,
  committedSectionId: DEFAULT_LANDING_SECTION_ID,
  routeSectionId: DEFAULT_LANDING_SECTION_ID,
  observations: [],
  controllerReady: false,
  getSectionElement: null,
  resolveObservationBySectionId: null,
  refreshActiveSection: null,
  setActiveSectionId: null,
};

let storeState: LandingSectionNavigationStoreState = INITIAL_STORE_STATE;

const storeListeners = new Set<() => void>();

function subscribeToStore(listener: () => void): () => void {
  storeListeners.add(listener);

  return () => {
    storeListeners.delete(listener);
  };
}

function getStoreSnapshot(): LandingSectionNavigationStoreState {
  return storeState;
}

function patchStoreState(
  patch:
    | Partial<LandingSectionNavigationStoreState>
    | ((
        current: LandingSectionNavigationStoreState,
      ) => Partial<LandingSectionNavigationStoreState>),
): void {
  const resolvedPatch =
    typeof patch === "function" ? patch(storeState) : patch;

  if (Object.keys(resolvedPatch).length === 0) {
    return;
  }

  const nextState: LandingSectionNavigationStoreState = {
    ...storeState,
    ...resolvedPatch,
  };

  const keys = Object.keys(nextState) as Array<
    keyof LandingSectionNavigationStoreState
  >;

  const changed = keys.some((key) => !Object.is(storeState[key], nextState[key]));

  if (!changed) {
    return;
  }

  storeState = nextState;
  storeListeners.forEach((listener) => listener());
}

// Espelha o controlador no store compartilhado (mesmos efeitos, mesma ordem).
function useLandingSectionNavigationStoreSync(
  routeSectionIdFromLocation: LandingSectionId,
  controllerEnabled: boolean,
  activeSectionState: UseLandingActiveSectionResult,
): void {
  useEffect(() => {
    patchStoreState({
      routeSectionId: routeSectionIdFromLocation,
    });
  }, [routeSectionIdFromLocation]);

  useEffect(() => {
    if (!controllerEnabled) {
      return;
    }

    patchStoreState({
      controllerReady: true,
      activeSectionId: activeSectionState.activeSectionId,
      observedSectionId: activeSectionState.observedSectionId,
      committedSectionId: activeSectionState.committedSectionId,
      observations: activeSectionState.observations,
      getSectionElement: activeSectionState.getSectionElement,
      resolveObservationBySectionId:
        activeSectionState.resolveObservationBySectionId,
      refreshActiveSection: activeSectionState.refreshActiveSection,
      setActiveSectionId: activeSectionState.setActiveSectionId,
    });

    return () => {
      patchStoreState({
        controllerReady: false,
        getSectionElement: null,
        resolveObservationBySectionId: null,
        refreshActiveSection: null,
        setActiveSectionId: null,
      });
    };
  }, [
    controllerEnabled,
    activeSectionState.activeSectionId,
    activeSectionState.observedSectionId,
    activeSectionState.committedSectionId,
    activeSectionState.observations,
    activeSectionState.getSectionElement,
    activeSectionState.resolveObservationBySectionId,
    activeSectionState.refreshActiveSection,
    activeSectionState.setActiveSectionId,
  ]);
}

export {
  DEFAULT_SECTION_IDS,
  getStoreSnapshot,
  patchStoreState,
  subscribeToStore,
  useLandingSectionNavigationStoreSync,
};
