// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficAwareness.decisions.ts
// Decisões de seguir e trocar de faixa.

import {
  getHomeDriveTrafficLaneCountForDirection,
  resolveHomeDriveTrafficLane,
} from "./homeDrive.trafficLanes";
import type {
  HomeDriveTrafficLaneChangeDirection,
  HomeDriveTrafficTurnSignal,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveTrafficAwarenessDecision } from "./homeDrive.trafficAwareness.types";
import {
  FOLLOW_LOOKAHEAD_METERS,
  OVERTAKE_LOOKAHEAD_METERS,
  LANE_CHANGE_FRONT_CLEARANCE_METERS,
  LANE_CHANGE_REAR_CLEARANCE_METERS,
  LANE_CHANGE_COOLDOWN_BLOCK_SECONDS,
  LANE_CHANGE_MIN_SPEED_ADVANTAGE_MPS,
  clamp,
  clamp01,
  getForwardProgress,
  getLaneKey,
  getBumperGapMeters,
  getSafeFollowingBumperGapMeters,
  findLeaderInLane,
} from "./homeDrive.trafficAwareness.lanes";
import type {
  LaneVehicle,
  LaneLeader,
  CandidateLaneClearance,
} from "./homeDrive.trafficAwareness.lanes";

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

export function resolveVehicleDecision(
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
