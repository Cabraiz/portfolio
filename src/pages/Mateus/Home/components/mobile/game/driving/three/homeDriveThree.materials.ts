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
});
