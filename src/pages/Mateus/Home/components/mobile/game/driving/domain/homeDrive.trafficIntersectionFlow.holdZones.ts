// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficIntersectionFlow.holdZones.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import { getHomeDriveRoadEndpointCutKey } from "./homeDrive.roadTopology";
import type { HomeDriveRoadEndpointSide } from "./homeDrive.roadTopology";
import type {
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVector2,
} from "./homeDrive.traffic.types";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

type HoldZoneKind = "endpoint" | "crosswalk";

type HoldZoneRef = Readonly<{
  key: string;
  kind: HoldZoneKind;
  targetT: number;
  exitEndpointSide: HomeDriveRoadEndpointSide | null;
}>;

export type HoldZoneItem = Readonly<{
  index: number;
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  zone: HoldZoneRef;
  distanceToPlayerMeters: number;
  forwardProgress: number;
}>;

const HOLD_ZONE_SPEED_MPS = 2.15;
export const HARD_STOP_SPEED_MPS = 0.72;
const ENDPOINT_HOLD_DISTANCE_METERS = 36;
const CROSSWALK_HOLD_BEHIND_METERS = 44;
const CROSSWALK_HOLD_AHEAD_METERS = 8;
export const HOLD_CLUSTER_MIN_SIZE = 5;
export const HOLD_CLUSTER_MIN_STOPPED = 3;
export const KEEP_NEAR_PLAYER_METERS = 52;
export const MAX_DEFAULT_REPAIRS_PER_TICK = 18;
export const RELEASE_CLEARANCE_METERS = 34;
export const RELEASE_STAGGER_METERS = 16;
export const RELEASE_MIN_SPEED_MPS = 5.6;
export const RELEASE_LANE_CHANGE_COOLDOWN_SECONDS = 0.28;
export const RELEASE_JUNCTION_COOLDOWN_SECONDS = 0.42;
export const RECENT_DAMAGE_PROTECTION_SECONDS = 2.4;
export const MIN_ROAD_LENGTH_METERS = 0.000001;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function getNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function getDistanceMeters(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

export function getZeroTrafficVector(): HomeDriveTrafficVector2 {
  return { x: 0, z: 0 };
}

export function getForwardProgress(vehicle: HomeDriveTrafficVehicle): number {
  const t = clamp01(getNumber(vehicle.t, 0.5));

  return vehicle.directionSign === 1 ? t : 1 - t;
}

function getExitEndpointSide(
  vehicle: HomeDriveTrafficVehicle,
): HomeDriveRoadEndpointSide {
  return vehicle.directionSign === 1 ? "to" : "from";
}

function getDistanceToExitEndpointMeters(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const progress = getForwardProgress(vehicle);

  return Math.max(0, (1 - progress) * Math.max(MIN_ROAD_LENGTH_METERS, road.length));
}

function getEndpointHoldZone(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): HoldZoneRef | null {
  const distanceMeters = getDistanceToExitEndpointMeters(vehicle, road);

  if (distanceMeters > ENDPOINT_HOLD_DISTANCE_METERS) {
    return null;
  }

  const side = getExitEndpointSide(vehicle);
  const key = `endpoint:${getHomeDriveRoadEndpointCutKey(road, side)}`;

  return {
    key,
    kind: "endpoint",
    targetT: side === "to" ? 1 : 0,
    exitEndpointSide: side,
  };
}

function getCrosswalkHoldZone(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): HoldZoneRef | null {
  if (!crosswalks) {
    return null;
  }

  let best: HoldZoneRef | null = null;
  let bestAbsDistanceMeters = Number.POSITIVE_INFINITY;

  for (const crosswalk of crosswalks.crosswalks) {
    if (crosswalk.segmentId !== vehicle.segmentId) {
      continue;
    }

    if (!crosswalk.hasYieldControl && crosswalk.signalPhase === "off") {
      continue;
    }

    const signedDistanceMeters =
      (crosswalk.t - vehicle.t) * vehicle.directionSign *
      Math.max(MIN_ROAD_LENGTH_METERS, road.length);

    if (
      signedDistanceMeters < -CROSSWALK_HOLD_AHEAD_METERS ||
      signedDistanceMeters > CROSSWALK_HOLD_BEHIND_METERS
    ) {
      continue;
    }

    const absDistanceMeters = Math.abs(signedDistanceMeters);

    if (absDistanceMeters < bestAbsDistanceMeters) {
      bestAbsDistanceMeters = absDistanceMeters;
      best = {
        key: `crosswalk:${crosswalk.id}`,
        kind: "crosswalk",
        targetT: crosswalk.t,
        exitEndpointSide: null,
      };
    }
  }

  return best;
}

export function getHoldZoneForVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): HoldZoneRef | null {
  const crosswalkZone = getCrosswalkHoldZone(vehicle, road, crosswalks);

  if (crosswalkZone) {
    return crosswalkZone;
  }

  return getEndpointHoldZone(vehicle, road);
}

export function isVehiclePotentiallyBlocked(vehicle: HomeDriveTrafficVehicle): boolean {
  return (
    vehicle.speedMps <= HOLD_ZONE_SPEED_MPS ||
    Boolean(vehicle.yieldingToCrosswalkId) ||
    Boolean(vehicle.followingVehicleId) ||
    vehicle.brakeLightIntensity > 0.55
  );
}
