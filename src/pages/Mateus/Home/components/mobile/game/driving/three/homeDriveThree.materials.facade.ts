// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.materials.facade.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials.colors";

function createFacadePlaneMaterial(
  color: string,
  opacity = 1,
): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color,
    side: DoubleSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

// materiais das fachadas (janelas, portas, toldos, placas)
export const HOME_DRIVE_THREE_FACADE_MATERIALS = {
  buildingWindow: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindow,
    0.88,
  ),

  buildingWindowDark: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowDark,
    0.9,
  ),

  buildingWindowGlass: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowGlass,
    0.82,
  ),

  buildingWindowGlassBright: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowGlassBright,
    0.72,
  ),

  buildingWindowWood: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowWood,
    1,
  ),

  buildingWindowOpen: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowOpen,
    0.94,
  ),

  buildingWindowFrame: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowFrame,
    0.9,
  ),

  buildingWindowGrille: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingWindowGrille,
    0.88,
  ),

  buildingShopGlass: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingShopGlass,
    0.82,
  ),

  buildingDoor: createFacadePlaneMaterial(HOME_DRIVE_THREE_COLORS.buildingDoor),

  buildingDoorWood: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorWood,
  ),

  buildingDoorMetal: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorMetal,
  ),

  buildingDoorGlass: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorGlass,
    0.82,
  ),

  buildingDoorPainted: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorPainted,
  ),

  buildingDoorDark: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorDark,
    0.96,
  ),

  buildingDoorRollingSteel: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorRollingSteel,
    0.94,
  ),

  buildingDoorBroken: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorBroken,
  ),

  buildingDoorFrame: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorFrame,
    0.92,
  ),

  buildingDoorHandle: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorHandle,
    0.96,
  ),

  buildingDoorCrack: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorCrack,
    0.88,
  ),

  buildingDoorBoard: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingDoorBoard,
    0.96,
  ),

  buildingEntrancePillar: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingEntrancePillar,
    0.94,
  ),

  buildingPortariaGlass: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingPortariaGlass,
    0.66,
  ),

  buildingIntercom: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingIntercom,
    0.96,
  ),

  buildingCanopySlab: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingCanopySlab,
    0.94,
  ),

  buildingCanopyMetal: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingCanopyMetal,
    0.92,
  ),

  buildingCanopyGlass: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingCanopyGlass,
    0.58,
  ),

  buildingCanopyFabric: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingCanopyFabric,
    0.94,
  ),

  buildingNoParkingSign: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingNoParkingSign,
    0.96,
  ),

  buildingNoParkingBar: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingNoParkingBar,
    0.98,
  ),

  buildingPrivateSign: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingPrivateSign,
    0.94,
  ),

  buildingServiceSign: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingServiceSign,
    0.96,
  ),

  buildingGarageMarking: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingGarageMarking,
    0.86,
  ),

  buildingAwning: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingAwning,
  ),

  buildingAwningStriped: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingAwningStriped,
  ),

  buildingAwningFabric: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingAwningFabric,
  ),

  buildingAwningMetal: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingAwningMetal,
  ),

  buildingAirConditioner: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingAirConditioner,
    roughness: 0.7,
    metalness: 0.12,
    side: DoubleSide,
  }),

  buildingAirConditionerShadow: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingAirConditionerShadow,
    0.72,
  ),

  buildingSignBoard: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingSignBoard,
    0.92,
  ),

  buildingMetalFrame: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingMetalFrame,
    0.9,
  ),

  buildingRoof: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingRoof,
    roughness: 0.84,
    metalness: 0.02,
    side: DoubleSide,
  }),

  buildingTrim: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingTrim,
    0.72,
  ),

  buildingShadowTrim: createFacadePlaneMaterial(
    HOME_DRIVE_THREE_COLORS.buildingShadowTrim,
    0.52,
  ),
};
