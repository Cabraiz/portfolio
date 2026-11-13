// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficIntersectionFlow.release.ts

import type { HomeDriveRoadTopology } from "./homeDrive.roadTopology";
import {
  getHomeDriveTrafficHeadingOnRoad,
  getHomeDriveTrafficPositionOnRoad,
  resolveHomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import {
  clamp01,
  getNumber,
  RELEASE_JUNCTION_COOLDOWN_SECONDS,
  RELEASE_LANE_CHANGE_COOLDOWN_SECONDS,
  getZeroTrafficVector,
  MIN_ROAD_LENGTH_METERS,
  RELEASE_CLEARANCE_METERS,
  RELEASE_STAGGER_METERS,
  RELEASE_MIN_SPEED_MPS,
  KEEP_NEAR_PLAYER_METERS,
} from "./homeDrive.trafficIntersectionFlow.holdZones";
import type {
  HoldZoneItem,
} from "./homeDrive.trafficIntersectionFlow.holdZones";

function createVehicleAtRoadProgress(params: Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  t: number;
  previousSegmentId: string | null;
  minSpeedMps: number;
}>): HomeDriveTrafficVehicle {
  const t = clamp01(params.t);
  const position = getHomeDriveTrafficPositionOnRoad(
    params.road,
    t,
    params.vehicle.laneOffsetMeters,
  );
  const speedMps = Math.max(
    getNumber(params.vehicle.speedMps, 0),
    Math.min(
      getNumber(params.vehicle.cruiseSpeedMps, params.minSpeedMps),
      params.minSpeedMps,
    ),
  );

  return {
    ...params.vehicle,
    roadId: params.road.roadId,
    segmentId: params.road.id,
    segmentIndex: params.road.segmentIndex,
    previousSegmentId: params.previousSegmentId,
    junctionCooldownSeconds: RELEASE_JUNCTION_COOLDOWN_SECONDS,
    t,
    laneIndex: params.vehicle.laneIndex,
    targetLaneIndex: params.vehicle.laneIndex,
    targetLaneOffsetMeters: params.vehicle.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: RELEASE_LANE_CHANGE_COOLDOWN_SECONDS,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    position: {
      x: position.x,
      z: position.z,
    },
    headingRad: getHomeDriveTrafficHeadingOnRoad(
      params.road,
      params.vehicle.directionSign,
    ),
    speedMps,
    impactOffset: getZeroTrafficVector(),
    impactVelocity: getZeroTrafficVector(),
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

function createVehicleFromRoadStep(params: Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  step: ReturnType<typeof resolveHomeDriveTrafficRoadStep>;
  minSpeedMps: number;
}>): HomeDriveTrafficVehicle {
  const position = getHomeDriveTrafficPositionOnRoad(
    params.step.road,
    params.step.t,
    params.step.laneOffsetMeters,
  );
  const speedMps = Math.max(
    getNumber(params.vehicle.speedMps, 0),
    Math.min(
      getNumber(params.vehicle.cruiseSpeedMps, params.minSpeedMps),
      params.minSpeedMps,
    ),
  );

  return {
    ...params.vehicle,
    roadId: params.step.roadId,
    segmentId: params.step.segmentId,
    segmentIndex: params.step.segmentIndex,
    previousSegmentId: params.step.previousSegmentId,
    junctionCooldownSeconds: RELEASE_JUNCTION_COOLDOWN_SECONDS,
    t: clamp01(params.step.t),
    directionSign: params.step.directionSign,
    laneIndex: params.step.laneIndex,
    targetLaneIndex: params.step.laneIndex,
    targetLaneOffsetMeters: params.step.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: RELEASE_LANE_CHANGE_COOLDOWN_SECONDS,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    laneOffsetMeters: params.step.laneOffsetMeters,
    position: {
      x: position.x,
      z: position.z,
    },
    headingRad: getHomeDriveTrafficHeadingOnRoad(
      params.step.road,
      params.step.directionSign,
    ),
    speedMps,
    impactOffset: getZeroTrafficVector(),
    impactVelocity: getZeroTrafficVector(),
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

export function releaseVehicleFromHoldZone(params: Readonly<{
  item: HoldZoneItem;
  vehicles: readonly HomeDriveTrafficVehicle[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  topology: HomeDriveRoadTopology;
  releaseIndex: number;
}>): HomeDriveTrafficVehicle {
  const { item, releaseIndex } = params;
  const roadLength = Math.max(MIN_ROAD_LENGTH_METERS, item.road.length);
  const releaseMeters = RELEASE_CLEARANCE_METERS + releaseIndex * RELEASE_STAGGER_METERS;
  const deltaT = (releaseMeters / roadLength) * item.vehicle.directionSign;
  const targetT = item.zone.targetT + deltaT;
  const minSpeedMps = RELEASE_MIN_SPEED_MPS + Math.min(3.4, releaseIndex * 0.32);

  if (targetT > 0.035 && targetT < 0.965) {
    return createVehicleAtRoadProgress({
      vehicle: item.vehicle,
      road: item.road,
      t: targetT,
      previousSegmentId: item.vehicle.previousSegmentId,
      minSpeedMps,
    });
  }

  const step = resolveHomeDriveTrafficRoadStep({
    roads: params.roads,
    topology: params.topology,
    vehicle: item.vehicle,
    currentRoad: item.road,
    nextT: targetT,
    routeSeed: item.vehicle.routeSeed + releaseIndex * 17,
  });

  return createVehicleFromRoadStep({
    vehicle: item.vehicle,
    step,
    minSpeedMps,
  });
}

export function shouldKeepVehicleInVisibleQueue(
  item: HoldZoneItem,
  keptCount: number,
): boolean {
  /*
    Mesmo perto do player não dá para preservar a fila inteira. Se todos ficam
    protegidos por visibilidade, o cruzamento vira um estacionamento. Mantém só
    os carros necessários para a cena ainda parecer natural e libera o restante.
  */
  if (keptCount < 2) {
    return true;
  }

  return item.distanceToPlayerMeters <= KEEP_NEAR_PLAYER_METERS * 0.58 && keptCount < 3;
}
