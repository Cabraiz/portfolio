// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.spawn.ts

import { hashVector } from "./homeDrive.math";
import {
  getHomeDriveTrafficHeadingRadians,
  resolveHomeDriveTrafficLane,
} from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import {
  pickHomeDriveVehicleModelKey,
  pickHomeDriveVehiclePaintKey,
} from "./vehicles";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import { MAX_TRAFFIC_CRUISE_SPEED_MPS } from "./homeDrive.traffic.constants";
import type { TrafficVehicleCandidate } from "./homeDrive.traffic.constants";
import { clamp01, clamp } from "./homeDrive.traffic.roads";
import {
  getTrafficVehicleModelKind,
  getTrafficVehicleModelDimensions,
  getTrafficVehicleColorFromPaint,
  getTrafficRoadChance,
} from "./homeDrive.traffic.vehicleProfile";
import {
  getInitialDirectionSign,
  getInitialLaneIndex,
  getPositionOnTrafficRoad,
  getTrafficVehicleCruiseSpeedMps,
  getTrafficVehicleRecoveryMps2,
  getTrafficVehicleRouteSeed,
  getInitialRuntimeSpeedMps,
  getVehicleCollisionRadiusMeters,
} from "./homeDrive.traffic.vehicleSpeed";

function createTrafficVehicle(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): HomeDriveTrafficVehicle {
  const directionSign = getInitialDirectionSign(road, roadSeed, slotIndex);
  const laneIndex = getInitialLaneIndex(
    road,
    directionSign,
    roadSeed,
    slotIndex,
  );
  const lane = resolveHomeDriveTrafficLane(road, directionSign, laneIndex);

  const tSeed = hashVector(roadSeed, slotIndex, 509);
  const modelSeed = hashVector(roadSeed, slotIndex, 521);
  const paintSeed = hashVector(roadSeed, slotIndex, 523);
  const speedSeed = hashVector(roadSeed, slotIndex, 547);
  const variantSeed = hashVector(roadSeed, slotIndex, 557);
  const speedJitterSeed = hashVector(roadSeed, slotIndex, 569);
  const accelerationSeed = hashVector(roadSeed, slotIndex, 571);
  const initialSpeedSeed = hashVector(roadSeed, slotIndex, 577);

  const t =
    slotCount <= 1
      ? 0.5
      : clamp01((slotIndex + 0.18 + tSeed * 0.64) / slotCount);

  const modelKey = pickHomeDriveVehicleModelKey(modelSeed, {
    roadKind: road.kind,
    parked: false,
    commercialBias: road.kind === "commercial",
    serviceBias: road.kind === "service",
  });
  const paintKey = pickHomeDriveVehiclePaintKey(paintSeed, modelKey);
  const kind = getTrafficVehicleModelKind(modelKey);
  const dimensions = getTrafficVehicleModelDimensions(modelKey);

  const position = getPositionOnTrafficRoad(road, t, lane.laneOffsetMeters);

  const cruiseSpeedMps = getTrafficVehicleCruiseSpeedMps(
    road,
    kind,
    speedSeed,
    speedJitterSeed,
  );

  const speedRecoveryMps2 = getTrafficVehicleRecoveryMps2(
    road,
    kind,
    accelerationSeed,
  );

  return {
    id: `traffic-${road.id}-${slotIndex}-${directionSign}-${lane.laneIndex}`,
    modelKey,
    kind,
    colorKey: getTrafficVehicleColorFromPaint(paintKey),

    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: null,
    routeSeed: getTrafficVehicleRouteSeed(roadSeed, slotIndex),
    junctionCooldownSeconds: 0,

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
    speedMps: getInitialRuntimeSpeedMps(cruiseSpeedMps, initialSpeedSeed),
    cruiseSpeedMps,
    speedRecoveryMps2,

    widthMeters: dimensions.widthMeters,
    lengthMeters: dimensions.lengthMeters,
    heightMeters: dimensions.heightMeters,
    collisionRadiusMeters: getVehicleCollisionRadiusMeters(
      dimensions.widthMeters,
      dimensions.lengthMeters,
      kind,
    ),

    variant: Math.floor(variantSeed * 6),
    damage: 0,

    impactOffset: {
      x: 0,
      z: 0,
    },
    impactVelocity: {
      x: 0,
      z: 0,
    },
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,

    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,

    lastCollisionAt: -999,
  };
}

export function createTrafficVehicleCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  roadChance: number,
): TrafficVehicleCandidate {
  const vehicle = createTrafficVehicle(road, slotIndex, slotCount, roadSeed);

  const prioritySeed = hashVector(roadSeed, slotIndex, 599);
  const roadImportance = getTrafficRoadChance(road);
  const normalizedChance = Math.max(0.001, roadChance);

  const priority =
    prioritySeed * 0.72 -
    roadImportance * 0.18 +
    (vehicle.cruiseSpeedMps / MAX_TRAFFIC_CRUISE_SPEED_MPS) * 0.1 +
    normalizedChance * 0.04;

  return {
    vehicle,
    priority,
    segmentLengthMeters: road.length,
  };
}

function getMaxTrafficVehiclesForSegment(
  candidate: TrafficVehicleCandidate,
): number {
  return clamp(Math.floor(candidate.segmentLengthMeters / 118) + 1, 2, 7);
}

export function selectTrafficSpawnCandidates(
  candidates: readonly TrafficVehicleCandidate[],
  maxVehicles: number,
): readonly TrafficVehicleCandidate[] {
  const rankedCandidates = candidates
    .slice()
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.vehicle.id.localeCompare(second.vehicle.id);
    });

  const selected: TrafficVehicleCandidate[] = [];
  const selectedIds = new Set<string>();
  const countBySegmentId = new Map<string, number>();

  for (const candidate of rankedCandidates) {
    if (selected.length >= maxVehicles) {
      break;
    }

    const currentCount = countBySegmentId.get(candidate.vehicle.segmentId) ?? 0;

    if (currentCount >= getMaxTrafficVehiclesForSegment(candidate)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.vehicle.id);
    countBySegmentId.set(candidate.vehicle.segmentId, currentCount + 1);
  }

  if (selected.length >= maxVehicles) {
    return selected;
  }

  for (const candidate of rankedCandidates) {
    if (selected.length >= maxVehicles) {
      break;
    }

    if (selectedIds.has(candidate.vehicle.id)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.vehicle.id);
  }

  return selected;
}
