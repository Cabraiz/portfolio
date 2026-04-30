// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.materials.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";

export const HOME_DRIVE_THREE_COLORS = Object.freeze({
  sky: "#9fc2c9",
  fog: "#b5c9be",
  sun: "#fff4d6",

  grassBase: "#476946",
  grassDark: "#28452f",
  grassLight: "#6f8550",

  asphalt: "#2f3333",
  asphaltDark: "#1b1e1f",
  sidewalk: "#9fa58f",
  sidewalkDark: "#747e6e",
  curb: "#d6d0b0",
  laneMark: "#eee2a4",

  trunk: "#6f4a2f",
  treeTop: "#355f36",
  bush: "#496d38",
  rock: "#77786c",
  marker: "#c38a43",

  mountainNear: "#3f513d",
  mountainMid: "#59644f",
  mountainFar: "#6f7865",
  mountainShadow: "#2f3d32",

  houseWarm: "#b88b62",
  houseCool: "#8e9a8d",
  commerceWarm: "#b99a68",
  commerceNight: "#6f7484",
  apartmentLight: "#c9c5b2",
  apartmentConcrete: "#969a92",
  officeBlue: "#7e91a0",
  warehouseMetal: "#797c73",

  buildingWindow: "#253642",
  buildingWindowDark: "#172129",
  buildingWindowGlass: "#4f7480",
  buildingWindowGlassBright: "#6f9dad",
  buildingWindowWood: "#5c3925",
  buildingWindowOpen: "#0e171c",
  buildingWindowFrame: "#d3c59d",
  buildingWindowGrille: "#23272a",
  buildingShopGlass: "#496d76",
  buildingDoor: "#513724",
  buildingDoorWood: "#5b3824",
  buildingDoorMetal: "#394044",
  buildingDoorGlass: "#5f8791",
  buildingDoorPainted: "#765946",
  buildingDoorDark: "#1f2629",
  buildingDoorRollingSteel: "#777b78",
  buildingDoorBroken: "#2b211c",
  buildingDoorFrame: "#d3c59d",
  buildingDoorHandle: "#d9c37b",
  buildingDoorCrack: "#100d0b",
  buildingDoorBoard: "#6b472f",
  buildingEntrancePillar: "#c7bea1",
  buildingPortariaGlass: "#6f9daa",
  buildingIntercom: "#20272b",
  buildingCanopySlab: "#b9b39d",
  buildingCanopyMetal: "#8f9188",
  buildingCanopyGlass: "#89aeb7",
  buildingCanopyFabric: "#8f493d",
  buildingNoParkingSign: "#efe9d0",
  buildingNoParkingBar: "#b63b32",
  buildingPrivateSign: "#3f464b",
  buildingServiceSign: "#d4c27b",
  buildingGarageMarking: "#d6d0b0",
  buildingAwning: "#a66b3c",
  buildingAwningStriped: "#d6b05f",
  buildingAwningFabric: "#8f493d",
  buildingAwningMetal: "#8f9188",
  buildingRoof: "#585b55",
  buildingTrim: "#d8cfad",
  buildingShadowTrim: "#645e50",
  buildingAirConditioner: "#d7d5c8",
  buildingAirConditionerShadow: "#60645f",
  buildingSignBoard: "#2f3840",
  buildingMetalFrame: "#31363a",
});

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

export const HOME_DRIVE_THREE_MATERIALS = Object.freeze({
  ground: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.grassBase,
    roughness: 0.92,
    metalness: 0,
    side: DoubleSide,
  }),

  groundPatchDark: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.grassDark,
    roughness: 0.96,
    metalness: 0,
    side: DoubleSide,
  }),

  groundPatchLight: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.grassLight,
    roughness: 0.94,
    metalness: 0,
    side: DoubleSide,
  }),

  asphalt: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.asphalt,
    roughness: 0.78,
    metalness: 0.02,
    side: DoubleSide,
  }),

  asphaltDark: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.asphaltDark,
    roughness: 0.84,
    metalness: 0.01,
    side: DoubleSide,
  }),

  sidewalk: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.sidewalk,
    roughness: 0.88,
    metalness: 0,
    side: DoubleSide,
  }),

  sidewalkDark: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.sidewalkDark,
    roughness: 0.9,
    metalness: 0,
    side: DoubleSide,
  }),

  curb: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.curb,
    roughness: 0.72,
    metalness: 0,
    side: DoubleSide,
  }),

  laneMark: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.laneMark,
    side: DoubleSide,
  }),

  treeTrunk: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.trunk,
    roughness: 0.86,
    metalness: 0,
    side: DoubleSide,
  }),

  treeTop: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.treeTop,
    roughness: 0.9,
    metalness: 0,
    side: DoubleSide,
  }),

  bush: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.bush,
    roughness: 0.94,
    metalness: 0,
    side: DoubleSide,
  }),

  rock: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.rock,
    roughness: 0.96,
    metalness: 0,
    side: DoubleSide,
  }),

  marker: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.marker,
    roughness: 0.78,
    metalness: 0.03,
    side: DoubleSide,
  }),

  mountainNear: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.mountainNear,
    roughness: 0.97,
    metalness: 0,
    flatShading: true,
    side: DoubleSide,
  }),

  mountainMid: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.mountainMid,
    roughness: 0.98,
    metalness: 0,
    flatShading: true,
    side: DoubleSide,
  }),

  mountainFar: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.mountainFar,
    roughness: 0.99,
    metalness: 0,
    flatShading: true,
    side: DoubleSide,
  }),

  mountainShadow: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.mountainShadow,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    side: DoubleSide,
  }),

  houseWarm: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.houseWarm,
    roughness: 0.88,
    metalness: 0.02,
    side: DoubleSide,
  }),

  houseCool: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.houseCool,
    roughness: 0.9,
    metalness: 0.01,
    side: DoubleSide,
  }),

  commerceWarm: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.commerceWarm,
    roughness: 0.78,
    metalness: 0.04,
    side: DoubleSide,
  }),

  commerceNight: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.commerceNight,
    roughness: 0.72,
    metalness: 0.06,
    side: DoubleSide,
  }),

  apartmentLight: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.apartmentLight,
    roughness: 0.8,
    metalness: 0.03,
    side: DoubleSide,
  }),

  apartmentConcrete: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.apartmentConcrete,
    roughness: 0.86,
    metalness: 0.02,
    side: DoubleSide,
  }),

  officeBlue: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.officeBlue,
    roughness: 0.58,
    metalness: 0.08,
    side: DoubleSide,
  }),

  warehouseMetal: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.warehouseMetal,
    roughness: 0.82,
    metalness: 0.06,
    side: DoubleSide,
  }),

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
});
