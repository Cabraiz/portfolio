// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficAwareness.ts

import {
  getHomeDriveTrafficLaneCountForDirection,
  resolveHomeDriveTrafficLane,
} from "./homeDrive.trafficLanes";
import { getHomeDriveTrafficPositionOnRoad } from "./homeDrive.trafficRouter";
import type {
  HomeDriveTrafficLaneChangeDirection,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficTurnSignal,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficAwarenessDecision,
  HomeDriveTrafficAwarenessSnapshot,
} from "./homeDrive.trafficAwareness.types";

const MIN_CENTER_GAP_METERS = 7.2;
const MIN_BUMPER_GAP_METERS = 2.4;
const MAX_FOLLOW_GAP_METERS = 42;
const FOLLOW_LOOKAHEAD_METERS = 74;
const OVERTAKE_LOOKAHEAD_METERS = 62;
const LANE_CHANGE_FRONT_CLEARANCE_METERS = 26;
const LANE_CHANGE_REAR_CLEARANCE_METERS = 18;
const LANE_CHANGE_COOLDOWN_BLOCK_SECONDS = 0.05;
const LANE_CHANGE_MIN_SPEED_ADVANTAGE_MPS = 1.65;
const STABILIZATION_EXTRA_BUMPER_GAP_METERS = 1.6;
const STABILIZATION_START_MARGIN = 0.018;
const STABILIZATION_END_MARGIN = 0.982;

const DEFAULT_DECISION: Omit<
  HomeDriveTrafficAwarenessDecision,
  "targetLaneIndex" | "targetLaneOffsetMeters"
> = Object.freeze({
  speedFactor: 1,
  laneChangeDirection: 0,
  turnSignal: null,
  brakeLightIntensity: 0,
  followingVehicleId: null,
  blockReason: "none",
});

type RoadMap = ReadonlyMap<string, HomeDriveGeneratedRoadSegment>;

type LaneVehicle = Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  progress: number;
}>;

type LaneLeader = Readonly<{
  item: LaneVehicle;
  centerGapMeters: number;
  bumperGapMeters: number;
}>;

type CandidateLaneClearance = Readonly<{
  laneIndex: number;
  targetLaneOffsetMeters: number;
  frontBumperGapMeters: number;
  rearBumperGapMeters: number;
  score: number;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function createRoadMap(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): RoadMap {
  return new Map(roads.map((road) => [road.id, road]));
}

function getForwardProgress(vehicle: HomeDriveTrafficVehicle): number {
  return vehicle.directionSign === 1 ? vehicle.t : 1 - vehicle.t;
}

function getEffectiveLaneIndex(vehicle: HomeDriveTrafficVehicle): number {
  if (
    vehicle.laneChangeDirection !== 0 &&
    Number.isFinite(vehicle.targetLaneIndex)
  ) {
    return vehicle.targetLaneIndex;
  }

  return vehicle.laneIndex;
}

function getLaneKey(
  segmentId: string,
  directionSign: HomeDriveTrafficVehicle["directionSign"],
  laneIndex: number,
): string {
  return `${segmentId}:${directionSign}:${laneIndex}`;
}

function getLaneBuckets(
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

function getBumperGapMeters(
  follower: HomeDriveTrafficVehicle,
  leader: HomeDriveTrafficVehicle,
  centerGapMeters: number,
): number {
  return (
    centerGapMeters - follower.lengthMeters * 0.5 - leader.lengthMeters * 0.5
  );
}

function getSafeFollowingBumperGapMeters(
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

function findLeaderInLane(
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

function getFollowingDecision(
  vehicle: HomeDriveTrafficVehicle,
  leader: LaneLeader | null,
): Pick<
  HomeDriveTrafficAwarenessDecision,
  "speedFactor" | "brakeLightIntensity" | "followingVehicleId" | "blockReason"
> {
  if (!leader) {
    return {
      speedFactor: 1,
      brakeLightIntensity: 0,
      followingVehicleId: null,
      blockReason: "none",
    };
  }

  const safeBumperGapMeters = getSafeFollowingBumperGapMeters(vehicle);
  const emergencyGapMeters = Math.max(0.6, vehicle.speedMps * 0.24);
  const leaderSpeedFactor = clamp(
    leader.item.vehicle.speedMps / Math.max(1, vehicle.cruiseSpeedMps) + 0.08,
    0,
    1,
  );

  if (leader.bumperGapMeters <= emergencyGapMeters) {
    return {
      speedFactor: 0,
      brakeLightIntensity: 1,
      followingVehicleId: leader.item.vehicle.id,
      blockReason: "emergency",
    };
  }

  if (leader.bumperGapMeters < safeBumperGapMeters) {
    const distanceFactor = clamp01(
      (leader.bumperGapMeters - emergencyGapMeters) /
        Math.max(0.001, safeBumperGapMeters - emergencyGapMeters),
    );
    const speedFactor = clamp(
      Math.min(distanceFactor, leaderSpeedFactor),
      0.05,
      0.95,
    );

    return {
      speedFactor,
      brakeLightIntensity: clamp01(1 - speedFactor),
      followingVehicleId: leader.item.vehicle.id,
      blockReason: "follow",
    };
  }

  if (
    leader.bumperGapMeters < FOLLOW_LOOKAHEAD_METERS &&
    leader.item.vehicle.speedMps + 1.2 < vehicle.speedMps
  ) {
    const softFactor = clamp(
      leaderSpeedFactor + leader.bumperGapMeters / FOLLOW_LOOKAHEAD_METERS,
      0.42,
      1,
    );

    return {
      speedFactor: softFactor,
      brakeLightIntensity: clamp01((1 - softFactor) * 0.72),
      followingVehicleId: leader.item.vehicle.id,
      blockReason: softFactor < 0.98 ? "follow" : "none",
    };
  }

  return {
    speedFactor: 1,
    brakeLightIntensity: 0,
    followingVehicleId: leader.item.vehicle.id,
    blockReason: "none",
  };
}

function getLaneChangeDirection(
  fromLaneIndex: number,
  toLaneIndex: number,
): HomeDriveTrafficLaneChangeDirection {
  if (toLaneIndex > fromLaneIndex) {
    return 1;
  }

  if (toLaneIndex < fromLaneIndex) {
    return -1;
  }

  return 0;
}

function getTurnSignalFromLaneChange(
  direction: HomeDriveTrafficLaneChangeDirection,
): HomeDriveTrafficTurnSignal {
  if (direction > 0) {
    return "left";
  }

  if (direction < 0) {
    return "right";
  }

  return null;
}

function getLaneClearance(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  laneIndex: number,
  laneBuckets: ReadonlyMap<string, readonly LaneVehicle[]>,
): CandidateLaneClearance {
  const bucket = laneBuckets.get(
    getLaneKey(vehicle.segmentId, vehicle.directionSign, laneIndex),
  );
  const progress = getForwardProgress(vehicle);
  const targetLane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    laneIndex,
  );

  let frontBumperGapMeters = Number.POSITIVE_INFINITY;
  let rearBumperGapMeters = Number.POSITIVE_INFINITY;

  if (bucket) {
    for (const item of bucket) {
      if (item.vehicle.id === vehicle.id) {
        continue;
      }

      const centerGapMeters = Math.abs(item.progress - progress) * road.length;
      const bumperGapMeters = getBumperGapMeters(
        vehicle,
        item.vehicle,
        centerGapMeters,
      );

      if (item.progress >= progress) {
        frontBumperGapMeters = Math.min(
          frontBumperGapMeters,
          bumperGapMeters,
        );
      } else {
        rearBumperGapMeters = Math.min(rearBumperGapMeters, bumperGapMeters);
      }
    }
  }

  return {
    laneIndex: targetLane.laneIndex,
    targetLaneOffsetMeters: targetLane.laneOffsetMeters,
    frontBumperGapMeters,
    rearBumperGapMeters,
    score: frontBumperGapMeters + rearBumperGapMeters * 0.42,
  };
}

function findBestLaneChange(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  laneBuckets: ReadonlyMap<string, readonly LaneVehicle[]>,
  leader: LaneLeader | null,
): CandidateLaneClearance | null {
  const laneCount = getHomeDriveTrafficLaneCountForDirection(
    road,
    vehicle.directionSign,
  );

  if (laneCount <= 1 || vehicle.laneChangeCooldownSeconds > LANE_CHANGE_COOLDOWN_BLOCK_SECONDS) {
    return null;
  }

  if (!leader) {
    return null;
  }

  const leaderIsWorthPassing =
    leader.bumperGapMeters < OVERTAKE_LOOKAHEAD_METERS &&
    leader.item.vehicle.speedMps + LANE_CHANGE_MIN_SPEED_ADVANTAGE_MPS <
      Math.min(vehicle.cruiseSpeedMps, vehicle.speedMps + 2.5);

  if (!leaderIsWorthPassing) {
    return null;
  }

  const candidateLaneIndexes = [vehicle.laneIndex + 1, vehicle.laneIndex - 1]
    .filter((laneIndex) => laneIndex >= 0 && laneIndex < laneCount);

  if (candidateLaneIndexes.length <= 0) {
    return null;
  }

  const minimumFrontGap = Math.max(
    LANE_CHANGE_FRONT_CLEARANCE_METERS,
    vehicle.speedMps * 1.16 + vehicle.lengthMeters,
  );
  const minimumRearGap = Math.max(
    LANE_CHANGE_REAR_CLEARANCE_METERS,
    vehicle.speedMps * 0.72 + vehicle.lengthMeters * 0.5,
  );

  const viable = candidateLaneIndexes
    .map((laneIndex) => getLaneClearance(vehicle, road, laneIndex, laneBuckets))
    .filter((clearance) => {
      return (
        clearance.frontBumperGapMeters >= minimumFrontGap &&
        clearance.rearBumperGapMeters >= minimumRearGap
      );
    })
    .sort((first, second) => second.score - first.score);

  return viable[0] ?? null;
}

function getDefaultDecision(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): HomeDriveTrafficAwarenessDecision {
  const lane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    vehicle.laneIndex,
  );

  return {
    ...DEFAULT_DECISION,
    targetLaneIndex: lane.laneIndex,
    targetLaneOffsetMeters: lane.laneOffsetMeters,
  };
}

function resolveVehicleDecision(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  laneBuckets: ReadonlyMap<string, readonly LaneVehicle[]>,
): HomeDriveTrafficAwarenessDecision {
  const currentLane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    vehicle.laneIndex,
  );
  const activeTargetLaneIndex = Number.isFinite(vehicle.targetLaneIndex)
    ? vehicle.targetLaneIndex
    : currentLane.laneIndex;
  const activeTargetLane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    activeTargetLaneIndex,
  );
  const isChangingLane =
    vehicle.laneChangeDirection !== 0 &&
    Math.abs(vehicle.laneOffsetMeters - activeTargetLane.laneOffsetMeters) > 0.12;

  const leader = findLeaderInLane(
    vehicle,
    road,
    vehicle.laneIndex,
    laneBuckets,
  );
  const followingDecision = getFollowingDecision(vehicle, leader);

  if (isChangingLane) {
    return {
      ...followingDecision,
      targetLaneIndex: activeTargetLane.laneIndex,
      targetLaneOffsetMeters: activeTargetLane.laneOffsetMeters,
      laneChangeDirection: vehicle.laneChangeDirection,
      turnSignal: getTurnSignalFromLaneChange(vehicle.laneChangeDirection),
      brakeLightIntensity: followingDecision.brakeLightIntensity,
      blockReason:
        followingDecision.blockReason === "none"
          ? "lane-change"
          : followingDecision.blockReason,
    };
  }

  const bestLaneChange = findBestLaneChange(vehicle, road, laneBuckets, leader);

  if (bestLaneChange) {
    const direction = getLaneChangeDirection(
      currentLane.laneIndex,
      bestLaneChange.laneIndex,
    );

    return {
      ...followingDecision,
      speedFactor: Math.max(followingDecision.speedFactor, 0.64),
      brakeLightIntensity: Math.min(followingDecision.brakeLightIntensity, 0.45),
      targetLaneIndex: bestLaneChange.laneIndex,
      targetLaneOffsetMeters: bestLaneChange.targetLaneOffsetMeters,
      laneChangeDirection: direction,
      turnSignal: getTurnSignalFromLaneChange(direction),
      blockReason: "lane-change",
    };
  }

  return {
    ...followingDecision,
    targetLaneIndex: currentLane.laneIndex,
    targetLaneOffsetMeters: currentLane.laneOffsetMeters,
    laneChangeDirection: 0,
    turnSignal: null,
  };
}

export function createHomeDriveTrafficAwarenessSnapshot(
  traffic: HomeDriveTrafficRuntimeState,
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveTrafficAwarenessSnapshot {
  const roadsBySegmentId = createRoadMap(roads);
  const laneBuckets = getLaneBuckets(traffic, roadsBySegmentId);
  const decisionsByVehicleId = new Map<string, HomeDriveTrafficAwarenessDecision>();

  for (const vehicle of traffic.vehicles) {
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= 0.000001) {
      continue;
    }

    decisionsByVehicleId.set(
      vehicle.id,
      resolveVehicleDecision(vehicle, road, laneBuckets),
    );
  }

  return {
    decisionsByVehicleId,
  };
}

function getStabilizationCenterGapMeters(
  follower: HomeDriveTrafficVehicle,
  leader: HomeDriveTrafficVehicle,
): number {
  return (
    follower.lengthMeters * 0.5 +
    leader.lengthMeters * 0.5 +
    STABILIZATION_EXTRA_BUMPER_GAP_METERS
  );
}

function withStabilizedPosition(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  nextForwardProgress: number,
): HomeDriveTrafficVehicle {
  const rawT = vehicle.directionSign === 1
    ? nextForwardProgress
    : 1 - nextForwardProgress;
  const t = clamp(rawT, STABILIZATION_START_MARGIN, STABILIZATION_END_MARGIN);
  const position = getHomeDriveTrafficPositionOnRoad(
    road,
    t,
    vehicle.laneOffsetMeters,
  );

  return {
    ...vehicle,
    t,
    position: {
      x: position.x + vehicle.impactOffset.x,
      z: position.z + vehicle.impactOffset.z,
    },
    speedMps: Math.min(vehicle.speedMps, Math.max(0, vehicle.speedMps * 0.24)),
    brakeLightIntensity: Math.max(vehicle.brakeLightIntensity, 0.9),
  };
}

export function stabilizeHomeDriveTrafficLaneSeparation(
  vehicles: readonly HomeDriveTrafficVehicle[],
  roads: readonly HomeDriveGeneratedRoadSegment[],
): readonly HomeDriveTrafficVehicle[] {
  const roadsBySegmentId = createRoadMap(roads);
  const nextVehicles = vehicles.slice();
  const buckets = new Map<string, Array<{ index: number; progress: number }>>();

  nextVehicles.forEach((vehicle, index) => {
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= 0.000001) {
      return;
    }

    const effectiveLaneIndex = getEffectiveLaneIndex(vehicle);
    const key = getLaneKey(
      vehicle.segmentId,
      vehicle.directionSign,
      effectiveLaneIndex,
    );
    const item = {
      index,
      progress: getForwardProgress(vehicle),
    };
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  });

  for (const bucket of buckets.values()) {
    bucket.sort((first, second) => first.progress - second.progress);

    for (let itemIndex = bucket.length - 2; itemIndex >= 0; itemIndex -= 1) {
      const backItem = bucket[itemIndex];
      const frontItem = bucket[itemIndex + 1];
      const backVehicle = nextVehicles[backItem.index];
      const frontVehicle = nextVehicles[frontItem.index];
      const road = roadsBySegmentId.get(backVehicle.segmentId);

      if (!road || road.length <= 0.000001) {
        continue;
      }

      const desiredCenterGap = getStabilizationCenterGapMeters(
        backVehicle,
        frontVehicle,
      );
      const currentCenterGap =
        (frontItem.progress - backItem.progress) * road.length;

      if (currentCenterGap >= desiredCenterGap) {
        continue;
      }

      const repairedProgress = clamp(
        frontItem.progress - desiredCenterGap / road.length,
        STABILIZATION_START_MARGIN,
        STABILIZATION_END_MARGIN,
      );

      bucket[itemIndex] = {
        ...backItem,
        progress: repairedProgress,
      };
      nextVehicles[backItem.index] = withStabilizedPosition(
        backVehicle,
        road,
        repairedProgress,
      );
    }
  }

  return nextVehicles;
}
