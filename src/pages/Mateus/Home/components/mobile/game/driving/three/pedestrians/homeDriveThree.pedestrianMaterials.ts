// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianMaterials.ts

import { MeshStandardMaterial } from "three";

import type {
  HomeDrivePedestrianClothingPaletteKey,
  HomeDrivePedestrianSkinToneKey,
} from "../../domain/pedestrians";

export type HomeDriveThreePedestrianClothingMaterials = Readonly<{
  shirt: MeshStandardMaterial;
  pants: MeshStandardMaterial;
  shoes: MeshStandardMaterial;
  accent: MeshStandardMaterial;
}>;

function createMaterial(
  color: string,
  roughness = 0.72,
  metalness = 0.04,
  emissiveIntensity = 0.09,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    roughness,
    metalness,
    dithering: true,
    toneMapped: false,
  });
}

export const HOME_DRIVE_THREE_PEDESTRIAN_SKIN_MATERIALS: Readonly<
  Record<HomeDrivePedestrianSkinToneKey, MeshStandardMaterial>
> = Object.freeze({
  "tone-1": createMaterial("#f1c8a4", 0.8, 0.02, 0.08),
  "tone-2": createMaterial("#dca67d", 0.8, 0.02, 0.08),
  "tone-3": createMaterial("#c48763", 0.82, 0.02, 0.09),
  "tone-4": createMaterial("#a46f55", 0.84, 0.02, 0.1),
  "tone-5": createMaterial("#93654e", 0.86, 0.02, 0.11),
  "tone-6": createMaterial("#8a6150", 0.86, 0.02, 0.11),
});

export const HOME_DRIVE_THREE_PEDESTRIAN_CLOTHING_MATERIALS: Readonly<
  Record<HomeDrivePedestrianClothingPaletteKey, HomeDriveThreePedestrianClothingMaterials>
> = Object.freeze({
  "coastal-light": {
    shirt: createMaterial("#d8e4dc", 0.76, 0.03, 0.08),
    pants: createMaterial("#b7c7be", 0.78, 0.03, 0.08),
    shoes: createMaterial("#807a6e", 0.72, 0.04, 0.1),
    accent: createMaterial("#f0d6a2", 0.64, 0.04, 0.08),
  },
  "urban-dark": {
    shirt: createMaterial("#7b8493", 0.74, 0.05, 0.11),
    pants: createMaterial("#687384", 0.76, 0.05, 0.11),
    shoes: createMaterial("#6d737b", 0.7, 0.05, 0.12),
    accent: createMaterial("#a3aab5", 0.64, 0.06, 0.1),
  },
  "office-neutral": {
    shirt: createMaterial("#d4d0c3", 0.68, 0.04, 0.08),
    pants: createMaterial("#7a828a", 0.7, 0.04, 0.1),
    shoes: createMaterial("#746f67", 0.66, 0.05, 0.11),
    accent: createMaterial("#b8a57d", 0.62, 0.05, 0.08),
  },
  "market-colorful": {
    shirt: createMaterial("#c95f4d", 0.72, 0.04, 0.09),
    pants: createMaterial("#557c8a", 0.74, 0.04, 0.1),
    shoes: createMaterial("#776a5f", 0.7, 0.04, 0.11),
    accent: createMaterial("#d8bc58", 0.62, 0.04, 0.08),
  },
  sport: {
    shirt: createMaterial("#5c99b5", 0.66, 0.04, 0.09),
    pants: createMaterial("#6e7b87", 0.68, 0.04, 0.11),
    shoes: createMaterial("#d8d6c8", 0.56, 0.05, 0.08),
    accent: createMaterial("#df6d43", 0.54, 0.05, 0.08),
  },
  "casual-blue": {
    shirt: createMaterial("#6281a3", 0.74, 0.04, 0.09),
    pants: createMaterial("#6d7d96", 0.76, 0.04, 0.11),
    shoes: createMaterial("#747c87", 0.7, 0.04, 0.11),
    accent: createMaterial("#b6c2cc", 0.64, 0.04, 0.08),
  },
  "casual-earth": {
    shirt: createMaterial("#977559", 0.78, 0.04, 0.09),
    pants: createMaterial("#776b5e", 0.8, 0.04, 0.11),
    shoes: createMaterial("#74685d", 0.74, 0.04, 0.11),
    accent: createMaterial("#c0a777", 0.66, 0.04, 0.08),
  },
});

export const HOME_DRIVE_THREE_PEDESTRIAN_HAIR_MATERIALS: readonly MeshStandardMaterial[] =
  Object.freeze([
    createMaterial("#6d594a", 0.82, 0.03, 0.12),
    createMaterial("#7b604b", 0.82, 0.03, 0.12),
    createMaterial("#8a6749", 0.8, 0.03, 0.11),
    createMaterial("#9a805c", 0.78, 0.03, 0.1),
    createMaterial("#736b5f", 0.84, 0.02, 0.12),
    createMaterial("#8b8a82", 0.84, 0.02, 0.1),
    createMaterial("#d6d0bd", 0.82, 0.02, 0.08),
  ]);

export const HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS = Object.freeze({
  cigarette: createMaterial("#f7f1dc", 0.5, 0.02, 0.08),
  cigaretteTip: new MeshStandardMaterial({
    color: "#ef6d3c",
    emissive: "#b84422",
    emissiveIntensity: 0.62,
    roughness: 0.34,
    metalness: 0.02,
    dithering: true,
    toneMapped: false,
  }),
  shoppingBag: createMaterial("#cfb37d", 0.82, 0.02, 0.08),
  shoppingBagDark: createMaterial("#8f7558", 0.8, 0.03, 0.1),
  phone: createMaterial("#69757d", 0.42, 0.1, 0.12),
  backpack: createMaterial("#6d7880", 0.74, 0.06, 0.12),
  cap: createMaterial("#747d86", 0.7, 0.05, 0.12),
  handLink: createMaterial("#dfb58b", 0.78, 0.02, 0.08),
});

export const HOME_DRIVE_THREE_PEDESTRIAN_DEBUG_MATERIALS = Object.freeze({
  sidewalk: new MeshStandardMaterial({
    color: "#8ac7ff",
    emissive: "#8ac7ff",
    emissiveIntensity: 0.1,
    roughness: 0.7,
    metalness: 0.02,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    dithering: true,
    toneMapped: false,
  }),
  zoneCenter: new MeshStandardMaterial({
    color: "#ffd166",
    emissive: "#9c6b18",
    emissiveIntensity: 0.35,
    roughness: 0.55,
    metalness: 0.02,
    dithering: true,
    toneMapped: false,
  }),
});

export function getHomeDriveThreePedestrianSkinMaterial(
  key: HomeDrivePedestrianSkinToneKey,
): MeshStandardMaterial {
  return (
    HOME_DRIVE_THREE_PEDESTRIAN_SKIN_MATERIALS[key] ??
    HOME_DRIVE_THREE_PEDESTRIAN_SKIN_MATERIALS["tone-3"]
  );
}

export function getHomeDriveThreePedestrianClothingMaterials(
  key: HomeDrivePedestrianClothingPaletteKey,
): HomeDriveThreePedestrianClothingMaterials {
  return (
    HOME_DRIVE_THREE_PEDESTRIAN_CLOTHING_MATERIALS[key] ??
    HOME_DRIVE_THREE_PEDESTRIAN_CLOTHING_MATERIALS["casual-blue"]
  );
}

export function getHomeDriveThreePedestrianHairMaterial(
  variant: number,
): MeshStandardMaterial {
  const materials = HOME_DRIVE_THREE_PEDESTRIAN_HAIR_MATERIALS;
  const index = Math.abs(Math.floor(variant)) % materials.length;

  return materials[index] ?? materials[0];
}
