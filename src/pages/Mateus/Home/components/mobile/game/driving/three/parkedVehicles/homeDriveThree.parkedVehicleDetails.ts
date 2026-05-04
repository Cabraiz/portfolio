// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.ts

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

type VehicleDetailProfile = Readonly<{
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

function getDamageSide(vehicle: HomeDriveParkedVehicle): -1 | 1 {
  const maybeVehicle = vehicle as HomeDriveParkedVehicle & {
    damageSide?: number;
  };

  return (maybeVehicle.damageSide ?? 1) < 0 ? -1 : 1;
}

function getDamageLocalZ(vehicle: HomeDriveParkedVehicle): number {
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

function getPaintMaterialKey(
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

function getDetailProfile(vehicle: HomeDriveParkedVehicle): VehicleDetailProfile {
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


function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getPartDamageInfluence(
  vehicle: HomeDriveParkedVehicle,
  part: HomeDriveThreeParkedVehicleDetailPart,
): number {
  const damage = getDamage(vehicle);

  if (damage <= 0.03) {
    return 0;
  }

  const side = getDamageSide(vehicle);
  const damageZ = getDamageLocalZ(vehicle);
  const [localX, , localZ] = part.localPosition;
  const xSign = Math.sign(localX) || side;
  const sideProximity = xSign === side
    ? 1
    : Math.abs(localX) <= vehicle.widthMeters * 0.12
      ? 0.28
      : 0;

  if (sideProximity <= 0) {
    return 0;
  }

  const longitudinalSpan = vehicle.lengthMeters * clamp(0.18 + damage * 0.24, 0.18, 0.42);
  const longitudinalProximity = clamp01(
    1 - Math.abs(localZ - damageZ) / Math.max(0.0001, longitudinalSpan),
  );
  const sameEnd =
    Math.sign(localZ || damageZ || 0) === Math.sign(damageZ || 0) &&
    Math.abs(localZ) >= vehicle.lengthMeters * 0.26;

  const nearCenterLine = Math.abs(localX) <= vehicle.widthMeters * 0.18;

  let partWeight = 0.58;

  switch (part.partKind) {
    case "body":
    case "cabin":
    case "cargo-box":
      partWeight = 1;
      break;

    case "glass":
      partWeight = 0.82;
      break;

    case "mirror":
    case "handle":
    case "door-line":
    case "chrome-trim":
    case "roof-rack":
      partWeight = 0.92;
      break;

    case "headlight":
    case "tail-light":
    case "license-plate":
    case "bumper":
      partWeight = sameEnd ? 0.94 : 0.16;
      break;

    case "wheel":
      partWeight = sameEnd ? 0.34 : 0.12;
      break;

    case "damage-panel":
      partWeight = 0;
      break;

    default:
      partWeight = nearCenterLine ? 0.44 : 0.7;
      break;
  }

  if (partWeight <= 0) {
    return 0;
  }

  const zoneWeight = sameEnd
    ? Math.max(longitudinalProximity, 0.66)
    : longitudinalProximity * 0.92 + (nearCenterLine ? longitudinalProximity * 0.16 : 0);

  return clamp01(damage * sideProximity * partWeight * zoneWeight);
}

function applyDamageToPart(
  vehicle: HomeDriveParkedVehicle,
  part: HomeDriveThreeParkedVehicleDetailPart,
): HomeDriveThreeParkedVehicleDetailPart {
  const damage = getDamage(vehicle);
  const influence = getPartDamageInfluence(vehicle, part);

  if (damage <= 0.03 || influence <= 0.001) {
    return part;
  }

  const side = getDamageSide(vehicle);
  const damageZ = getDamageLocalZ(vehicle);
  let [x, y, z] = part.localPosition;
  let [sx, sy, sz] = part.localScale;
  let [rx, ry, rz] = part.localRotation;

  const crushDepth = vehicle.widthMeters * (0.055 + damage * 0.14) * influence;
  const verticalSink = vehicle.heightMeters * (0.018 + damage * 0.05) * influence;
  const shearTowardImpact = (damageZ - z) * 0.14 * influence;
  const sameEndSign = Math.sign(z || damageZ || 0) === Math.sign(damageZ || 0) ? 1 : 0;
  const endCrush = sameEndSign * damage * influence;

  x -= side * crushDepth;
  y -= verticalSink;
  z += shearTowardImpact;

  rz += side * damage * 0.26 * influence;
  ry += side * damage * 0.1 * influence;
  rx += damage * 0.04 * influence;

  sx *= clamp(1 - influence * 0.22, 0.62, 1.05);
  sy *= clamp(1 - influence * 0.08, 0.72, 1.06);
  sz *= clamp(1 - influence * 0.1, 0.66, 1.06);

  switch (part.partKind) {
    case "body":
    case "cabin":
    case "cargo-box":
      x -= side * vehicle.widthMeters * 0.03 * influence;
      sx *= clamp(1 - influence * 0.14, 0.58, 1.04);
      sz *= clamp(1 - influence * 0.08, 0.72, 1.02);
      break;

    case "glass":
      x -= side * vehicle.widthMeters * 0.022 * influence;
      y -= vehicle.heightMeters * 0.012 * influence;
      ry += side * damage * 0.08 * influence;
      sy *= clamp(1 - influence * 0.12, 0.62, 1);
      break;

    case "mirror":
      x -= side * vehicle.widthMeters * 0.05 * influence;
      y -= vehicle.heightMeters * 0.04 * influence;
      z += shearTowardImpact * 0.85;
      rz += side * (0.18 + damage * 0.22) * influence;
      ry += side * (0.12 + damage * 0.14) * influence;
      sx *= clamp(1 - influence * 0.3, 0.42, 1);
      sy *= clamp(1 - influence * 0.28, 0.38, 1);
      sz *= clamp(1 - influence * 0.34, 0.44, 1);
      break;

    case "handle":
    case "door-line":
    case "chrome-trim":
    case "roof-rack":
      x -= side * vehicle.widthMeters * 0.025 * influence;
      y -= vehicle.heightMeters * 0.014 * influence;
      z += shearTowardImpact * 0.65;
      rz += side * damage * 0.1 * influence;
      sx *= clamp(1 - influence * 0.22, 0.5, 1);
      sy *= clamp(1 - influence * 0.2, 0.46, 1);
      break;

    case "headlight":
    case "tail-light":
    case "license-plate":
    case "bumper": {
      const endDirection = Math.sign(z || damageZ || 0) || Math.sign(damageZ || 1);
      x -= side * vehicle.widthMeters * 0.028 * endCrush;
      z -= endDirection * vehicle.lengthMeters * 0.045 * endCrush;
      y -= vehicle.heightMeters * 0.02 * endCrush;
      ry += side * damage * 0.16 * endCrush;
      rz += side * damage * 0.12 * endCrush;
      sx *= clamp(1 - endCrush * 0.18, 0.44, 1.02);
      sy *= clamp(1 - endCrush * 0.12, 0.5, 1.02);
      break;
    }

    case "wheel":
      x -= side * vehicle.widthMeters * 0.012 * endCrush;
      z -= Math.sign(z || 1) * vehicle.lengthMeters * 0.016 * endCrush;
      ry += side * damage * 0.04 * endCrush;
      break;

    default:
      break;
  }

  const nextLocalPosition: readonly [number, number, number] = [x, y, z];
  const nextLocalRotation: readonly [number, number, number] = [rx, ry, rz];
  const nextLocalScale: readonly [number, number, number] = [sx, sy, sz];

  return {
    ...part,
    localPosition: nextLocalPosition,
    localRotation: nextLocalRotation,
    localScale: nextLocalScale,
  };
}

function pushWheelParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const wheelRadius = vehicle.heightMeters * profile.wheelRadiusRatio;
  const wheelWidth = vehicle.widthMeters * profile.wheelWidthRatio;
  const wheelX = vehicle.widthMeters * profile.wheelXRatio;
  const frontWheelZ = vehicle.lengthMeters * profile.frontWheelZRatio;
  const rearWheelZ = vehicle.lengthMeters * profile.rearWheelZRatio;
  const wheelY = wheelRadius + 0.02;

  const wheelScale: readonly [number, number, number] = [
    wheelRadius,
    wheelWidth,
    wheelRadius,
  ];

  const wheelRotation: readonly [number, number, number] = [Math.PI / 2, 0, 0];

  for (const side of [-1, 1] as const) {
    for (const longitudinal of [-1, 1] as const) {
      const z = longitudinal > 0 ? frontWheelZ : -rearWheelZ;
      parts.push(
        createPart(
          vehicle,
          "wheel",
          "wheel",
          "rubber",
          [side * wheelX, wheelY, z],
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
          profile.isTruck || profile.isBus ? "chrome-trim" : "wheel-hub",
          [side * (wheelX + 0.01 * side), wheelY, z],
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
  profile: VehicleDetailProfile,
): void {
  const frontZ = vehicle.lengthMeters * 0.505;
  const rearZ = -vehicle.lengthMeters * 0.505;
  const lightY = vehicle.heightMeters * (profile.isBus ? 0.42 : 0.34);
  const lightX = vehicle.widthMeters * (profile.isBus ? 0.36 : 0.31);

  for (const side of [-1, 1] as const) {
    parts.push(
      createPart(
        vehicle,
        "headlight",
        "box",
        "headlight",
        [side * lightX, lightY, frontZ],
        [vehicle.widthMeters * (profile.isBus ? 0.1 : 0.14), vehicle.heightMeters * 0.07, 0.035],
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
        [vehicle.widthMeters * (profile.isBus ? 0.09 : 0.12), vehicle.heightMeters * 0.075, 0.035],
        [0, 0, 0],
        5,
      ),
    );
  }

  if (!profile.isTwoWheeler) {
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
}

function pushMirrorsHandlesAndTrim(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const mirrorY = vehicle.heightMeters * (profile.isVan || profile.isBus ? 0.7 : 0.64);
  const mirrorZ = vehicle.lengthMeters * (profile.isTruck ? 0.18 : 0.08);
  const mirrorX = vehicle.widthMeters * (profile.isBus ? 0.52 : 0.56);

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

    if (!profile.isBus && !profile.isTruck) {
      for (const z of [-0.18, 0.18] as const) {
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

  if (profile.hasBullBar) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          "chrome-trim",
          [side * vehicle.widthMeters * 0.22, vehicle.heightMeters * 0.24, vehicle.lengthMeters * 0.52],
          [vehicle.widthMeters * 0.03, vehicle.heightMeters * 0.18, vehicle.lengthMeters * 0.02],
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

  const side = getDamageSide(vehicle);
  const z = getDamageLocalZ(vehicle);
  const dentWidth = vehicle.widthMeters * clamp(0.026 + damage * 0.018, 0.026, 0.052);
  const dentHeight = vehicle.heightMeters * clamp(0.16 + damage * 0.28, 0.16, 0.5);
  const dentLength = vehicle.lengthMeters * clamp(0.18 + damage * 0.26, 0.18, 0.46);
  const cavityWidth = vehicle.widthMeters * clamp(0.05 + damage * 0.05, 0.05, 0.1);
  const cavityHeight = vehicle.heightMeters * clamp(0.12 + damage * 0.14, 0.12, 0.26);
  const cavityLength = vehicle.lengthMeters * clamp(0.12 + damage * 0.18, 0.12, 0.28);
  const creaseWidth = vehicle.widthMeters * clamp(0.012 + damage * 0.012, 0.012, 0.026);
  const sameEndZ = z >= 0 ? vehicle.lengthMeters * 0.5 : -vehicle.lengthMeters * 0.5;

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "damage-panel",
      [
        side * vehicle.widthMeters * 0.522,
        vehicle.heightMeters * (0.34 + damage * 0.14),
        z,
      ],
      [dentWidth, dentHeight, dentLength],
      [0, 0, side * damage * 0.22],
      9,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "rubber",
      [
        side * vehicle.widthMeters * 0.492,
        vehicle.heightMeters * (0.34 + damage * 0.08),
        z,
      ],
      [cavityWidth, cavityHeight, cavityLength],
      [0, side * damage * 0.08, side * damage * 0.04],
      8,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "damage-panel",
      [
        side * vehicle.widthMeters * 0.532,
        vehicle.heightMeters * (0.27 + damage * 0.06),
        z - vehicle.lengthMeters * 0.11,
      ],
      [
        dentWidth * 0.78,
        vehicle.heightMeters * clamp(0.045 + damage * 0.05, 0.045, 0.105),
        dentLength * 0.82,
      ],
      [0, 0, -side * damage * 0.1],
      10,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "chrome-trim",
      [
        side * vehicle.widthMeters * 0.506,
        vehicle.heightMeters * (0.36 + damage * 0.08),
        z + vehicle.lengthMeters * 0.04,
      ],
      [creaseWidth, vehicle.heightMeters * 0.24, dentLength * 0.76],
      [0, side * damage * 0.1, side * damage * 0.16],
      10,
    ),
  );

  if (damage >= 0.28) {
    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "damage-panel",
        [
          side * vehicle.widthMeters * 0.44,
          vehicle.heightMeters * (0.54 + damage * 0.06),
          z,
        ],
        [vehicle.widthMeters * 0.028, vehicle.heightMeters * 0.18, dentLength * 0.58],
        [0, side * damage * 0.08, side * damage * 0.18],
        10,
      ),
    );
  }

  if (damage >= 0.42) {
    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "damage-panel",
        [
          side * vehicle.widthMeters * 0.22,
          vehicle.heightMeters * 0.22,
          sameEndZ * 1.02,
        ],
        [
          vehicle.widthMeters * clamp(0.26 + damage * 0.22, 0.26, 0.48),
          vehicle.heightMeters * 0.085,
          vehicle.lengthMeters * 0.038,
        ],
        [0, side * damage * 0.08, side * damage * 0.12],
        10,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "rubber",
        [
          side * vehicle.widthMeters * 0.16,
          vehicle.heightMeters * 0.18,
          sameEndZ * 0.98,
        ],
        [vehicle.widthMeters * 0.16, vehicle.heightMeters * 0.05, vehicle.lengthMeters * 0.024],
        [0, side * damage * 0.1, side * damage * 0.06],
        9,
      ),
    );
  }
}

function pushTwoWheelerParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const wheelRadius = vehicle.heightMeters * (profile.isBicycle ? 0.22 : 0.2);
  const wheelWidth = vehicle.widthMeters * (profile.isBicycle ? 0.045 : 0.09);
  const frontZ = vehicle.lengthMeters * 0.34;
  const rearZ = -vehicle.lengthMeters * 0.32;
  const wheelY = wheelRadius + 0.02;

  const paintMaterialKey = getPaintMaterialKey(vehicle, 311);
  const accentMaterialKey = profile.isBicycle
    ? "chrome-trim"
    : getPaintMaterialKey(vehicle, 313, "dark");

  for (const z of [rearZ, frontZ] as const) {
    parts.push(
      createPart(
        vehicle,
        "wheel",
        "wheel",
        "rubber",
        [0, wheelY, z],
        [wheelRadius, wheelWidth, wheelRadius],
        [Math.PI / 2, 0, 0],
        3,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "cylinder",
        "wheel-hub",
        [0, wheelY, z],
        [wheelRadius * 0.42, wheelWidth * 0.7, wheelRadius * 0.42],
        [Math.PI / 2, 0, 0],
        4,
      ),
    );
  }

  parts.push(
    createPart(
      vehicle,
      "body",
      "box",
      accentMaterialKey,
      [0, vehicle.heightMeters * 0.28, 0],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.14, vehicle.lengthMeters * 0.44],
      [0, 0, 0],
      1,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "chrome-trim",
      "box",
      accentMaterialKey,
      [0, vehicle.heightMeters * 0.46, vehicle.lengthMeters * 0.02],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.18, vehicle.lengthMeters * 0.12],
      [profile.isBicycle ? 0.46 : 0.22, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "handle",
      "box",
      "chrome-trim",
      [0, vehicle.heightMeters * 0.56, frontZ - vehicle.lengthMeters * 0.06],
      [vehicle.widthMeters * (profile.isBicycle ? 0.56 : 0.44), vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.035],
      [0, 0, 0],
      5,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "cabin",
      "box",
      paintMaterialKey,
      [0, vehicle.heightMeters * (profile.isBicycle ? 0.38 : 0.44), vehicle.lengthMeters * 0.02],
      [vehicle.widthMeters * (profile.isBicycle ? 0.14 : 0.28), vehicle.heightMeters * (profile.isBicycle ? 0.1 : 0.15), vehicle.lengthMeters * (profile.isBicycle ? 0.16 : 0.18)],
      [0, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "headlight",
      "box",
      profile.isBicycle ? "chrome-trim" : "headlight",
      [0, vehicle.heightMeters * 0.44, frontZ + vehicle.lengthMeters * 0.025],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.08, vehicle.lengthMeters * 0.03],
      [0, 0, 0],
      6,
    ),
  );

  if (profile.isMotorcycle) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        getPaintMaterialKey(vehicle, 317, "matte"),
        [0, vehicle.heightMeters * 0.32, rearZ + vehicle.lengthMeters * 0.12],
        [vehicle.widthMeters * 0.22, vehicle.heightMeters * 0.12, vehicle.lengthMeters * 0.22],
        [0, 0, 0],
        2,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        "chrome-trim",
        [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.22, rearZ + vehicle.lengthMeters * 0.02],
        [vehicle.widthMeters * 0.06, vehicle.heightMeters * 0.05, vehicle.lengthMeters * 0.22],
        [0, 0, 0],
        4,
      ),
    );
  }

  if (profile.isBicycle) {
    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        accentMaterialKey,
        [0, vehicle.heightMeters * 0.42, rearZ * 0.18],
        [vehicle.widthMeters * 0.08, vehicle.heightMeters * 0.16, vehicle.lengthMeters * 0.38],
        [0.84, 0, 0],
        2,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        accentMaterialKey,
        [0, vehicle.heightMeters * 0.32, frontZ * 0.14],
        [vehicle.widthMeters * 0.08, vehicle.heightMeters * 0.16, vehicle.lengthMeters * 0.34],
        [-0.62, 0, 0],
        2,
      ),
    );
  }
}

function pushFourWheelerBodyParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const descriptor = getHomeDriveVehicleModelDescriptor(vehicle.modelKey);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightRatio;
  const bodyY = bodyHeight * 0.5 + 0.08;
  const lowerBodyPaint = getPaintMaterialKey(vehicle, 101);
  const upperBodyPaint = getPaintMaterialKey(vehicle, 103, profile.isTruck || profile.isBus ? "matte" : "dark");
  const cargoPaint = getPaintMaterialKey(vehicle, 107, "matte");

  const hoodLength = clamp(vehicle.lengthMeters * profile.hoodLengthRatio, 0.45, vehicle.lengthMeters * 0.34);
  const trunkLength = clamp(
    profile.isPickup ? vehicle.lengthMeters * profile.pickupBedLengthRatio : vehicle.lengthMeters * profile.trunkLengthRatio,
    profile.isPickup ? vehicle.lengthMeters * 0.18 : 0.34,
    vehicle.lengthMeters * (profile.isBus || profile.isTruck ? 0.14 : 0.28),
  );
  const lowerBodyLength = clamp(
    vehicle.lengthMeters * profile.lowerBodyLengthRatio,
    vehicle.lengthMeters * 0.58,
    vehicle.lengthMeters * 0.92,
  );

  const lowerBodyWidth = vehicle.widthMeters * (profile.isBus ? 0.98 : profile.isTruck ? 0.94 : 0.96);

  parts.push(
    createPart(
      vehicle,
      "body",
      "box",
      lowerBodyPaint,
      [0, bodyY, 0],
      [lowerBodyWidth, bodyHeight, lowerBodyLength],
      [0, 0, 0],
      1,
    ),
  );

  if (!profile.isBus && !profile.isTruck) {
    parts.push(
      createPart(
        vehicle,
        "body",
        "box",
        lowerBodyPaint,
        [0, bodyY + bodyHeight * 0.13, vehicle.lengthMeters * (0.5 - profile.hoodLengthRatio * 0.5)],
        [vehicle.widthMeters * 0.88, bodyHeight * profile.hoodHeightRatio, hoodLength],
        [0, 0, 0],
        1,
      ),
    );
  }

  if (profile.isPickup) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        cargoPaint,
        [0, bodyY + bodyHeight * 0.16, -vehicle.lengthMeters * 0.15],
        [vehicle.widthMeters * 0.84, vehicle.heightMeters * 0.28, vehicle.lengthMeters * profile.pickupBedLengthRatio],
        [0, 0, 0],
        2,
      ),
    );
  } else if (!profile.isBus) {
    parts.push(
      createPart(
        vehicle,
        "body",
        "box",
        lowerBodyPaint,
        [0, bodyY + bodyHeight * 0.12, -vehicle.lengthMeters * (0.5 - profile.trunkLengthRatio * 0.52)],
        [vehicle.widthMeters * (profile.isWagon ? 0.88 : 0.82), bodyHeight * profile.trunkHeightRatio, trunkLength],
        [0, 0, 0],
        1,
      ),
    );
  }

  parts.push(
    createPart(
      vehicle,
      "cabin",
      "box",
      upperBodyPaint,
      [0, bodyY + bodyHeight * 0.58, vehicle.lengthMeters * profile.cabinZRatio],
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
      [0, bodyY + bodyHeight * 0.82, vehicle.lengthMeters * (profile.cabinZRatio + 0.01)],
      [
        vehicle.widthMeters * (profile.cabinWidthRatio * 0.9),
        vehicle.heightMeters * profile.glassHeightRatio,
        vehicle.lengthMeters * (profile.cabinLengthRatio * 0.82),
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
      profile.isPolice ? "chrome-trim" : "bumper",
      [0, vehicle.heightMeters * (profile.isBus ? 0.2 : 0.22), vehicle.lengthMeters * 0.525],
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

  if (profile.hasCargoBox && !profile.isPickup) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        cargoPaint,
        [0, bodyY + bodyHeight * 0.44, -vehicle.lengthMeters * 0.1],
        [
          vehicle.widthMeters * (profile.isTruck ? 0.92 : 0.82),
          vehicle.heightMeters * (profile.isTruck ? 0.62 : 0.58),
          vehicle.lengthMeters * (profile.isTruck ? 0.54 : 0.48),
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

  if (profile.hasRoofRack && !profile.isBus && !profile.isTruck) {
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

  if (profile.isEmergency) {
    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        "tail-light",
        [0, vehicle.heightMeters * 0.96, 0],
        [vehicle.widthMeters * 0.58, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.1],
        [0, 0, 0],
        9,
      ),
    );
  }

  if (profile.isPolice) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          side < 0 ? "headlight" : "tail-light",
          [side * vehicle.widthMeters * 0.1, vehicle.heightMeters * 0.98, 0],
          [vehicle.widthMeters * 0.18, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.08],
          [0, 0, 0],
          9,
        ),
      );
    }
  }

  pushWheelParts(parts, vehicle, profile);
  pushLightsAndPlates(parts, vehicle, profile);
  pushMirrorsHandlesAndTrim(parts, vehicle, profile);
}

export function getHomeDriveThreeParkedVehicleDetailParts(
  vehicle: HomeDriveParkedVehicle,
): readonly HomeDriveThreeParkedVehicleDetailPart[] {
  const profile = getDetailProfile(vehicle);
  const parts: HomeDriveThreeParkedVehicleDetailPart[] = [];

  if (profile.isTwoWheeler) {
    pushTwoWheelerParts(parts, vehicle, profile);
    pushDamageParts(parts, vehicle);
    return parts.map((part) => applyDamageToPart(vehicle, part));
  }

  pushFourWheelerBodyParts(parts, vehicle, profile);
  pushDamageParts(parts, vehicle);

  return parts.map((part) => applyDamageToPart(vehicle, part));
}


