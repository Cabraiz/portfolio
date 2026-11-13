// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.profile.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	getHomeDriveVehicleModelDescriptor,
	isHomeDriveVehicleTwoWheeler,
	type HomeDriveVehicleModelKey,
} from "../../domain/vehicles";

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
  localPosition: readonly [number, number, number];
  localRotation: readonly [number, number, number];
  localScale: readonly [number, number, number];
  renderOrder?: number;
}>;

export type VehicleDetailProfile = Readonly<{
  modelKey: HomeDriveVehicleModelKey;
  bodyHeightRatio: number;
  lowerBodyLengthRatio: number;
  hoodLengthRatio: number;
  trunkLengthRatio: number;
  hoodHeightRatio: number;
  trunkHeightRatio: number;
  cabinWidthRatio: number;
  cabinLengthRatio: number;
  cabinHeightRatio: number;
  cabinZRatio: number;
  glassHeightRatio: number;
  wheelRadiusRatio: number;
  wheelWidthRatio: number;
  frontWheelZRatio: number;
  rearWheelZRatio: number;
  wheelXRatio: number;
  pickupBedLengthRatio: number;
  hasCargoBox: boolean;
  hasTaxiSign: boolean;
  hasRoofRack: boolean;
  hasChromeTrim: boolean;
  hasBullBar: boolean;
  isPickup: boolean;
  isVan: boolean;
  isBus: boolean;
  isTruck: boolean;
  isSuv: boolean;
  isWagon: boolean;
  isCoupe: boolean;
  isEmergency: boolean;
  isPolice: boolean;
  isTwoWheeler: boolean;
  isMotorcycle: boolean;
  isBicycle: boolean;
}>;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getStableUnit(seed: number, salt: number): number {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453123;

  return value - Math.floor(value);
}

export function getDamage(vehicle: HomeDriveParkedVehicle): number {
  const maybeVehicle = vehicle as HomeDriveParkedVehicle & {
    damage?: number;
  };

  return clamp(maybeVehicle.damage ?? 0, 0, 1);
}

export function getDamageSide(vehicle: HomeDriveParkedVehicle): -1 | 1 {
  const maybeVehicle = vehicle as HomeDriveParkedVehicle & {
    damageSide?: number;
  };

  return (maybeVehicle.damageSide ?? 1) < 0 ? -1 : 1;
}

export function getDamageLocalZ(vehicle: HomeDriveParkedVehicle): number {
  const maybeVehicle = vehicle as HomeDriveParkedVehicle & {
    damageLocalZ?: number;
  };

  return clamp(
    maybeVehicle.damageLocalZ ??
      (getStableUnit(vehicle.seed, 73) - 0.5) * vehicle.lengthMeters * 0.42,
    -vehicle.lengthMeters * 0.42,
    vehicle.lengthMeters * 0.42,
  );
}

function isModelLike(modelKey: HomeDriveVehicleModelKey, needle: string): boolean {
  return String(modelKey).includes(needle);
}

export function getPaintMaterialKey(
  vehicle: HomeDriveParkedVehicle,
  salt: number,
  preferredVariant: "base" | "dark" | "matte" = "base",
): string {
  const unit = getStableUnit(vehicle.seed, salt);

  if (preferredVariant === "dark") {
    return unit > 0.28 ? `paint:${vehicle.paintKey}:dark` : `paint:${vehicle.paintKey}`;
  }

  if (preferredVariant === "matte") {
    if (unit > 0.54) {
      return `paint:${vehicle.paintKey}:matte`;
    }

    return unit > 0.22 ? `paint:${vehicle.paintKey}:sunfaded` : `paint:${vehicle.paintKey}`;
  }

  if (unit > 0.82) {
    return `paint:${vehicle.paintKey}:fresh`;
  }

  if (unit > 0.58) {
    return `paint:${vehicle.paintKey}:sunfaded`;
  }

  if (unit > 0.36) {
    return `paint:${vehicle.paintKey}:matte`;
  }

  return `paint:${vehicle.paintKey}`;
}

export function getDetailProfile(vehicle: HomeDriveParkedVehicle): VehicleDetailProfile {
  const seed = vehicle.seed;
  const modelKey = vehicle.modelKey;
  const descriptor = getHomeDriveVehicleModelDescriptor(modelKey);
  const visual = descriptor.visual;

  const isPickup = isModelLike(modelKey, "pickup");
  const isVan = isModelLike(modelKey, "van");
  const isTaxi = isModelLike(modelKey, "taxi");
  const isDelivery = isModelLike(modelKey, "delivery");
  const isSuv = isModelLike(modelKey, "suv");
  const isWagon = isModelLike(modelKey, "wagon");
  const isCoupe = isModelLike(modelKey, "coupe");
  const isBus = isModelLike(modelKey, "bus");
  const isTruck = isModelLike(modelKey, "truck");
  const isEmergency = isModelLike(modelKey, "ambulance");
  const isPolice = isModelLike(modelKey, "police");
  const isTwoWheeler = isHomeDriveVehicleTwoWheeler(modelKey);
  const isMotorcycle = descriptor.category === "motorcycle";
  const isBicycle = descriptor.category === "bicycle";

  const bodyHeightRatio = clamp(
    descriptor.category === "truck"
      ? 0.42
      : descriptor.category === "bus" || descriptor.category === "microbus"
        ? 0.5
        : 0.34 + visual.cabinHeightRatio * 0.22,
    0.34,
    0.56,
  );

  const lowerBodyLengthRatio = clamp(
    descriptor.category === "bus"
      ? 0.9
      : descriptor.category === "truck"
        ? 0.84
        : 0.58 + visual.hoodRatio * 0.18 + visual.trunkRatio * 0.16,
    0.62,
    0.92,
  );

  const cabinLengthRatio = clamp(
    descriptor.category === "bus" || descriptor.category === "microbus"
      ? 0.72
      : descriptor.category === "truck"
        ? 0.24
        : visual.cabinRatio * (isCoupe ? 0.92 : isWagon ? 1.08 : 1),
    isPickup ? 0.26 : 0.22,
    descriptor.category === "bus" ? 0.8 : 0.68,
  );

  const cabinHeightRatio = clamp(
    descriptor.category === "bus" || descriptor.category === "microbus"
      ? 0.42
      : descriptor.category === "truck"
        ? 0.28
        : visual.cabinHeightRatio * (isSuv ? 0.98 : 0.9),
    0.24,
    0.62,
  );

  return {
    modelKey,
    bodyHeightRatio,
    lowerBodyLengthRatio,
    hoodLengthRatio: clamp(visual.hoodRatio * (isVan ? 0.72 : isPickup ? 1.08 : 1), 0.18, 0.34),
    trunkLengthRatio: clamp(
      isPickup
        ? visual.trunkRatio * 1.1
        : isWagon
          ? Math.max(0.24, visual.trunkRatio * 1.12)
          : isCoupe
            ? visual.trunkRatio * 0.84
            : visual.trunkRatio,
      0.1,
      0.36,
    ),
    hoodHeightRatio: clamp(isTruck ? 0.72 : isBus ? 0.84 : isSuv ? 0.72 : 0.64, 0.54, 0.9),
    trunkHeightRatio: clamp(isPickup ? 0.72 : isWagon ? 0.74 : isBus ? 0.92 : 0.62, 0.54, 0.96),
    cabinWidthRatio: clamp(
      descriptor.category === "bus" || descriptor.category === "microbus"
        ? 0.88
        : descriptor.category === "truck"
          ? 0.68
          : isSuv
            ? 0.82
            : isCoupe
              ? 0.7
              : isVan
                ? 0.86
                : 0.74 + getStableUnit(seed, 41) * 0.06,
      0.64,
      0.9,
    ),
    cabinLengthRatio,
    cabinHeightRatio,
    cabinZRatio: clamp(
      visual.cabinForwardOffsetMeters +
        (isPickup ? -0.08 : 0) +
        (isTruck ? -0.12 : 0) +
        (isBus ? 0.04 : 0),
      -0.42,
      0.12,
    ),
    glassHeightRatio: clamp(isVan || isBus ? 0.22 : isCoupe ? 0.16 : 0.19 + visual.cabinHeightRatio * 0.08, 0.12, 0.26),
    wheelRadiusRatio: clamp(
      isTruck ? 0.21 : isBus ? 0.18 : visual.wheelRadiusMeters / Math.max(0.001, vehicle.heightMeters),
      0.13,
      0.24,
    ),
    wheelWidthRatio: clamp(visual.wheelWidthMeters / Math.max(0.001, vehicle.widthMeters), 0.1, 0.18),
    frontWheelZRatio: clamp(isBus ? 0.34 : isTruck ? 0.3 : 0.35, 0.26, 0.38),
    rearWheelZRatio: clamp(isBus ? 0.34 : isTruck ? 0.3 : 0.34, 0.24, 0.38),
    wheelXRatio: clamp(isTruck || isBus ? 0.46 : 0.48, 0.42, 0.5),
    pickupBedLengthRatio: clamp(isPickup ? Math.max(0.24, visual.trunkRatio * 1.16) : 0, 0, 0.4),
    hasCargoBox: isDelivery || isVan || isTruck,
    hasTaxiSign: isTaxi,
    hasRoofRack: isSuv || isWagon || getStableUnit(seed, 31) > 0.8,
    hasChromeTrim: !isTruck && !isBus && getStableUnit(seed, 37) > 0.36,
    hasBullBar: (isSuv || isPickup) && getStableUnit(seed, 43) > 0.72,
    isPickup,
    isVan,
    isBus,
    isTruck,
    isSuv,
    isWagon,
    isCoupe,
    isEmergency,
    isPolice,
    isTwoWheeler,
    isMotorcycle,
    isBicycle,
  };
}

export function createPart(
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
