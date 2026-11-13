// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.vehicleSpeed.ts

import { hashVector } from "./homeDrive.math";
import { getHomeDriveTrafficPositionOnRoad } from "./homeDrive.trafficRouter";
import {
  getHomeDriveTrafficSeededDirectionSign,
  getHomeDriveTrafficSeededLaneIndex,
} from "./homeDrive.trafficLanes";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleKind,
} from "./homeDrive.traffic.types";
import {
  TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER,
  TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
  MIN_TRAFFIC_CRUISE_SPEED_MPS,
  MAX_TRAFFIC_CRUISE_SPEED_MPS,
  DEFAULT_TRAFFIC_SPEED_RECOVERY_MPS2,
} from "./homeDrive.traffic.constants";
import {
  clamp,
  getRoadSpeedLimitKmh,
  smoothstep01,
  lerp,
} from "./homeDrive.traffic.roads";
import { getTrafficSpeedProfile } from "./homeDrive.traffic.vehicleProfile";

function getVehicleSpeedMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "bicycle":
      return 0.42;

    case "motorcycle":
      return 1.18;

    case "truck":
      return 0.66;

    case "microbus":
      return 0.74;

    case "bus":
      return 0.82;

    case "delivery":
      return 0.82;

    case "van":
      return 0.92;

    case "suv":
      return 0.96;

    case "pickup":
      return 1;

    case "wagon":
      return 1.04;

    case "sedan":
      return 1.06;

    case "taxi":
      return 1.08;

    case "hatch":
      return 1.12;

    case "police":
      return 1.16;

    case "sport":
      return 1.22;

    case "compact":
    default:
      return 1.1;
  }
}

function getVehicleAccelerationMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "bicycle":
      return 0.42;

    case "motorcycle":
      return 1.28;

    case "truck":
      return 0.52;

    case "microbus":
      return 0.64;

    case "bus":
      return 0.68;

    case "delivery":
      return 0.78;

    case "van":
      return 0.82;

    case "pickup":
      return 0.92;

    case "suv":
      return 0.92;

    case "wagon":
      return 1.02;

    case "sedan":
      return 1.08;

    case "taxi":
      return 1.08;

    case "hatch":
      return 1.12;

    case "police":
      return 1.18;

    case "sport":
      return 1.32;

    case "compact":
    default:
      return 1.18;
  }
}

export function getPositionOnTrafficRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
  laneOffsetMeters: number,
): HomeDriveVector2 {
  const position = getHomeDriveTrafficPositionOnRoad(
    road,
    t,
    laneOffsetMeters,
  );

  return toHomeDriveVector2(position);
}

function toHomeDriveVector2(position: HomeDriveWorldPosition): HomeDriveVector2 {
  return {
    x: position.x,
    z: position.z,
  };
}

export function getVehicleCollisionRadiusMeters(
  widthMeters: number,
  lengthMeters: number,
  kind: HomeDriveTrafficVehicleKind,
): number {
  const gameplayRadius =
    Math.hypot(widthMeters * 0.46, lengthMeters * 0.24) *
    TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER;

  if (kind === "bicycle") {
    return clamp(gameplayRadius, 0.46, 0.92);
  }

  if (kind === "motorcycle") {
    return clamp(gameplayRadius, 0.64, 1.18);
  }

  const minRadius = 1.08 * Math.min(TRAFFIC_VEHICLE_SIZE_MULTIPLIER, 1.35);
  const maxRadius = kind === "bus" || kind === "truck" ? 4.85 : 3.15 * TRAFFIC_VEHICLE_SIZE_MULTIPLIER;

  return clamp(gameplayRadius, minRadius, maxRadius);
}

export function getTrafficVehicleCruiseSpeedMps(
  road: HomeDriveGeneratedRoadSegment,
  kind: HomeDriveTrafficVehicleKind,
  speedSeed: number,
  jitterSeed: number,
): number {
  const profile = getTrafficSpeedProfile(road);
  const speedLimitMps = getRoadSpeedLimitKmh(road) / 3.6;

  const shapedSeed = speedSeed * 0.58 + smoothstep01(jitterSeed) * 0.42;
  const speedFactor = lerp(profile.minFactor, profile.maxFactor, shapedSeed);

  const jitter = (jitterSeed - 0.5) * profile.jitterMps;
  const kindMultiplier = getVehicleSpeedMultiplier(kind);

  const rawSpeedMps = speedLimitMps * speedFactor * kindMultiplier + jitter;

  return clamp(
    rawSpeedMps,
    Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, profile.minMps),
    Math.min(MAX_TRAFFIC_CRUISE_SPEED_MPS, profile.maxMps),
  );
}

export function getTrafficVehicleRecoveryMps2(
  road: HomeDriveGeneratedRoadSegment,
  kind: HomeDriveTrafficVehicleKind,
  seed: number,
): number {
  const profile = getTrafficSpeedProfile(road);
  const kindMultiplier = getVehicleAccelerationMultiplier(kind);

  return Math.max(
    1.8,
    lerp(profile.accelerationMinMps2, profile.accelerationMaxMps2, seed) *
      kindMultiplier,
  );
}

export function getInitialRuntimeSpeedMps(
  cruiseSpeedMps: number,
  seed: number,
): number {
  const startFactor = lerp(0.72, 0.94, smoothstep01(seed));

  return Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, cruiseSpeedMps * startFactor);
}

export function getTrafficVehicleRouteSeed(
  roadSeed: number,
  slotIndex: number,
): number {
  return Math.floor(hashVector(roadSeed, slotIndex, 563) * 1_000_000);
}

export function getInitialDirectionSign(
  road: HomeDriveGeneratedRoadSegment,
  roadSeed: number,
  slotIndex: number,
): HomeDriveTrafficDirectionSign {
  return getHomeDriveTrafficSeededDirectionSign(
    road,
    hashVector(roadSeed, slotIndex, 503),
  );
}

export function getInitialLaneIndex(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  roadSeed: number,
  slotIndex: number,
): number {
  return getHomeDriveTrafficSeededLaneIndex(
    road,
    directionSign,
    hashVector(roadSeed, slotIndex, 401),
  );
}

export function getCruiseSpeedForVehicleOnRoad(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const speedSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 733);
  const jitterSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 739);

  return getTrafficVehicleCruiseSpeedMps(
    road,
    vehicle.kind,
    speedSeed,
    jitterSeed,
  );
}

export function getRecoveryForVehicleOnRoad(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const accelerationSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 751);

  return getTrafficVehicleRecoveryMps2(road, vehicle.kind, accelerationSeed);
}

export function getSafeVehicleCruiseSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  if (Number.isFinite(vehicle.cruiseSpeedMps) && vehicle.cruiseSpeedMps > 0) {
    const profile = getTrafficSpeedProfile(road);

    return clamp(
      vehicle.cruiseSpeedMps,
      Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, profile.minMps),
      Math.min(MAX_TRAFFIC_CRUISE_SPEED_MPS, profile.maxMps),
    );
  }

  return getCruiseSpeedForVehicleOnRoad(vehicle, road);
}

export function getSafeVehicleSpeedRecoveryMps2(
  vehicle: HomeDriveTrafficVehicle,
): number {
  if (
    Number.isFinite(vehicle.speedRecoveryMps2) &&
    vehicle.speedRecoveryMps2 > 0
  ) {
    return vehicle.speedRecoveryMps2;
  }

  return DEFAULT_TRAFFIC_SPEED_RECOVERY_MPS2;
}
