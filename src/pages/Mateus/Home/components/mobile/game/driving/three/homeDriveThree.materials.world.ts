// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.materials.world.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials.colors";

// materiais do chão, ruas, natureza e volumes dos prédios
export const HOME_DRIVE_THREE_WORLD_MATERIALS = {
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
};
