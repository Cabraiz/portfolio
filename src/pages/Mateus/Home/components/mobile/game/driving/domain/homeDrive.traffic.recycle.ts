// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.recycle.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import {
  shouldRecycleHomeDriveTrafficVehicle,
} from "./homeDrive.trafficPerformance";
import { getHomeDriveTrafficHeadingRadians } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import {
  MIN_TRAFFIC_CRUISE_SPEED_MPS,
  JUNCTION_COOLDOWN_SECONDS,
  TRAFFIC_RECYCLE_PLACEMENT_ATTEMPTS,
} from "./homeDrive.traffic.constants";
import { getRoadBySegmentIdMap } from "./homeDrive.traffic.roads";
import {
  getPositionOnTrafficRoad,
  getCruiseSpeedForVehicleOnRoad,
  getRecoveryForVehicleOnRoad,
} from "./homeDrive.traffic.vehicleSpeed";
import {
  getRecyclePlacementLane,
  findRecycleRoadForVehicle,
  getRecyclePlacementT,
  hasTrafficRecyclePlacementConflict,
} from "./homeDrive.traffic.recyclePlacement";
import type {
  TrafficRuntimePerformanceContext,
} from "./homeDrive.traffic.recyclePlacement";

function buildRecycledTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  t: number,
  attemptIndex: number,
): HomeDriveTrafficVehicle {
  const lane = getRecyclePlacementLane(vehicle, road, attemptIndex);
  const position = getPositionOnTrafficRoad(road, t, lane.laneOffsetMeters);
  const cruiseSpeedMps = getCruiseSpeedForVehicleOnRoad(vehicle, road);
  const speedMps = Math.max(
    MIN_TRAFFIC_CRUISE_SPEED_MPS,
    Math.min(cruiseSpeedMps, vehicle.speedMps > 0 ? vehicle.speedMps : cruiseSpeedMps),
  );

  return {
    ...vehicle,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: null,
    junctionCooldownSeconds: JUNCTION_COOLDOWN_SECONDS,
    t,
    directionSign: lane.directionSign,
    laneIndex: lane.laneIndex,
    targetLaneIndex: lane.laneIndex,
    targetLaneOffsetMeters: lane.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: 0,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    laneOffsetMeters: lane.laneOffsetMeters,
    position,
    headingRad: getHomeDriveTrafficHeadingRadians(road, lane.directionSign),
    speedMps,
    cruiseSpeedMps,
    speedRecoveryMps2: getRecoveryForVehicleOnRoad(vehicle, road),
    impactOffset: { x: 0, z: 0 },
    impactVelocity: { x: 0, z: 0 },
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

export function recycleTrafficVehicleNearPlayer(
  vehicle: HomeDriveTrafficVehicle,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext,
  vehicles: readonly HomeDriveTrafficVehicle[],
  roadsBySegmentId: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
): HomeDriveTrafficVehicle {
  for (let attemptIndex = 0; attemptIndex < TRAFFIC_RECYCLE_PLACEMENT_ATTEMPTS; attemptIndex += 1) {
    const target = findRecycleRoadForVehicle(
      vehicle,
      roads,
      trafficElapsedSeconds,
      context,
      attemptIndex,
    );

    if (!target) {
      continue;
    }

    const t = getRecyclePlacementT(vehicle, target.road, target.t, attemptIndex);
    const candidate = buildRecycledTrafficVehicle(
      vehicle,
      target.road,
      t,
      attemptIndex,
    );

    if (
      !hasTrafficRecyclePlacementConflict(
        candidate,
        vehicles,
        roadsBySegmentId,
        context,
        crosswalks,
      )
    ) {
      return candidate;
    }
  }

  return vehicle;
}

export function recycleColdTrafficVehicles(
  vehicles: readonly HomeDriveTrafficVehicle[],
  roads: readonly HomeDriveGeneratedRoadSegment[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext | null,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
): readonly HomeDriveTrafficVehicle[] {
  if (!context || !context.profile.runtimeRecyclingEnabled) {
    return vehicles;
  }

  const roadsBySegmentId = getRoadBySegmentIdMap(roads);
  const nextVehicles = vehicles.slice();
  let teleports = 0;
  let changed = false;

  for (let index = 0; index < nextVehicles.length; index += 1) {
    if (teleports >= context.profile.maxTeleportsPerTick) {
      break;
    }

    const vehicle = nextVehicles[index];

    if (
      !shouldRecycleHomeDriveTrafficVehicle(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        context.activeSpeedMps,
        trafficElapsedSeconds,
        context.profile,
      )
    ) {
      continue;
    }

    const recycled = recycleTrafficVehicleNearPlayer(
      vehicle,
      roads,
      trafficElapsedSeconds,
      context,
      nextVehicles,
      roadsBySegmentId,
      crosswalks,
    );

    if (recycled === vehicle) {
      continue;
    }

    nextVehicles[index] = recycled;
    teleports += 1;
    changed = true;
  }

  return changed ? nextVehicles : vehicles;
}
