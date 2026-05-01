// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstancedRigMaterials.ts

import {
  Color,
  MeshStandardMaterial,
  type ColorRepresentation,
  type MeshStandardMaterialParameters,
} from "three";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianClothingPaletteKey,
  HomeDrivePedestrianSkinToneKey,
} from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianInstancedRigPartKey } from "./homeDriveThree.pedestrianInstancedRigGeometry";

export type HomeDriveThreePedestrianInstancedRigMaterialMap = Readonly<
  Record<HomeDriveThreePedestrianInstancedRigPartKey, MeshStandardMaterial>
>;

export type HomeDriveThreePedestrianInstancedRigPalette = Readonly<{
  skin: ColorRepresentation;
  shirt: ColorRepresentation;
  pants: ColorRepresentation;
  shoes: ColorRepresentation;
  hair: ColorRepresentation;
  accent: ColorRepresentation;
}>;

export type HomeDriveThreePedestrianInstancedRigVisualColorOptions = Readonly<{
  /**
   * Mantido só para compatibilidade.
   *
   * Não existe mais silhouette, loading preto, fog preto ou reveal escuro.
   * O valor é ignorado de propósito.
   */
  fogMix?: number;
}>;

const TEMP_HSL = { h: 0, s: 0, l: 0 };

const SKIN_COLORS: Record<HomeDrivePedestrianSkinToneKey, ColorRepresentation> =
  Object.freeze({
    "tone-1": "#f0c9aa",
    "tone-2": "#dda882",
    "tone-3": "#c48763",
    "tone-4": "#a46f55",
    "tone-5": "#93654e",
    "tone-6": "#8a6150",
  });

const CLOTHING_COLORS: Record<
  HomeDrivePedestrianClothingPaletteKey,
  Readonly<{
    shirt: ColorRepresentation;
    pants: ColorRepresentation;
    shoes: ColorRepresentation;
    accent: ColorRepresentation;
  }>
> = Object.freeze({
  "coastal-light": {
    shirt: "#d9d2bc",
    pants: "#8191a0",
    shoes: "#7b766a",
    accent: "#88b6c7",
  },
  "urban-dark": {
    shirt: "#7b8493",
    pants: "#687384",
    shoes: "#6d737b",
    accent: "#a3aab5",
  },
  "office-neutral": {
    shirt: "#aaa59b",
    pants: "#78818a",
    shoes: "#746f67",
    accent: "#d0b77f",
  },
  "market-colorful": {
    shirt: "#b76558",
    pants: "#5b8290",
    shoes: "#776a5f",
    accent: "#dcaf55",
  },
  sport: {
    shirt: "#568997",
    pants: "#6e7b87",
    shoes: "#7b828b",
    accent: "#c2dbe0",
  },
  "casual-blue": {
    shirt: "#6281a3",
    pants: "#6d7d96",
    shoes: "#747c87",
    accent: "#a8c8df",
  },
  "casual-earth": {
    shirt: "#92775b",
    pants: "#776b5e",
    shoes: "#74685d",
    accent: "#c2a16c",
  },
});

function createRigMaterial(
  parameters?: MeshStandardMaterialParameters,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#ffffff",
    emissiveIntensity: 0.055,
    roughness: 0.84,
    metalness: 0.025,
    vertexColors: true,
    dithering: true,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    ...parameters,
  });
}

function getMinimumLightnessForPart(
  part: HomeDriveThreePedestrianInstancedRigPartKey,
): number {
  switch (part) {
    case "hair":
      return 0.46;

    case "leftFoot":
    case "rightFoot":
      return 0.44;

    case "leftLeg":
    case "rightLeg":
    case "hips":
      return 0.43;

    case "head":
    case "leftUpperArm":
    case "rightUpperArm":
    case "leftLowerArm":
    case "rightLowerArm":
      return 0.42;

    case "torso":
    default:
      return 0.45;
  }
}

function getMaximumSaturationForPart(
  part: HomeDriveThreePedestrianInstancedRigPartKey,
): number {
  switch (part) {
    case "hair":
      return 0.58;

    case "leftFoot":
    case "rightFoot":
      return 0.5;

    case "leftLeg":
    case "rightLeg":
    case "hips":
      return 0.62;

    case "torso":
      return 0.7;

    default:
      return 0.66;
  }
}

function enforceReadablePedestrianColor(
  out: Color,
  part: HomeDriveThreePedestrianInstancedRigPartKey,
): Color {
  out.getHSL(TEMP_HSL);

  const minimumLightness = getMinimumLightnessForPart(part);
  const maximumSaturation = getMaximumSaturationForPart(part);

  if (TEMP_HSL.l < minimumLightness || TEMP_HSL.s > maximumSaturation) {
    out.setHSL(
      TEMP_HSL.h,
      Math.min(TEMP_HSL.s, maximumSaturation),
      Math.max(TEMP_HSL.l, minimumLightness),
    );
  }

  return out;
}

export function createHomeDriveThreePedestrianInstancedRigMaterials(): HomeDriveThreePedestrianInstancedRigMaterialMap {
  const skin = createRigMaterial({
    roughness: 0.76,
    emissiveIntensity: 0.075,
  });
  const cloth = createRigMaterial({
    roughness: 0.86,
    emissiveIntensity: 0.07,
  });
  const hair = createRigMaterial({
    roughness: 0.9,
    emissiveIntensity: 0.08,
  });
  const shoes = createRigMaterial({
    roughness: 0.84,
    metalness: 0.04,
    emissiveIntensity: 0.085,
  });

  return {
    torso: cloth,
    hips: cloth.clone(),
    head: skin,
    hair,
    leftUpperArm: skin.clone(),
    rightUpperArm: skin.clone(),
    leftLowerArm: skin.clone(),
    rightLowerArm: skin.clone(),
    leftLeg: cloth.clone(),
    rightLeg: cloth.clone(),
    leftFoot: shoes,
    rightFoot: shoes.clone(),
  };
}

export function disposeHomeDriveThreePedestrianInstancedRigMaterials(
  materials: HomeDriveThreePedestrianInstancedRigMaterialMap,
): void {
  Object.values(materials).forEach((material) => {
    material.dispose();
  });
}

export function getHomeDriveThreePedestrianInstancedRigPalette(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianInstancedRigPalette {
  const clothing =
    CLOTHING_COLORS[agent.appearance.clothingPaletteKey] ??
    CLOTHING_COLORS["casual-blue"];

  const hairVariant = Math.abs(agent.appearance.hairVariant) % 5;
  const hairColors: readonly ColorRepresentation[] = [
    "#6d594a",
    "#7b604b",
    "#8a6749",
    "#9a805c",
    "#736b5f",
  ];

  return {
    skin: SKIN_COLORS[agent.appearance.skinToneKey] ?? SKIN_COLORS["tone-3"],
    shirt: clothing.shirt,
    pants: clothing.pants,
    shoes: clothing.shoes,
    hair: hairColors[hairVariant],
    accent: clothing.accent,
  };
}

export function writeHomeDriveThreePedestrianInstancedRigPartColor(
  out: Color,
  part: HomeDriveThreePedestrianInstancedRigPartKey,
  palette: HomeDriveThreePedestrianInstancedRigPalette,
): Color {
  switch (part) {
    case "head":
    case "leftUpperArm":
    case "rightUpperArm":
    case "leftLowerArm":
    case "rightLowerArm":
      out.set(palette.skin);
      break;

    case "hair":
      out.set(palette.hair);
      break;

    case "leftLeg":
    case "rightLeg":
    case "hips":
      out.set(palette.pants);
      break;

    case "leftFoot":
    case "rightFoot":
      out.set(palette.shoes);
      break;

    case "torso":
    default:
      out.set(palette.shirt);
      break;
  }

  return enforceReadablePedestrianColor(out, part);
}

/**
 * Cor final do rig instanciado.
 *
 * Removido de propósito:
 * - silhouetteMix;
 * - far silhouette color;
 * - lerp para preto;
 * - reveal visual escuro;
 * - qualquer cor abaixo do piso mínimo de luminosidade.
 *
 * O pedestre entra commitado já colorido, ou não entra no render.
 */
export function writeHomeDriveThreePedestrianInstancedRigPartVisualColor(
  out: Color,
  part: HomeDriveThreePedestrianInstancedRigPartKey,
  palette: HomeDriveThreePedestrianInstancedRigPalette,
  _options?: HomeDriveThreePedestrianInstancedRigVisualColorOptions,
): Color {
  return writeHomeDriveThreePedestrianInstancedRigPartColor(out, part, palette);
}

export function getHomeDriveThreePedestrianInstancedRigPartColor(
  part: HomeDriveThreePedestrianInstancedRigPartKey,
  palette: HomeDriveThreePedestrianInstancedRigPalette,
): Color {
  return writeHomeDriveThreePedestrianInstancedRigPartColor(
    new Color(),
    part,
    palette,
  );
}
