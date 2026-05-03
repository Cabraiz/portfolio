// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/homeDriveThree.urbanFixtureMaterials.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";

export type HomeDriveThreeUrbanFixtureMaterialKey =
  | "brushedPole"
  | "darkMetal"
  | "concreteBase"
  | "lampHousing"
  | "lampGlass"
  | "lampGlow"
  | "signalHousing"
  | "signalBackPlate"
  | "signalRedActive"
  | "signalAmberActive"
  | "signalGreenActive"
  | "signalRedDim"
  | "signalAmberDim"
  | "signalGreenDim"
  | "pedestrianWalk"
  | "pedestrianWait"
  | "pedestrianPanel"
  | "streetNamePlate"
  | "maintenancePlate"
  | "bannerBlue"
  | "cable";

export const HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS = Object.freeze({
  brushedPole: "#626a67",
  darkMetal: "#171b1d",
  concreteBase: "#74766d",
  lampHousing: "#2b3132",
  lampGlass: "#ffe8a6",
  lampGlow: "#ffd980",
  signalHousing: "#1b2022",
  signalBackPlate: "#0f1314",
  signalRed: "#e04738",
  signalAmber: "#e6a23c",
  signalGreen: "#41d06f",
  signalRedDim: "#491f1b",
  signalAmberDim: "#4c3821",
  signalGreenDim: "#1c4329",
  pedestrianWalk: "#54df81",
  pedestrianWait: "#e75a4c",
  pedestrianPanel: "#121617",
  streetNamePlate: "#245263",
  maintenancePlate: "#8f958e",
  bannerBlue: "#2f5d7c",
  cable: "#101315",
});

function createMetalMaterial(color: string, roughness = 0.5, metalness = 0.38): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function createEmissiveMaterial(
  color: string,
  emissiveIntensity: number,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    roughness: 0.22,
    metalness: 0.04,
  });
}

export const HOME_DRIVE_THREE_URBAN_FIXTURE_MATERIALS: Readonly<
  Record<HomeDriveThreeUrbanFixtureMaterialKey, MeshStandardMaterial | MeshBasicMaterial>
> = Object.freeze({
  brushedPole: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.brushedPole,
    0.42,
    0.48,
  ),

  darkMetal: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.darkMetal,
    0.58,
    0.32,
  ),

  concreteBase: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.concreteBase,
    roughness: 0.92,
    metalness: 0,
  }),

  lampHousing: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.lampHousing,
    0.5,
    0.42,
  ),

  lampGlass: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.lampGlass,
    0.56,
  ),

  lampGlow: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.lampGlow,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  }),

  signalHousing: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalHousing,
    0.64,
    0.22,
  ),

  signalBackPlate: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalBackPlate,
    0.72,
    0.18,
  ),

  signalRedActive: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalRed,
    1.45,
  ),

  signalAmberActive: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalAmber,
    1.36,
  ),

  signalGreenActive: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalGreen,
    1.34,
  ),

  signalRedDim: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalRedDim,
    0.12,
  ),

  signalAmberDim: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalAmberDim,
    0.1,
  ),

  signalGreenDim: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.signalGreenDim,
    0.1,
  ),

  pedestrianWalk: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.pedestrianWalk,
    1.1,
  ),

  pedestrianWait: createEmissiveMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.pedestrianWait,
    1.08,
  ),

  pedestrianPanel: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.pedestrianPanel,
    0.68,
    0.26,
  ),

  streetNamePlate: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.streetNamePlate,
    0.54,
    0.14,
  ),

  maintenancePlate: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.maintenancePlate,
    0.5,
    0.32,
  ),

  bannerBlue: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.bannerBlue,
    0.58,
    0.16,
  ),

  cable: createMetalMaterial(
    HOME_DRIVE_THREE_URBAN_FIXTURE_COLORS.cable,
    0.72,
    0.18,
  ),
});
