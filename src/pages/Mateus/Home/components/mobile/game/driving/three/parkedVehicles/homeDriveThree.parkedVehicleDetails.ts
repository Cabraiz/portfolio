// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import type { HomeDriveVehicleModelKey } from "../../domain/vehicles";

export type HomeDriveThreeParkedVehicleGeometryKind =
  | "box"
  | "wheel"
  | "cylinder";

export type HomeDriveThreeParkedVehiclePartKind =
  | "body"
  | "cabin"
  | "glass"
  | "wheel"
  | "headlight"
  | "tail-light"
  | "bumper"
  | "license-plate"
  | "mirror"
  | "door-line"
  | "handle"
  | "chrome-trim"
  | "damage-panel"
  | "taxi-sign"
  | "cargo-box"
  | "roof-rack";

export type HomeDriveThreeParkedVehicleDetailPart = Readonly<{
  id: string;
  partKind: HomeDriveThreeParkedVehiclePartKind;
  geometryKind: HomeDriveThreeParkedVehicleGeometryKind;
  materialKey: string;

  /**
   * Coordenadas locais:
   * x = lateral do carro
   * y = altura
   * z = comprimento do carro
   */
  localPosition: readonly [number, number, number];
  localRotation: readonly [number, number, number];
  localScale: readonly [number, number, number];

  renderOrder?: number;
}>;

type VehicleDetailProfile = Readonly<{
  hoodRatio: number;
  cabinWidthRatio: number;
  cabinLengthRatio: number;
  cabinHeightRatio: number;
  cabinZRatio: number;
  glassHeightRatio: number;
  wheelRadiusRatio: number;
  wheelWidthRatio: number;
  hasCargoBox: boolean;
  hasTaxiSign: boolean;
  hasRoofRack: boolean;
  hasChromeTrim: boolean;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getStableUnit(seed: number, salt: number): number {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453123;

  return value - Math.floor(value);
}

function getDamage(vehicle: HomeDriveParkedVehicle): number {
  const maybeVehicle = vehicle as HomeDriveParkedVehicle & {
    damage?: number;
  };

  return clamp(maybeVehicle.damage ?? 0, 0, 1);
}

function isModelLike(modelKey: HomeDriveVehicleModelKey, needle: string): boolean {
  return String(modelKey).includes(needle);
}

function getDetailProfile(vehicle: HomeDriveParkedVehicle): VehicleDetailProfile {
  const seed = vehicle.seed;
  const modelKey = vehicle.modelKey;

  const isPickup = isModelLike(modelKey, "pickup");
  const isVan = isModelLike(modelKey, "van");
  const isTaxi = isModelLike(modelKey, "taxi");
  const isDelivery = isModelLike(modelKey, "delivery");
  const isSuv = isModelLike(modelKey, "suv");

  return {
    hoodRatio: isVan || isDelivery ? 0.22 : isPickup ? 0.34 : 0.3,
    cabinWidthRatio: isVan || isDelivery ? 0.84 : isSuv ? 0.78 : 0.74,
    cabinLengthRatio: isVan || isDelivery ? 0.58 : isPickup ? 0.42 : 0.46,
    cabinHeightRatio: isVan || isDelivery ? 0.58 : isSuv ? 0.48 : 0.42,
    cabinZRatio: isPickup ? -0.04 : isVan || isDelivery ? 0.02 : -0.02,
    glassHeightRatio: isVan || isDelivery ? 0.24 : 0.21,
    wheelRadiusRatio: isSuv || isPickup ? 0.18 : 0.16,
    wheelWidthRatio: 0.12,
    hasCargoBox: isDelivery || isVan,
    hasTaxiSign: isTaxi,
    hasRoofRack: isSuv || getStableUnit(seed, 31) > 0.78,
    hasChromeTrim: getStableUnit(seed, 37) > 0.42,
  };
}

function createPart(
  vehicle: HomeDriveParkedVehicle,
  partKind: HomeDriveThreeParkedVehiclePartKind,
  geometryKind: HomeDriveThreeParkedVehicleGeometryKind,
  materialKey: string,
  localPosition: readonly [number, number, number],
  localScale: readonly [number, number, number],
  localRotation: readonly [number, number, number] = [0, 0, 0],
  renderOrder = 0,
): HomeDriveThreeParkedVehicleDetailPart {
  return {
    id: `${vehicle.id}:${partKind}:${localPosition.join(":")}`,
    partKind,
    geometryKind,
    materialKey,
    localPosition,
    localRotation,
    localScale,
    renderOrder,
  };
}

function pushWheelParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const wheelRadius = vehicle.heightMeters * profile.wheelRadiusRatio;
  const wheelWidth = vehicle.widthMeters * profile.wheelWidthRatio;
  const wheelX = vehicle.widthMeters * 0.48;
  const wheelZ = vehicle.lengthMeters * 0.34;
  const wheelY = wheelRadius + 0.02;

  const wheelScale: readonly [number, number, number] = [
    wheelRadius,
    wheelWidth,
    wheelRadius,
  ];

  const wheelRotation: readonly [number, number, number] = [Math.PI / 2, 0, 0];

  for (const side of [-1, 1] as const) {
    for (const longitudinal of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "wheel",
          "wheel",
          "rubber",
          [side * wheelX, wheelY, longitudinal * wheelZ],
          wheelScale,
          wheelRotation,
          3,
        ),
      );

      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "cylinder",
          "wheel-hub",
          [side * (wheelX + 0.01 * side), wheelY, longitudinal * wheelZ],
          [wheelRadius * 0.52, wheelWidth * 0.18, wheelRadius * 0.52],
          wheelRotation,
          4,
        ),
      );
    }
  }
}

function pushLightsAndPlates(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
): void {
  const frontZ = vehicle.lengthMeters * 0.505;
  const rearZ = -vehicle.lengthMeters * 0.505;
  const lightY = vehicle.heightMeters * 0.34;
  const lightX = vehicle.widthMeters * 0.31;

  for (const side of [-1, 1] as const) {
    parts.push(
      createPart(
        vehicle,
        "headlight",
        "box",
        "headlight",
        [side * lightX, lightY, frontZ],
        [vehicle.widthMeters * 0.14, vehicle.heightMeters * 0.07, 0.035],
        [0, 0, 0],
        5,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "tail-light",
        "box",
        "tail-light",
        [side * lightX, lightY, rearZ],
        [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.075, 0.035],
        [0, 0, 0],
        5,
      ),
    );
  }

  parts.push(
    createPart(
      vehicle,
      "license-plate",
      "box",
      "license-plate",
      [0, vehicle.heightMeters * 0.24, frontZ + 0.012],
      [vehicle.widthMeters * 0.24, vehicle.heightMeters * 0.065, 0.018],
      [0, 0, 0],
      6,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "license-plate",
      "box",
      "license-plate",
      [0, vehicle.heightMeters * 0.24, rearZ - 0.012],
      [vehicle.widthMeters * 0.24, vehicle.heightMeters * 0.065, 0.018],
      [0, 0, 0],
      6,
    ),
  );
}

function pushMirrorsHandlesAndTrim(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const mirrorY = vehicle.heightMeters * 0.64;
  const mirrorZ = vehicle.lengthMeters * 0.08;
  const mirrorX = vehicle.widthMeters * 0.56;

  for (const side of [-1, 1] as const) {
    parts.push(
      createPart(
        vehicle,
        "mirror",
        "box",
        "mirror",
        [side * mirrorX, mirrorY, mirrorZ],
        [vehicle.widthMeters * 0.07, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.045],
        [0, 0, side * 0.08],
        7,
      ),
    );

    for (const z of [-0.16, 0.16] as const) {
      parts.push(
        createPart(
          vehicle,
          "handle",
          "box",
          "handle",
          [side * vehicle.widthMeters * 0.512, vehicle.heightMeters * 0.43, vehicle.lengthMeters * z],
          [vehicle.widthMeters * 0.035, vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.075],
          [0, 0, 0],
          7,
        ),
      );
    }

    parts.push(
      createPart(
        vehicle,
        "door-line",
        "box",
        "door-line",
        [side * vehicle.widthMeters * 0.506, vehicle.heightMeters * 0.44, 0],
        [vehicle.widthMeters * 0.012, vehicle.heightMeters * 0.36, 0.018],
        [0, 0, 0],
        6,
      ),
    );
  }

  if (profile.hasChromeTrim) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          "chrome-trim",
          [side * vehicle.widthMeters * 0.514, vehicle.heightMeters * 0.5, 0],
          [vehicle.widthMeters * 0.015, vehicle.heightMeters * 0.025, vehicle.lengthMeters * 0.62],
          [0, 0, 0],
          8,
        ),
      );
    }
  }
}

function pushDamageParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
): void {
  const damage = getDamage(vehicle);

  if (damage <= 0.03) {
    return;
  }

  const side = getStableUnit(vehicle.seed, 71) > 0.5 ? 1 : -1;
  const z = (getStableUnit(vehicle.seed, 73) - 0.5) * vehicle.lengthMeters * 0.42;

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "damage-panel",
      [
        side * vehicle.widthMeters * 0.518,
        vehicle.heightMeters * (0.34 + damage * 0.16),
        z,
      ],
      [
        vehicle.widthMeters * 0.018,
        vehicle.heightMeters * clamp(0.14 + damage * 0.22, 0.12, 0.42),
        vehicle.lengthMeters * clamp(0.12 + damage * 0.22, 0.12, 0.38),
      ],
      [0, 0, side * damage * 0.18],
      9,
    ),
  );
}

export function getHomeDriveThreeParkedVehicleDetailParts(
  vehicle: HomeDriveParkedVehicle,
): readonly HomeDriveThreeParkedVehicleDetailPart[] {
  const profile = getDetailProfile(vehicle);
  const parts: HomeDriveThreeParkedVehicleDetailPart[] = [];

  const bodyHeight = vehicle.heightMeters * 0.46;
  const bodyY = bodyHeight * 0.5 + 0.08;

  parts.push(
    createPart(
      vehicle,
      "body",
      "box",
      `paint:${vehicle.paintKey}`,
      [0, bodyY, 0],
      [vehicle.widthMeters, bodyHeight, vehicle.lengthMeters],
      [0, 0, 0],
      1,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "cabin",
      "box",
      `paint:${vehicle.paintKey}:dark`,
      [0, bodyY + bodyHeight * 0.44, vehicle.lengthMeters * profile.cabinZRatio],
      [
        vehicle.widthMeters * profile.cabinWidthRatio,
        vehicle.heightMeters * profile.cabinHeightRatio,
        vehicle.lengthMeters * profile.cabinLengthRatio,
      ],
      [0, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "glass",
      "box",
      "glass",
      [0, bodyY + bodyHeight * 0.68, vehicle.lengthMeters * (profile.cabinZRatio + 0.01)],
      [
        vehicle.widthMeters * (profile.cabinWidthRatio * 0.92),
        vehicle.heightMeters * profile.glassHeightRatio,
        vehicle.lengthMeters * (profile.cabinLengthRatio * 0.84),
      ],
      [0, 0, 0],
      4,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "bumper",
      "box",
      "bumper",
      [0, vehicle.heightMeters * 0.22, vehicle.lengthMeters * 0.525],
      [vehicle.widthMeters * 0.86, vehicle.heightMeters * 0.1, vehicle.lengthMeters * 0.045],
      [0, 0, 0],
      5,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "bumper",
      "box",
      "bumper",
      [0, vehicle.heightMeters * 0.22, -vehicle.lengthMeters * 0.525],
      [vehicle.widthMeters * 0.86, vehicle.heightMeters * 0.1, vehicle.lengthMeters * 0.045],
      [0, 0, 0],
      5,
    ),
  );

  if (profile.hasCargoBox) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        `paint:${vehicle.paintKey}:matte`,
        [0, bodyY + bodyHeight * 0.42, -vehicle.lengthMeters * 0.11],
        [
          vehicle.widthMeters * 0.82,
          vehicle.heightMeters * 0.58,
          vehicle.lengthMeters * 0.48,
        ],
        [0, 0, 0],
        2,
      ),
    );
  }

  if (profile.hasTaxiSign) {
    parts.push(
      createPart(
        vehicle,
        "taxi-sign",
        "box",
        "taxi-sign",
        [0, vehicle.heightMeters * 1.02, vehicle.lengthMeters * 0.02],
        [vehicle.widthMeters * 0.34, vehicle.heightMeters * 0.075, vehicle.lengthMeters * 0.16],
        [0, 0, 0],
        10,
      ),
    );
  }

  if (profile.hasRoofRack) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "roof-rack",
          "box",
          "rubber",
          [side * vehicle.widthMeters * 0.24, vehicle.heightMeters * 1.02, 0],
          [vehicle.widthMeters * 0.035, vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.46],
          [0, 0, 0],
          10,
        ),
      );
    }
  }

  pushWheelParts(parts, vehicle, profile);
  pushLightsAndPlates(parts, vehicle);
  pushMirrorsHandlesAndTrim(parts, vehicle, profile);
  pushDamageParts(parts, vehicle);

  return parts;
}
