// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.recyclePlacement.ts

import { hashVector } from "./homeDrive.math";
import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import {
  getHomeDriveTrafficPerformanceProfile,
  getHomeDriveTrafficSpatialRelation,
} from "./homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficPerformanceProfile,
} from "./homeDrive.trafficPerformance";
import {
  getHomeDriveTrafficDesiredCenterGapMeters,
  getHomeDriveTrafficForwardProgress,
  getHomeDriveTrafficLaneOccupancyKey,
} from "./homeDrive.trafficCongestion";
import { resolveHomeDriveTrafficLane } from "./homeDrive.trafficLanes";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficTickOptions,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import {
  MIN_ROAD_LENGTH_METERS,
  DEFAULT_MIN_ROAD_LENGTH_METERS,
  TRAFFIC_RECYCLE_TARGET_T_MARGIN,
  TRAFFIC_RECYCLE_MIN_WORLD_GAP_METERS,
} from "./homeDrive.traffic.constants";
import {
  clamp,
  lerp,
  smoothstep01,
  getStableRoadSeed,
} from "./homeDrive.traffic.roads";
import {
  getInitialDirectionSign,
  getInitialLaneIndex,
} from "./homeDrive.traffic.vehicleSpeed";

export type TrafficRuntimePerformanceContext = Readonly<{
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  profile: HomeDriveTrafficPerformanceProfile;
}>;

function hasTrafficPerformanceContext(
  options: HomeDriveTrafficTickOptions,
): options is HomeDriveTrafficTickOptions & { activeCenter: HomeDriveVector2 } {
  return Boolean(options.activeCenter);
}

export function createTrafficRuntimePerformanceContext(
  options: HomeDriveTrafficTickOptions,
): TrafficRuntimePerformanceContext | null {
  if (!hasTrafficPerformanceContext(options)) {
    return null;
  }

  return {
    activeCenter: options.activeCenter,
    activeHeadingRad: Number.isFinite(options.activeHeadingRad)
      ? Number(options.activeHeadingRad)
      : 0,
    activeSpeedMps: Number.isFinite(options.activeSpeedMps)
      ? Number(options.activeSpeedMps)
      : 0,
    profile: options.performance ?? getHomeDriveTrafficPerformanceProfile(true),
  };
}

function getTrafficRoadProjection(
  road: HomeDriveGeneratedRoadSegment,
  point: HomeDriveVector2,
): Readonly<{ t: number; distanceMeters: number }> {
  const dx = point.x - road.from.x;
  const dz = point.z - road.from.z;
  const projectedMeters = dx * road.direction.x + dz * road.direction.z;
  const t = clamp(projectedMeters / Math.max(MIN_ROAD_LENGTH_METERS, road.length), 0.06, 0.94);
  const projectedX = road.from.x + road.direction.x * road.length * t;
  const projectedZ = road.from.z + road.direction.z * road.length * t;

  return {
    t,
    distanceMeters: Math.hypot(point.x - projectedX, point.z - projectedZ),
  };
}

function getTrafficRecycleTargetPoint(
  vehicle: HomeDriveTrafficVehicle,
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext,
  attemptIndex = 0,
): HomeDriveVector2 {
  const forwardX = Math.sin(context.activeHeadingRad);
  const forwardZ = Math.cos(context.activeHeadingRad);
  const rightX = Math.cos(context.activeHeadingRad);
  const rightZ = -Math.sin(context.activeHeadingRad);
  const serial = Math.floor(trafficElapsedSeconds * 3) + attemptIndex * 17;
  const attemptSeed = vehicle.routeSeed + attemptIndex * 101.37;
  const forwardSeed = hashVector(attemptSeed, serial, 811);
  const sideSeed = hashVector(attemptSeed, serial, 823);
  const speedBoost = clamp(Math.abs(context.activeSpeedMps) * 4.5, 0, 140);
  const forwardMeters = lerp(
    context.profile.recycleForwardMinMeters,
    context.profile.recycleForwardMaxMeters + speedBoost,
    smoothstep01(forwardSeed),
  );
  const sideMeters =
    (sideSeed - 0.5) * 2 * context.profile.recycleSideMaxMeters;

  return {
    x: context.activeCenter.x + forwardX * forwardMeters + rightX * sideMeters,
    z: context.activeCenter.z + forwardZ * forwardMeters + rightZ * sideMeters,
  };
}

export function findRecycleRoadForVehicle(
  vehicle: HomeDriveTrafficVehicle,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext,
  attemptIndex = 0,
): Readonly<{ road: HomeDriveGeneratedRoadSegment; t: number }> | null {
  const targetPoint = getTrafficRecycleTargetPoint(
    vehicle,
    trafficElapsedSeconds,
    context,
    attemptIndex,
  );
  let best: Readonly<{ road: HomeDriveGeneratedRoadSegment; t: number; score: number }> | null = null;

  for (const road of roads) {
    if (road.length < DEFAULT_MIN_ROAD_LENGTH_METERS) {
      continue;
    }

    const projected = getTrafficRoadProjection(road, targetPoint);

    if (projected.distanceMeters > context.profile.recycleSideMaxMeters * 0.85) {
      continue;
    }

    const relation = getHomeDriveTrafficSpatialRelation(
      { x: road.center.x, z: road.center.z },
      context.activeCenter,
      context.activeHeadingRad,
    );

    if (relation.forwardMeters < context.profile.recycleForwardMinMeters * 0.42) {
      continue;
    }

    const roadSeed = hashVector(
      vehicle.routeSeed + attemptIndex * 83,
      road.segmentIndex,
      trafficElapsedSeconds,
    );
    const score =
      projected.distanceMeters -
      relation.forwardMeters * 0.035 +
      roadSeed * 34 +
      attemptIndex * 0.35;

    if (!best || score < best.score) {
      best = {
        road,
        t: projected.t,
        score,
      };
    }
  }

  if (best) {
    return { road: best.road, t: best.t };
  }

  return null;
}

export function getRecyclePlacementLane(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  attemptIndex: number,
): Readonly<{
  directionSign: HomeDriveTrafficDirectionSign;
  laneIndex: number;
  laneOffsetMeters: number;
}> {
  const roadSeed = getStableRoadSeed(road) + vehicle.routeSeed + attemptIndex * 97;
  const slotSeed = Math.floor(
    hashVector(vehicle.routeSeed + attemptIndex * 31, road.segmentIndex, 857) * 4096,
  );
  const directionSign = getInitialDirectionSign(road, roadSeed, slotSeed);
  const laneIndex = getInitialLaneIndex(road, directionSign, roadSeed, slotSeed);
  const lane = resolveHomeDriveTrafficLane(road, directionSign, laneIndex);

  return {
    directionSign: lane.directionSign,
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
  };
}

export function getRecyclePlacementT(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  baseT: number,
  attemptIndex: number,
): number {
  const jitter =
    (hashVector(vehicle.routeSeed + attemptIndex * 43, road.segmentIndex, 863) - 0.5) *
    (0.1 + Math.min(0.1, attemptIndex * 0.012));

  return clamp(
    baseT + jitter,
    TRAFFIC_RECYCLE_TARGET_T_MARGIN,
    1 - TRAFFIC_RECYCLE_TARGET_T_MARGIN,
  );
}

function hasTrafficRecycleHoldZoneConflict(
  candidate: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment | undefined,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): boolean {
  if (!road || road.length <= MIN_ROAD_LENGTH_METERS) {
    return true;
  }

  /*
    Reciclagem não pode cair em boca de cruzamento. O bug visual vinha daqui:
    carro frio era reaproveitado em stop-line/semáforo, parava, virava líder
    imóvel e a próxima leva empilhava atrás dele.
  */
  if (candidate.t <= 0.14 || candidate.t >= 0.86) {
    return true;
  }

  if (!crosswalks) {
    return false;
  }

  for (const crosswalk of crosswalks.crosswalks) {
    if (crosswalk.segmentId !== candidate.segmentId) {
      continue;
    }

    if (!crosswalk.hasYieldControl && crosswalk.signalPhase === "off") {
      continue;
    }

    const distanceMeters = Math.abs(crosswalk.t - candidate.t) * road.length;

    if (distanceMeters <= 46) {
      return true;
    }
  }

  return false;
}

export function hasTrafficRecyclePlacementConflict(
  candidate: HomeDriveTrafficVehicle,
  vehicles: readonly HomeDriveTrafficVehicle[],
  roadsBySegmentId: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>,
  context: TrafficRuntimePerformanceContext,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
): boolean {
  const candidateRelation = getHomeDriveTrafficSpatialRelation(
    candidate.position,
    context.activeCenter,
    context.activeHeadingRad,
  );

  if (candidateRelation.distanceMeters < context.profile.recycleMinPlayerDistanceMeters) {
    return true;
  }

  const candidateRoad = roadsBySegmentId.get(candidate.segmentId);

  if (hasTrafficRecycleHoldZoneConflict(candidate, candidateRoad, crosswalks)) {
    return true;
  }

  const candidateLaneKey = getHomeDriveTrafficLaneOccupancyKey(candidate);
  const candidateProgress = getHomeDriveTrafficForwardProgress(candidate);

  for (const other of vehicles) {
    if (other.id === candidate.id) {
      continue;
    }

    const worldGapMeters = Math.hypot(
      other.position.x - candidate.position.x,
      other.position.z - candidate.position.z,
    );

    if (worldGapMeters < TRAFFIC_RECYCLE_MIN_WORLD_GAP_METERS) {
      return true;
    }

    if (!candidateRoad || other.segmentId !== candidate.segmentId) {
      continue;
    }

    if (getHomeDriveTrafficLaneOccupancyKey(other) !== candidateLaneKey) {
      continue;
    }

    const centerGapMeters =
      Math.abs(getHomeDriveTrafficForwardProgress(other) - candidateProgress) *
      candidateRoad.length;
    const desiredCenterGapMeters = getHomeDriveTrafficDesiredCenterGapMeters(
      candidate,
      other,
    );

    if (centerGapMeters < desiredCenterGapMeters) {
      return true;
    }
  }

  return false;
}
