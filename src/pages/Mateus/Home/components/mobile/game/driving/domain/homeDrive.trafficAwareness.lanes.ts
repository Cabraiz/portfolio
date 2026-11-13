// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficAwareness.lanes.ts
// Constantes, tipos e leitura das faixas.

import type {
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

const MIN_CENTER_GAP_METERS = 7.2;
const MIN_BUMPER_GAP_METERS = 2.4;
const MAX_FOLLOW_GAP_METERS = 42;
export const FOLLOW_LOOKAHEAD_METERS = 74;
export const OVERTAKE_LOOKAHEAD_METERS = 62;
export const LANE_CHANGE_FRONT_CLEARANCE_METERS = 26;
export const LANE_CHANGE_REAR_CLEARANCE_METERS = 18;
export const LANE_CHANGE_COOLDOWN_BLOCK_SECONDS = 0.05;
export const LANE_CHANGE_MIN_SPEED_ADVANTAGE_MPS = 1.65;
export const STABILIZATION_EXTRA_BUMPER_GAP_METERS = 1.6;
export const STABILIZATION_START_MARGIN = 0.018;
export const STABILIZATION_END_MARGIN = 0.982;

type RoadMap = ReadonlyMap<string, HomeDriveGeneratedRoadSegment>;

export type LaneVehicle = Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  progress: number;
}>;

export type LaneLeader = Readonly<{
  item: LaneVehicle;
  centerGapMeters: number;
  bumperGapMeters: number;
}>;

export type CandidateLaneClearance = Readonly<{
  laneIndex: number;
  targetLaneOffsetMeters: number;
  frontBumperGapMeters: number;
  rearBumperGapMeters: number;
  score: number;
}>;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function createRoadMap(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): RoadMap {
  return new Map(roads.map((road) => [road.id, road]));
}

export function getForwardProgress(vehicle: HomeDriveTrafficVehicle): number {
  return vehicle.directionSign === 1 ? vehicle.t : 1 - vehicle.t;
}

export function getEffectiveLaneIndex(vehicle: HomeDriveTrafficVehicle): number {
  if (
    vehicle.laneChangeDirection !== 0 &&
    Number.isFinite(vehicle.targetLaneIndex)
  ) {
    return vehicle.targetLaneIndex;
  }

  return vehicle.laneIndex;
}

export function getLaneKey(
  segmentId: string,
  directionSign: HomeDriveTrafficVehicle["directionSign"],
  laneIndex: number,
): string {
  return `${segmentId}:${directionSign}:${laneIndex}`;
}

export function getLaneBuckets(
  traffic: HomeDriveTrafficRuntimeState,
  roadsBySegmentId: RoadMap,
): Map<string, LaneVehicle[]> {
  const buckets = new Map<string, LaneVehicle[]>();

  for (const vehicle of traffic.vehicles) {
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= 0.000001) {
      continue;
    }

    const effectiveLaneIndex = getEffectiveLaneIndex(vehicle);
    const key = getLaneKey(
      vehicle.segmentId,
      vehicle.directionSign,
      effectiveLaneIndex,
    );
    const item: LaneVehicle = {
      vehicle,
      road,
      progress: getForwardProgress(vehicle),
    };
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  for (const bucket of buckets.values()) {
    bucket.sort((first, second) => first.progress - second.progress);
  }

  return buckets;
}

export function getBumperGapMeters(
  follower: HomeDriveTrafficVehicle,
  leader: HomeDriveTrafficVehicle,
  centerGapMeters: number,
): number {
  return (
    centerGapMeters - follower.lengthMeters * 0.5 - leader.lengthMeters * 0.5
  );
}

export function getSafeFollowingBumperGapMeters(
  vehicle: HomeDriveTrafficVehicle,
): number {
  const reactionGap = Math.max(0, vehicle.speedMps) * 1.22;
  const massGap = vehicle.lengthMeters * 0.42;

  return clamp(
    MIN_BUMPER_GAP_METERS + reactionGap + massGap,
    MIN_CENTER_GAP_METERS,
    MAX_FOLLOW_GAP_METERS,
  );
}

export function findLeaderInLane(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  laneIndex: number,
  laneBuckets: ReadonlyMap<string, readonly LaneVehicle[]>,
): LaneLeader | null {
  const bucket = laneBuckets.get(
    getLaneKey(vehicle.segmentId, vehicle.directionSign, laneIndex),
  );

  if (!bucket || bucket.length <= 1) {
    return null;
  }

  const progress = getForwardProgress(vehicle);
  let best: LaneLeader | null = null;

  for (const item of bucket) {
    if (item.vehicle.id === vehicle.id) {
      continue;
    }

    const progressDelta = item.progress - progress;

    if (progressDelta <= 0) {
      continue;
    }

    const centerGapMeters = progressDelta * road.length;

    if (centerGapMeters > FOLLOW_LOOKAHEAD_METERS) {
      continue;
    }

    const bumperGapMeters = getBumperGapMeters(
      vehicle,
      item.vehicle,
      centerGapMeters,
    );

    if (!best || centerGapMeters < best.centerGapMeters) {
      best = {
        item,
        centerGapMeters,
        bumperGapMeters,
      };
    }
  }

  return best;
}
