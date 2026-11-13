// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficAwareness.ts

import { getHomeDriveTrafficPositionOnRoad } from "./homeDrive.trafficRouter";
import type {
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficAwarenessDecision,
  HomeDriveTrafficAwarenessSnapshot,
} from "./homeDrive.trafficAwareness.types";
import {
  STABILIZATION_EXTRA_BUMPER_GAP_METERS,
  STABILIZATION_START_MARGIN,
  STABILIZATION_END_MARGIN,
  clamp,
  createRoadMap,
  getForwardProgress,
  getEffectiveLaneIndex,
  getLaneKey,
  getLaneBuckets,
} from "./homeDrive.trafficAwareness.lanes";
import { resolveVehicleDecision } from "./homeDrive.trafficAwareness.decisions";

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
