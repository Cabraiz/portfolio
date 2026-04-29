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
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

export const HOME_DRIVE_THREE_PEDESTRIAN_SKIN_MATERIALS: Readonly<
  Record<HomeDrivePedestrianSkinToneKey, MeshStandardMaterial>
> = Object.freeze({
  "tone-1": createMaterial("#f1c8a4", 0.82, 0.02),
  "tone-2": createMaterial("#dca67d", 0.82, 0.02),
  "tone-3": createMaterial("#bc7b55", 0.84, 0.02),
  "tone-4": createMaterial("#8f5f45", 0.86, 0.02),
  "tone-5": createMaterial("#68412f", 0.88, 0.02),
  "tone-6": createMaterial("#463025", 0.9, 0.02),
});

export const HOME_DRIVE_THREE_PEDESTRIAN_CLOTHING_MATERIALS: Readonly<
  Record<HomeDrivePedestrianClothingPaletteKey, HomeDriveThreePedestrianClothingMaterials>
> = Object.freeze({
  "coastal-light": {
    shirt: createMaterial("#d8e4dc", 0.78, 0.03),
    pants: createMaterial("#b7c7be", 0.8, 0.03),
    shoes: createMaterial("#645f55", 0.74, 0.04),
    accent: createMaterial("#f0d6a2", 0.66, 0.04),
  },
  "urban-dark": {
    shirt: createMaterial("#23262b", 0.76, 0.08),
    pants: createMaterial("#15181c", 0.78, 0.08),
    shoes: createMaterial("#0f1114", 0.7, 0.08),
    accent: createMaterial("#5f6c73", 0.66, 0.08),
  },
  "office-neutral": {
    shirt: createMaterial("#d4d0c3", 0.7, 0.04),
    pants: createMaterial("#474b4d", 0.72, 0.05),
    shoes: createMaterial("#222120", 0.66, 0.08),
    accent: createMaterial("#8b7e6b", 0.62, 0.06),
  },
  "market-colorful": {
    shirt: createMaterial("#c95f4d", 0.74, 0.04),
    pants: createMaterial("#385f7e", 0.76, 0.04),
    shoes: createMaterial("#2b2d31", 0.72, 0.04),
    accent: createMaterial("#d8bc58", 0.64, 0.04),
  },
  sport: {
    shirt: createMaterial("#4d8cae", 0.68, 0.04),
    pants: createMaterial("#22282d", 0.7, 0.05),
    shoes: createMaterial("#d8d6c8", 0.58, 0.06),
    accent: createMaterial("#df6d43", 0.56, 0.05),
  },
  "casual-blue": {
    shirt: createMaterial("#4d7295", 0.76, 0.04),
    pants: createMaterial("#27384c", 0.78, 0.05),
    shoes: createMaterial("#202226", 0.72, 0.05),
    accent: createMaterial("#b6c2cc", 0.66, 0.04),
  },
  "casual-earth": {
    shirt: createMaterial("#906b4b", 0.8, 0.04),
    pants: createMaterial("#4c4438", 0.82, 0.04),
    shoes: createMaterial("#2d271f", 0.76, 0.05),
    accent: createMaterial("#b8a075", 0.68, 0.04),
  },
});

export const HOME_DRIVE_THREE_PEDESTRIAN_HAIR_MATERIALS: readonly MeshStandardMaterial[] =
  Object.freeze([
    createMaterial("#15110e", 0.82, 0.03),
    createMaterial("#2a1b13", 0.82, 0.03),
    createMaterial("#4b3020", 0.8, 0.03),
    createMaterial("#7d5b35", 0.78, 0.03),
    createMaterial("#b18b52", 0.76, 0.03),
    createMaterial("#3a3a37", 0.86, 0.02),
    createMaterial("#d6d0bd", 0.84, 0.02),
  ]);

export const HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS = Object.freeze({
  cigarette: createMaterial("#f7f1dc", 0.5, 0.02),
  cigaretteTip: new MeshStandardMaterial({
    color: "#ef6d3c",
    emissive: "#b84422",
    emissiveIntensity: 0.62,
    roughness: 0.34,
    metalness: 0.02,
  }),
  shoppingBag: createMaterial("#cfb37d", 0.84, 0.02),
  shoppingBagDark: createMaterial("#7e6246", 0.82, 0.03),
  phone: createMaterial("#101419", 0.42, 0.16),
  backpack: createMaterial("#2d363c", 0.76, 0.08),
  cap: createMaterial("#262b30", 0.72, 0.06),
  handLink: createMaterial("#dfb58b", 0.8, 0.02),
});

export const HOME_DRIVE_THREE_PEDESTRIAN_DEBUG_MATERIALS = Object.freeze({
  sidewalk: new MeshStandardMaterial({
    color: "#8ac7ff",
    roughness: 0.7,
    metalness: 0.02,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  }),
  zoneCenter: new MeshStandardMaterial({
    color: "#ffd166",
    emissive: "#9c6b18",
    emissiveIntensity: 0.35,
    roughness: 0.55,
    metalness: 0.02,
  }),
});

export function getHomeDriveThreePedestrianSkinMaterial(
  key: HomeDrivePedestrianSkinToneKey,
): MeshStandardMaterial {
  return HOME_DRIVE_THREE_PEDESTRIAN_SKIN_MATERIALS[key];
}

export function getHomeDriveThreePedestrianClothingMaterials(
  key: HomeDrivePedestrianClothingPaletteKey,
): HomeDriveThreePedestrianClothingMaterials {
  return HOME_DRIVE_THREE_PEDESTRIAN_CLOTHING_MATERIALS[key];
}

export function getHomeDriveThreePedestrianHairMaterial(
  variant: number,
): MeshStandardMaterial {
  const materials = HOME_DRIVE_THREE_PEDESTRIAN_HAIR_MATERIALS;
  const index = Math.abs(Math.floor(variant)) % materials.length;

  return materials[index] ?? materials[0];
}
