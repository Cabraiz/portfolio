// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleMaterials.ts

import {
  Color,
  MeshStandardMaterial,
  type ColorRepresentation,
  type Material,
} from "three";

import {
  HOME_DRIVE_VEHICLE_PAINT_KEYS,
  type HomeDriveVehiclePaintKey,
} from "../../domain/vehicles";

export type HomeDriveThreeParkedVehicleMaterialMap = Readonly<
  Record<string, Material>
>;

export type HomeDriveThreeParkedVehicleMaterialOptions = Readonly<{
  roughnessBoost?: number;
  metalnessBoost?: number;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getPaintColor(paintKey: HomeDriveVehiclePaintKey): ColorRepresentation {
  switch (paintKey) {
    case "white":
    case "delivery-white":
      return "#e7e4d8";

    case "silver":
      return "#b8b7ae";

    case "black":
      return "#17191b";

    case "graphite":
    case "utility-gray":
      return "#53565a";

    case "red":
      return "#9d2d24";

    case "blue":
      return "#315477";

    case "beige":
      return "#b49a72";

    case "taxi-yellow":
      return "#d8ad32";

    default:
      return "#d8d4c8";
  }
}

function darkenColor(color: ColorRepresentation, amount: number): Color {
  const resolvedColor = new Color(color);
  const safeAmount = clamp(amount, 0, 1);

  resolvedColor.multiplyScalar(1 - safeAmount);

  return resolvedColor;
}

function createPaintMaterial(
  color: ColorRepresentation,
  options: HomeDriveThreeParkedVehicleMaterialOptions,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: clamp(0.58 + (options.roughnessBoost ?? 0), 0, 1),
    metalness: clamp(0.18 + (options.metalnessBoost ?? 0), 0, 1),
    envMapIntensity: 0.45,
  });
}

function createMattePaintMaterial(
  color: ColorRepresentation,
  options: HomeDriveThreeParkedVehicleMaterialOptions,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: darkenColor(color, 0.08),
    roughness: clamp(0.76 + (options.roughnessBoost ?? 0), 0, 1),
    metalness: clamp(0.08 + (options.metalnessBoost ?? 0), 0, 1),
    envMapIntensity: 0.28,
  });
}

function createDarkPaintMaterial(
  color: ColorRepresentation,
  options: HomeDriveThreeParkedVehicleMaterialOptions,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: darkenColor(color, 0.23),
    roughness: clamp(0.66 + (options.roughnessBoost ?? 0), 0, 1),
    metalness: clamp(0.15 + (options.metalnessBoost ?? 0), 0, 1),
    envMapIntensity: 0.36,
  });
}

function createStandardMaterial(params: {
  color: ColorRepresentation;
  roughness: number;
  metalness: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness,
    metalness: params.metalness,
    emissive: params.emissive,
    emissiveIntensity: params.emissiveIntensity ?? 0,
    transparent: params.transparent,
    opacity: params.opacity,
    envMapIntensity: params.metalness > 0.2 ? 0.48 : 0.24,
    depthWrite: params.transparent ? false : true,
  });
}

export function createHomeDriveThreeParkedVehicleMaterials(
  options: HomeDriveThreeParkedVehicleMaterialOptions = {},
): HomeDriveThreeParkedVehicleMaterialMap {
  const materials: Record<string, Material> = {
    glass: createStandardMaterial({
      color: "#18242c",
      roughness: 0.18,
      metalness: 0.02,
      transparent: true,
      opacity: 0.58,
    }),

    rubber: createStandardMaterial({
      color: "#111111",
      roughness: 0.88,
      metalness: 0.02,
    }),

    "wheel-hub": createStandardMaterial({
      color: "#8f8a7c",
      roughness: 0.46,
      metalness: 0.42,
    }),

    bumper: createStandardMaterial({
      color: "#25282a",
      roughness: 0.72,
      metalness: 0.12,
    }),

    headlight: createStandardMaterial({
      color: "#f3e9c7",
      roughness: 0.22,
      metalness: 0.04,
      emissive: "#f8df8f",
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.82,
    }),

    "tail-light": createStandardMaterial({
      color: "#ad2c24",
      roughness: 0.32,
      metalness: 0.02,
      emissive: "#9a120c",
      emissiveIntensity: 0.06,
    }),

    "license-plate": createStandardMaterial({
      color: "#d9d2b8",
      roughness: 0.62,
      metalness: 0.04,
    }),

    mirror: createStandardMaterial({
      color: "#17191a",
      roughness: 0.5,
      metalness: 0.18,
    }),

    handle: createStandardMaterial({
      color: "#2b2c2c",
      roughness: 0.48,
      metalness: 0.32,
    }),

    "door-line": createStandardMaterial({
      color: "#0f1010",
      roughness: 0.84,
      metalness: 0.02,
    }),

    "chrome-trim": createStandardMaterial({
      color: "#b9b39f",
      roughness: 0.3,
      metalness: 0.58,
    }),

    "damage-panel": createStandardMaterial({
      color: "#2f2b26",
      roughness: 0.93,
      metalness: 0.1,
    }),

    "taxi-sign": createStandardMaterial({
      color: "#f0c648",
      roughness: 0.5,
      metalness: 0.04,
      emissive: "#d79d16",
      emissiveIntensity: 0.05,
    }),
  };

  for (const paintKey of HOME_DRIVE_VEHICLE_PAINT_KEYS) {
    const color = getPaintColor(paintKey);

    materials[`paint:${paintKey}`] = createPaintMaterial(color, options);
    materials[`paint:${paintKey}:dark`] = createDarkPaintMaterial(color, options);
    materials[`paint:${paintKey}:matte`] = createMattePaintMaterial(color, options);
  }

  return materials;
}

export function disposeHomeDriveThreeParkedVehicleMaterials(
  materials: HomeDriveThreeParkedVehicleMaterialMap,
): void {
  for (const material of Object.values(materials)) {
    material.dispose();
  }
}

export function getHomeDriveThreeParkedVehicleFallbackMaterialKey(
  materialKey: string,
  materials: HomeDriveThreeParkedVehicleMaterialMap,
): string {
  if (materials[materialKey]) {
    return materialKey;
  }

  if (materialKey.startsWith("paint:")) {
    return "paint:white";
  }

  return "rubber";
}
