// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficCongestion.ts

import {
  getHomeDriveTrafficSpatialRelation,
  type HomeDriveTrafficPerformanceProfile,
} from "./homeDrive.trafficPerformance";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

export type HomeDriveTrafficLaneOccupancyKey = string;

export type HomeDriveTrafficLaneOccupancyItem = Readonly<{
  index: number;
  vehicle: HomeDriveTrafficVehicle;
  progress: number;
}>;

export type HomeDriveTrafficCongestionSnapshot = Readonly<{
  congestedLaneCount: number;
  crampedPairCount: number;
  stoppedVehicleCount: number;
  worstGapMeters: number;
}>;

const MIN_CENTER_GAP_METERS = 9.8;
const MAX_CENTER_GAP_METERS = 30;
const BUMPER_COMFORT_GAP_METERS = 4.6;
const SPEED_GAP_GAIN_SECONDS = 0.46;
const FROZEN_SPEED_MPS = 0.42;
const PLAYER_PROTECTED_RADIUS_METERS = 42;
const RECENT_DAMAGE_PROTECTION_SECONDS = 3.2;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function getHomeDriveTrafficForwardProgress(
  vehicle: HomeDriveTrafficVehicle,
): number {
  const t = clamp(getNumber(vehicle.t, 0.5), 0, 1);

  return vehicle.directionSign === 1 ? t : 1 - t;
}

export function getHomeDriveTrafficLaneOccupancyKey(
  vehicle: Pick<
    HomeDriveTrafficVehicle,
    "segmentId" | "directionSign" | "laneIndex" | "targetLaneIndex" | "laneChangeDirection"
  >,
): HomeDriveTrafficLaneOccupancyKey {
  const effectiveLaneIndex =
    vehicle.laneChangeDirection !== 0 && Number.isFinite(vehicle.targetLaneIndex)
      ? vehicle.targetLaneIndex
      : vehicle.laneIndex;

  return `${vehicle.segmentId}:${vehicle.directionSign}:${Math.trunc(effectiveLaneIndex)}`;
}

export function getHomeDriveTrafficDesiredCenterGapMeters(
  follower: HomeDriveTrafficVehicle,
  leader: HomeDriveTrafficVehicle,
): number {
  const vehicleLengthMeters =
    getNumber(follower.lengthMeters, 4.2) * 0.5 +
    getNumber(leader.lengthMeters, 4.2) * 0.5;
  const speedMps = Math.max(
    0,
    getNumber(follower.speedMps, follower.cruiseSpeedMps),
    getNumber(leader.speedMps, leader.cruiseSpeedMps) * 0.45,
  );

  return clamp(
    vehicleLengthMeters + BUMPER_COMFORT_GAP_METERS + speedMps * SPEED_GAP_GAIN_SECONDS,
    MIN_CENTER_GAP_METERS,
    MAX_CENTER_GAP_METERS,
  );
}

export function isHomeDriveTrafficVehicleProtectedFromRecycle(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  if (elapsedSeconds - vehicle.lastCollisionAt <= RECENT_DAMAGE_PROTECTION_SECONDS) {
    return true;
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );

  return (
    relation.distanceMeters <=
    Math.max(PLAYER_PROTECTED_RADIUS_METERS, profile.forcedCollisionRadiusMeters)
  );
}

export function shouldHomeDriveTrafficVehicleReceiveStuckRescue(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  if (elapsedSeconds - vehicle.lastCollisionAt <= profile.damagedGraceSeconds) {
    return false;
  }

  if (vehicle.yieldingToCrosswalkId && vehicle.yieldTimerSeconds <= 3.8) {
    return false;
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );

  if (relation.distanceMeters <= profile.forcedCollisionRadiusMeters) {
    return false;
  }

  return (
    vehicle.speedMps <= FROZEN_SPEED_MPS &&
    vehicle.cruiseSpeedMps > profile.stuckRescueMinSpeedMps &&
    relation.distanceMeters >= profile.stuckRescueDistanceMeters
  );
}

export function createHomeDriveTrafficCongestionSnapshot(
  vehicles: readonly HomeDriveTrafficVehicle[],
  roadsBySegmentId: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>,
): HomeDriveTrafficCongestionSnapshot {
  const buckets = new Map<HomeDriveTrafficLaneOccupancyKey, HomeDriveTrafficLaneOccupancyItem[]>();
  let stoppedVehicleCount = 0;

  vehicles.forEach((vehicle, index) => {
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= 0.000001) {
      return;
    }

    if (vehicle.speedMps <= FROZEN_SPEED_MPS) {
      stoppedVehicleCount += 1;
    }

    const key = getHomeDriveTrafficLaneOccupancyKey(vehicle);
    const item: HomeDriveTrafficLaneOccupancyItem = {
      index,
      vehicle,
      progress: getHomeDriveTrafficForwardProgress(vehicle),
    };
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  });

  let congestedLaneCount = 0;
  let crampedPairCount = 0;
  let worstGapMeters = Number.POSITIVE_INFINITY;

  for (const bucket of buckets.values()) {
    if (bucket.length <= 1) {
      continue;
    }

    bucket.sort((first, second) => first.progress - second.progress);
    let laneHasCongestion = false;

    for (let index = 0; index < bucket.length - 1; index += 1) {
      const follower = bucket[index];
      const leader = bucket[index + 1];
      const road = roadsBySegmentId.get(follower.vehicle.segmentId);

      if (!road || road.length <= 0.000001) {
        continue;
      }

      const gapMeters = Math.max(0, (leader.progress - follower.progress) * road.length);
      const desiredGapMeters = getHomeDriveTrafficDesiredCenterGapMeters(
        follower.vehicle,
        leader.vehicle,
      );

      worstGapMeters = Math.min(worstGapMeters, gapMeters);

      if (gapMeters < desiredGapMeters * 0.72) {
        crampedPairCount += 1;
        laneHasCongestion = true;
      }
    }

    if (laneHasCongestion) {
      congestedLaneCount += 1;
    }
  }

  return {
    congestedLaneCount,
    crampedPairCount,
    stoppedVehicleCount,
    worstGapMeters: Number.isFinite(worstGapMeters) ? worstGapMeters : 0,
  };
}
