// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.helpers.ts
// Constantes e helpers de posicionamento.

import { hashVector } from "../homeDrive.math";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleMode,
  HomeDriveParkedVehicleSide,
} from "./homeDrive.parkedVehicles.types";

export const DEFAULT_MAX_PARKED_VEHICLES = 180;
export const DEFAULT_PARKED_VEHICLE_DENSITY = 1;
export const DEFAULT_MIN_ROAD_LENGTH_METERS = 74;
export const DEFAULT_PARKED_VEHICLE_SEED = 6617;

const PARKED_ENDPOINT_PADDING_RATIO = 0.08;
const PARKED_SLOT_JITTER_RATIO = 0.42;
export const MIN_ROAD_LENGTH_METERS = 0.000001;

export type ParkedVehicleCandidate = Readonly<{
  vehicle: HomeDriveParkedVehicle;
  priority: number;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

export function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 37;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 43 + road.id.charCodeAt(index)) % 104729;
  }

  return hash + road.segmentIndex * 193;
}

export function getRoadParkingChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("safe-endcap") || tags.includes("no-parking")) {
    return 0;
  }

  if (road.surface === "water") {
    return 0;
  }

  if (road.kind === "commercial") {
    return 0.86;
  }

  if (road.kind === "street") {
    return 0.78;
  }

  if (road.kind === "avenue") {
    return 0.52;
  }

  if (road.kind === "coastal") {
    return 0.38;
  }

  if (road.kind === "service") {
    return 0.58;
  }

  if (road.kind === "ring") {
    return 0.18;
  }

  return 0.44;
}

export function getParkingSlotSpacingMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  switch (road.kind) {
    case "commercial":
      return 38;

    case "street":
      return 42;

    case "avenue":
      return 58;

    case "coastal":
      return 72;

    case "service":
      return 50;

    case "ring":
      return 92;

    default:
      return 62;
  }
}

function getRoadSidewalkWidthMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  switch (road.kind) {
    case "coastal":
      return 7.4;

    case "avenue":
      return 5;

    case "commercial":
      return 4.6;

    case "ring":
      return 4.2;

    case "service":
      return 2.4;

    case "street":
      return 3;

    default:
      if (road.roadTone === "boulevard") {
        return 6.2;
      }

      if (road.roadTone === "urban-core") {
        return 4.1;
      }

      return 3.7;
  }
}

function getRoadCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

export function getPointOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
): HomeDriveVector2 {
  return {
    x: road.from.x + (road.to.x - road.from.x) * t,
    z: road.from.z + (road.to.z - road.from.z) * t,
  };
}

export function getPaddedSlotT(
  roadSeed: number,
  slotIndex: number,
  slotCount: number,
  side: HomeDriveParkedVehicleSide,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const sideSalt = side === 1 ? 0 : 9_000;
  const jitter =
    (hashVector(roadSeed, slotIndex, 701 + sideSalt) - 0.5) *
    slotWidth *
    PARKED_SLOT_JITTER_RATIO;

  return (
    PARKED_ENDPOINT_PADDING_RATIO +
    clamp01(rawT + jitter) * (1 - PARKED_ENDPOINT_PADDING_RATIO * 2)
  );
}

export function getHeadingYForRoad(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: 1 | -1,
): number {
  const sign = directionSign >= 0 ? 1 : -1;

  return Math.atan2(road.direction.x * sign, road.direction.z * sign);
}

export function getParkedVehicleMode(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveParkedVehicleMode {
  const commercialBoost = road.kind === "commercial" ? 0.08 : 0;
  const serviceBoost = road.kind === "service" ? 0.06 : 0;
  const avenuePenalty = road.kind === "avenue" || road.kind === "ring" ? 0.08 : 0;
  const coastalPenalty = road.kind === "coastal" ? 0.06 : 0;

  const halfSidewalkLimit = 0.72 + commercialBoost;
  const invasiveLimit = halfSidewalkLimit + 0.17 - avenuePenalty - coastalPenalty;
  const deliveryLimit = invasiveLimit + 0.06 + commercialBoost + serviceBoost;
  const drivewayLimit = deliveryLimit + 0.025;

  if (seed < halfSidewalkLimit) {
    return "curb-parallel";
  }

  if (seed < invasiveLimit) {
    return "half-sidewalk";
  }

  if (seed < deliveryLimit) {
    return "sidewalk-invasive";
  }

  if (seed < drivewayLimit) {
    return "delivery-stop";
  }

  return "driveway-front";
}

export function getParkedVehicleOffsetFromRoadCenter(
  road: HomeDriveGeneratedRoadSegment,
  mode: HomeDriveParkedVehicleMode,
  vehicleWidthMeters: number,
): number {
  const roadHalfWidth = road.width / 2;
  const curbWidth = getRoadCurbWidthMeters(road);
  const sidewalkWidth = getRoadSidewalkWidthMeters(road);

  switch (mode) {
    case "curb-parallel":
      return roadHalfWidth - vehicleWidthMeters * 0.48 - 0.18;

    case "half-sidewalk":
      return roadHalfWidth + curbWidth + vehicleWidthMeters * 0.08;

    case "sidewalk-invasive":
      return roadHalfWidth + curbWidth + vehicleWidthMeters * 0.42;

    case "delivery-stop":
      return roadHalfWidth - vehicleWidthMeters * 0.5 - 0.08;

    case "driveway-front":
    default:
      return (
        roadHalfWidth +
        curbWidth +
        sidewalkWidth * 0.76 +
        vehicleWidthMeters * 0.18
      );
  }
}

export function getParkedVehicleYawNoise(seed: number): number {
  return (seed - 0.5) * 0.12;
}

export function shouldParkOnRoadSide(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveParkedVehicleSide,
  seed: number,
): boolean {
  if (road.kind === "ring") {
    return side === 1 && seed > 0.35;
  }

  if (road.kind === "avenue") {
    return seed > 0.24;
  }

  return seed > 0.08;
}

export function getParkedVehicleCollisionRadiusMeters(params: {
  widthMeters: number;
  lengthMeters: number;
}): number {
  return clamp(
    Math.hypot(params.widthMeters * 0.46, params.lengthMeters * 0.28),
    1.25,
    3.65,
  );
}

export function getParkedVehicleMassKg(params: {
  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
}): number {
  const footprint = Math.max(1, params.widthMeters * params.lengthMeters);
  const heightFactor = clamp(params.heightMeters / 1.7, 0.78, 1.45);

  return clamp(780 + footprint * 58 * heightFactor, 860, 2450);
}
