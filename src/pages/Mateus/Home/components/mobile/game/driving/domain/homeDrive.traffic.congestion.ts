// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.congestion.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import {
  getHomeDriveTrafficDesiredCenterGapMeters,
  getHomeDriveTrafficForwardProgress,
  getHomeDriveTrafficLaneOccupancyKey,
  isHomeDriveTrafficVehicleProtectedFromRecycle,
  shouldHomeDriveTrafficVehicleReceiveStuckRescue,
} from "./homeDrive.trafficCongestion";
import {
  getHomeDriveTrafficHeadingRadians,
  resolveHomeDriveTrafficLane,
} from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import {
  TRAFFIC_CONGESTION_T_MARGIN,
  TRAFFIC_CONGESTION_STUCK_SPEED_RECOVERY_RATIO,
  MIN_ROAD_LENGTH_METERS,
  TRAFFIC_CONGESTION_STUCK_RECOVERY_MIN_MPS,
} from "./homeDrive.traffic.constants";
import { clamp, getRoadBySegmentIdMap } from "./homeDrive.traffic.roads";
import { getPositionOnTrafficRoad } from "./homeDrive.traffic.vehicleSpeed";
import type {
  TrafficRuntimePerformanceContext,
} from "./homeDrive.traffic.recyclePlacement";
import { recycleTrafficVehicleNearPlayer } from "./homeDrive.traffic.recycle";

function getTrafficVehicleWithProgress(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  forwardProgress: number,
  minimumSpeedMps: number,
): HomeDriveTrafficVehicle {
  const safeForwardProgress = clamp(
    forwardProgress,
    TRAFFIC_CONGESTION_T_MARGIN,
    1 - TRAFFIC_CONGESTION_T_MARGIN,
  );
  const t = vehicle.directionSign === 1
    ? safeForwardProgress
    : 1 - safeForwardProgress;
  const lane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    vehicle.laneIndex,
  );
  const position = getPositionOnTrafficRoad(road, t, lane.laneOffsetMeters);
  const rescuedSpeedMps = Math.max(
    vehicle.speedMps,
    Math.min(
      vehicle.cruiseSpeedMps,
      Math.max(minimumSpeedMps, vehicle.cruiseSpeedMps * 0.42),
    ),
  );

  return {
    ...vehicle,
    t,
    laneIndex: lane.laneIndex,
    targetLaneIndex: lane.laneIndex,
    targetLaneOffsetMeters: lane.laneOffsetMeters,
    laneOffsetMeters: lane.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: Math.max(vehicle.laneChangeCooldownSeconds, 0.16),
    turnSignal: null,
    brakeLightIntensity: Math.max(0.18, vehicle.brakeLightIntensity * 0.55),
    followingVehicleId: null,
    position: {
      x: position.x + vehicle.impactOffset.x,
      z: position.z + vehicle.impactOffset.z,
    },
    headingRad: getHomeDriveTrafficHeadingRadians(road, lane.directionSign),
    speedMps: rescuedSpeedMps,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: Math.max(0, vehicle.yieldTimerSeconds - 1.2),
  };
}

function getTrafficVehicleWithStuckRescue(
  vehicle: HomeDriveTrafficVehicle,
  minimumSpeedMps: number,
): HomeDriveTrafficVehicle {
  const rescueSpeedMps = Math.min(
    vehicle.cruiseSpeedMps,
    Math.max(
      minimumSpeedMps,
      vehicle.cruiseSpeedMps * TRAFFIC_CONGESTION_STUCK_SPEED_RECOVERY_RATIO,
    ),
  );

  if (vehicle.speedMps >= rescueSpeedMps) {
    return vehicle;
  }

  return {
    ...vehicle,
    speedMps: rescueSpeedMps,
    brakeLightIntensity: Math.min(vehicle.brakeLightIntensity, 0.2),
    followingVehicleId: null,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

export function repairTrafficCongestionAfterBudgetTick(
  vehicles: readonly HomeDriveTrafficVehicle[],
  roads: readonly HomeDriveGeneratedRoadSegment[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext | null,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
): readonly HomeDriveTrafficVehicle[] {
  if (!context || !context.profile.congestionGuardEnabled) {
    return vehicles;
  }

  const roadsBySegmentId = getRoadBySegmentIdMap(roads);
  const nextVehicles = vehicles.slice();
  const buckets = new Map<string, Array<{ index: number; progress: number }>>();

  nextVehicles.forEach((vehicle, index) => {
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= MIN_ROAD_LENGTH_METERS) {
      return;
    }

    const key = getHomeDriveTrafficLaneOccupancyKey(vehicle);
    const item = {
      index,
      progress: getHomeDriveTrafficForwardProgress(vehicle),
    };
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  });

  let repairedVehicles = 0;
  let recycledVehicles = 0;
  let changed = false;

  for (const bucket of buckets.values()) {
    if (bucket.length <= 1) {
      continue;
    }

    bucket.sort((first, second) => first.progress - second.progress);

    for (let itemIndex = bucket.length - 2; itemIndex >= 0; itemIndex -= 1) {
      if (
        repairedVehicles >= context.profile.congestionRepairMaxVehiclesPerTick &&
        recycledVehicles >= context.profile.congestionRecycleMaxVehiclesPerTick
      ) {
        break;
      }

      const followerItem = bucket[itemIndex];
      const leaderItem = bucket[itemIndex + 1];
      const follower = nextVehicles[followerItem.index];
      const leader = nextVehicles[leaderItem.index];
      const road = roadsBySegmentId.get(follower.segmentId);

      if (!road || road.length <= MIN_ROAD_LENGTH_METERS) {
        continue;
      }

      const currentGapMeters = Math.max(
        0,
        (leaderItem.progress - followerItem.progress) * road.length,
      );
      const desiredGapMeters = getHomeDriveTrafficDesiredCenterGapMeters(
        follower,
        leader,
      );

      if (currentGapMeters >= desiredGapMeters) {
        continue;
      }

      const canRecycleFollower =
        recycledVehicles < context.profile.congestionRecycleMaxVehiclesPerTick &&
        currentGapMeters <= desiredGapMeters * context.profile.congestionHardGapRatio &&
        !isHomeDriveTrafficVehicleProtectedFromRecycle(
          follower,
          context.activeCenter,
          context.activeHeadingRad,
          trafficElapsedSeconds,
          context.profile,
        );

      if (canRecycleFollower) {
        const recycled = recycleTrafficVehicleNearPlayer(
          follower,
          roads,
          trafficElapsedSeconds,
          context,
          nextVehicles,
          roadsBySegmentId,
          crosswalks,
        );

        if (recycled !== follower) {
          nextVehicles[followerItem.index] = recycled;
          recycledVehicles += 1;
          changed = true;
          continue;
        }
      }

      if (repairedVehicles >= context.profile.congestionRepairMaxVehiclesPerTick) {
        continue;
      }

      const repairedProgress =
        leaderItem.progress - desiredGapMeters / Math.max(MIN_ROAD_LENGTH_METERS, road.length);

      if (repairedProgress <= TRAFFIC_CONGESTION_T_MARGIN) {
        continue;
      }

      const repaired = getTrafficVehicleWithProgress(
        follower,
        road,
        repairedProgress,
        context.profile.stuckRescueMinSpeedMps,
      );

      nextVehicles[followerItem.index] = repaired;
      bucket[itemIndex] = {
        ...followerItem,
        progress: getHomeDriveTrafficForwardProgress(repaired),
      };
      repairedVehicles += 1;
      changed = true;
    }
  }

  for (let index = 0; index < nextVehicles.length; index += 1) {
    if (repairedVehicles >= context.profile.congestionRepairMaxVehiclesPerTick) {
      break;
    }

    const vehicle = nextVehicles[index];

    if (
      !shouldHomeDriveTrafficVehicleReceiveStuckRescue(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        trafficElapsedSeconds,
        context.profile,
      )
    ) {
      continue;
    }

    nextVehicles[index] = getTrafficVehicleWithStuckRescue(
      vehicle,
      Math.max(
        TRAFFIC_CONGESTION_STUCK_RECOVERY_MIN_MPS,
        context.profile.stuckRescueMinSpeedMps,
      ),
    );
    repairedVehicles += 1;
    changed = true;
  }

  return changed ? nextVehicles : vehicles;
}
