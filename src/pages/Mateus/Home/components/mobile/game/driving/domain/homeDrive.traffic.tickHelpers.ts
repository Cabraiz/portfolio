// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.tickHelpers.ts

import { shouldHomeDriveTrafficYieldAtCrosswalk } from "./crosswalks";
import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import type {
  HomeDriveTrafficAwarenessDecision,
} from "./homeDrive.trafficAwareness.types";
import { resolveHomeDriveTrafficLane } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVector2,
} from "./homeDrive.traffic.types";
import {
  MIN_ROAD_LENGTH_METERS,
  TRAFFIC_CROSSWALK_LOOKAHEAD_METERS,
  TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS,
  TRAFFIC_CROSSWALK_MAX_FULL_STOP_SECONDS,
  TRAFFIC_CROSSWALK_CREEP_SPEED_FACTOR,
  MAX_TRAFFIC_CRUISE_SPEED_MPS,
} from "./homeDrive.traffic.constants";
import type { CrosswalkYieldResolution } from "./homeDrive.traffic.constants";
import { clamp, moveTowards } from "./homeDrive.traffic.roads";
import {
  getSafeVehicleCruiseSpeedMps,
  getSafeVehicleSpeedRecoveryMps2,
  getCruiseSpeedForVehicleOnRoad,
  getRecoveryForVehicleOnRoad,
} from "./homeDrive.traffic.vehicleSpeed";

export function decayVector(
  vector: HomeDriveTrafficVector2,
  decayPerSecond: number,
  deltaSeconds: number,
): HomeDriveTrafficVector2 {
  const decay = Math.exp(-decayPerSecond * deltaSeconds);

  return {
    x: vector.x * decay,
    z: vector.z * decay,
  };
}

export function decayScalar(
  value: number,
  decayPerSecond: number,
  deltaSeconds: number,
): number {
  const decay = Math.exp(-decayPerSecond * deltaSeconds);
  const nextValue = value * decay;

  return Math.abs(nextValue) <= 0.0001 ? 0 : nextValue;
}

function hasCrosswalkOccupancy(
  crosswalks: HomeDriveCrosswalkRuntimeState,
  crosswalkId: string,
): boolean {
  return crosswalks.occupancies.some((occupancy) => {
    return occupancy.crosswalkId === crosswalkId;
  });
}

export function resolveCrosswalkYieldForVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): CrosswalkYieldResolution {
  if (!crosswalks || road.length <= MIN_ROAD_LENGTH_METERS) {
    return {
      speedFactor: 1,
      crosswalkId: null,
    };
  }

  let bestDistanceMeters = Number.POSITIVE_INFINITY;
  let bestCrosswalkId: string | null = null;
  let shouldYield = false;

  for (const crosswalk of crosswalks.crosswalks) {
    if (crosswalk.segmentId !== vehicle.segmentId) {
      continue;
    }

    const deltaT = (crosswalk.t - vehicle.t) * vehicle.directionSign;

    if (deltaT <= 0) {
      continue;
    }

    const distanceMeters = deltaT * road.length;

    if (distanceMeters > TRAFFIC_CROSSWALK_LOOKAHEAD_METERS) {
      continue;
    }

    const occupied = hasCrosswalkOccupancy(crosswalks, crosswalk.id);
    const yieldNow = shouldHomeDriveTrafficYieldAtCrosswalk(
      crosswalk,
      crosswalks.elapsedSeconds,
      occupied,
    );

    if (!yieldNow) {
      continue;
    }

    if (distanceMeters < bestDistanceMeters) {
      bestDistanceMeters = distanceMeters;
      bestCrosswalkId = crosswalk.id;
      shouldYield = true;
    }
  }

  if (!shouldYield || !bestCrosswalkId) {
    return {
      speedFactor: 1,
      crosswalkId: null,
    };
  }

  if (bestDistanceMeters <= TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS) {
    return {
      speedFactor:
        vehicle.yieldTimerSeconds >= TRAFFIC_CROSSWALK_MAX_FULL_STOP_SECONDS
          ? TRAFFIC_CROSSWALK_CREEP_SPEED_FACTOR
          : 0,
      crosswalkId: bestCrosswalkId,
    };
  }

  return {
    speedFactor: clamp(
      (bestDistanceMeters - TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS) /
        (TRAFFIC_CROSSWALK_LOOKAHEAD_METERS -
          TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS),
      0.08,
      0.86,
    ),
    crosswalkId: bestCrosswalkId,
  };
}

export function getRecoveredVehicleSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  deltaSeconds: number,
): number {
  const cruiseSpeedMps = getSafeVehicleCruiseSpeedMps(vehicle, road);
  const recoveryMps2 = getSafeVehicleSpeedRecoveryMps2(vehicle);
  const currentSpeedMps = clamp(
    Number.isFinite(vehicle.speedMps) ? vehicle.speedMps : cruiseSpeedMps,
    0,
    MAX_TRAFFIC_CRUISE_SPEED_MPS * 1.25,
  );

  const maxDelta =
    currentSpeedMps > cruiseSpeedMps
      ? recoveryMps2 * 1.55 * deltaSeconds
      : recoveryMps2 * deltaSeconds;

  return moveTowards(currentSpeedMps, cruiseSpeedMps, Math.max(0, maxDelta));
}

export function getNextVehicleT(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  deltaSeconds: number,
  speedMps: number,
): number {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle.t;
  }

  return (
    vehicle.t +
    (speedMps * vehicle.directionSign * deltaSeconds) / road.length
  );
}

export function getNextCruiseSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  routedToNewSegment: boolean,
): number {
  if (routedToNewSegment) {
    return getCruiseSpeedForVehicleOnRoad(vehicle, road);
  }

  return getSafeVehicleCruiseSpeedMps(vehicle, road);
}

export function getNextRecoveryMps2(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  routedToNewSegment: boolean,
): number {
  if (routedToNewSegment) {
    return getRecoveryForVehicleOnRoad(vehicle, road);
  }

  return getSafeVehicleSpeedRecoveryMps2(vehicle);
}

export function getLaneChangeDirection(
  fromLaneIndex: number,
  toLaneIndex: number,
): -1 | 0 | 1 {
  if (toLaneIndex > fromLaneIndex) {
    return 1;
  }

  if (toLaneIndex < fromLaneIndex) {
    return -1;
  }

  return 0;
}

export function getTurnSignalFromDirection(
  direction: -1 | 0 | 1,
): HomeDriveTrafficVehicle["turnSignal"] {
  if (direction > 0) {
    return "left";
  }

  if (direction < 0) {
    return "right";
  }

  return null;
}

export function getNumberOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function resolveAwarenessLaneTarget(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  decision: HomeDriveTrafficAwarenessDecision | undefined,
): Readonly<{
  laneIndex: number;
  laneOffsetMeters: number;
}> {
  const requestedLaneIndex = getNumberOrFallback(
    decision?.targetLaneIndex ?? vehicle.targetLaneIndex,
    vehicle.laneIndex,
  );

  const lane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    requestedLaneIndex,
  );

  return {
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
  };
}
