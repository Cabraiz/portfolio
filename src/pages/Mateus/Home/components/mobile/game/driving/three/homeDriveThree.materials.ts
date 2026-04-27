// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.materials.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";

export const HOME_DRIVE_THREE_COLORS = Object.freeze({
  sky: "#9fc2c9",
  fog: "#b5c9be",

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
  buildingShopGlass: "#496d76",
  buildingDoor: "#513724",
  buildingAwning: "#a66b3c",
  buildingRoof: "#585b55",
  buildingTrim: "#d8cfad",
  buildingShadowTrim: "#645e50",
});

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

  buildingWindow: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingWindow,
    side: DoubleSide,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingWindowDark: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingWindowDark,
    side: DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingShopGlass: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingShopGlass,
    side: DoubleSide,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingDoor: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingDoor,
    side: DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingAwning: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingAwning,
    side: DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingRoof: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingRoof,
    roughness: 0.84,
    metalness: 0.02,
    side: DoubleSide,
  }),

  buildingTrim: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingTrim,
    side: DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),

  buildingShadowTrim: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_COLORS.buildingShadowTrim,
    side: DoubleSide,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),
});
