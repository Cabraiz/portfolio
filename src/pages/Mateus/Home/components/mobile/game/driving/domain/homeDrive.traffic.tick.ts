// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.tick.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import type {
  HomeDriveTrafficAwarenessDecision,
} from "./homeDrive.trafficAwareness.types";
import type { HomeDriveRoadTopology } from "./homeDrive.roadTopology";
import { resolveHomeDriveTrafficRoadStep } from "./homeDrive.trafficRouter";
import { getHomeDriveTrafficHeadingRadians } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import {
  MIN_ROAD_LENGTH_METERS,
  IMPACT_VELOCITY_DECAY_PER_SECOND,
  IMPACT_OFFSET_DECAY_PER_SECOND,
  TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS,
  TRAFFIC_LANE_CHANGE_COMPLETE_EPSILON_METERS,
  JUNCTION_COOLDOWN_SECONDS,
  TRAFFIC_LANE_CHANGE_COMPLETE_COOLDOWN_SECONDS,
  IMPACT_ANGULAR_DECAY_PER_SECOND,
  IMPACT_ROTATION_DECAY_PER_SECOND,
} from "./homeDrive.traffic.constants";
import { clamp01, moveTowards } from "./homeDrive.traffic.roads";
import {
  getPositionOnTrafficRoad,
  getSafeVehicleCruiseSpeedMps,
  getSafeVehicleSpeedRecoveryMps2,
  getCruiseSpeedForVehicleOnRoad,
  getRecoveryForVehicleOnRoad,
} from "./homeDrive.traffic.vehicleSpeed";
import {
  getRecoveredVehicleSpeedMps,
  resolveCrosswalkYieldForVehicle,
  getNextVehicleT,
  decayVector,
  resolveAwarenessLaneTarget,
  getNumberOrFallback,
  getLaneChangeDirection,
  getTurnSignalFromDirection,
  decayScalar,
  getNextCruiseSpeedMps,
  getNextRecoveryMps2,
} from "./homeDrive.traffic.tickHelpers";

export function tickTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  topology: HomeDriveRoadTopology,
  deltaSeconds: number,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
  awarenessDecision?: HomeDriveTrafficAwarenessDecision,
): HomeDriveTrafficVehicle {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle;
  }

  const baseRecoveredSpeedMps = getRecoveredVehicleSpeedMps(
    vehicle,
    road,
    deltaSeconds,
  );
  const crosswalkYield = resolveCrosswalkYieldForVehicle(
    vehicle,
    road,
    crosswalks,
  );
  const awarenessSpeedFactor = clamp01(awarenessDecision?.speedFactor ?? 1);
  const recoveredSpeedMps =
    baseRecoveredSpeedMps * crosswalkYield.speedFactor * awarenessSpeedFactor;
  const awarenessBrakeLight = clamp01(
    awarenessDecision?.brakeLightIntensity ?? 0,
  );
  const crosswalkBrakeLight = clamp01(1 - crosswalkYield.speedFactor);
  const brakeLightIntensity = Math.max(
    awarenessBrakeLight,
    crosswalkBrakeLight,
    recoveredSpeedMps + 0.25 < vehicle.speedMps ? 0.48 : 0,
  );

  const rawNextT = getNextVehicleT(
    vehicle,
    road,
    deltaSeconds,
    recoveredSpeedMps,
  );

  const roadStep = resolveHomeDriveTrafficRoadStep({
    roads,
    topology,
    vehicle,
    currentRoad: road,
    nextT: rawNextT,
    routeSeed: vehicle.routeSeed,
  });

  const decayedImpactVelocity = decayVector(
    vehicle.impactVelocity,
    IMPACT_VELOCITY_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const nextImpactOffsetBeforeDecay = {
    x: vehicle.impactOffset.x + decayedImpactVelocity.x * deltaSeconds,
    z: vehicle.impactOffset.z + decayedImpactVelocity.z * deltaSeconds,
  };

  const nextImpactOffset = decayVector(
    nextImpactOffsetBeforeDecay,
    IMPACT_OFFSET_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const routedToNewSegment = roadStep.segmentId !== vehicle.segmentId;
  const laneTarget = routedToNewSegment
    ? {
        laneIndex: roadStep.laneIndex,
        laneOffsetMeters: roadStep.laneOffsetMeters,
      }
    : resolveAwarenessLaneTarget(vehicle, roadStep.road, awarenessDecision);
  const currentLaneOffsetMeters = getNumberOrFallback(
    vehicle.laneOffsetMeters,
    roadStep.laneOffsetMeters,
  );
  const nextLaneOffsetMeters = routedToNewSegment
    ? laneTarget.laneOffsetMeters
    : moveTowards(
        currentLaneOffsetMeters,
        laneTarget.laneOffsetMeters,
        TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS * deltaSeconds,
      );
  const laneChangeComplete =
    Math.abs(nextLaneOffsetMeters - laneTarget.laneOffsetMeters) <=
    TRAFFIC_LANE_CHANGE_COMPLETE_EPSILON_METERS;
  const nextLaneIndex = laneChangeComplete
    ? laneTarget.laneIndex
    : vehicle.laneIndex;
  const laneChangeDirection = routedToNewSegment
    ? 0
    : laneChangeComplete
      ? 0
      : getLaneChangeDirection(vehicle.laneIndex, laneTarget.laneIndex);
  const laneChangeCompletedThisTick =
    !routedToNewSegment &&
    vehicle.laneChangeDirection !== 0 &&
    laneChangeDirection === 0;
  const nextLaneChangeCooldownSeconds = routedToNewSegment
    ? JUNCTION_COOLDOWN_SECONDS
    : laneChangeCompletedThisTick
      ? TRAFFIC_LANE_CHANGE_COMPLETE_COOLDOWN_SECONDS
      : Math.max(0, vehicle.laneChangeCooldownSeconds - deltaSeconds);
  const nextTurnSignal = routedToNewSegment
    ? null
    : laneChangeDirection !== 0
      ? awarenessDecision?.turnSignal ?? getTurnSignalFromDirection(laneChangeDirection)
      : null;

  const basePosition = getPositionOnTrafficRoad(
    roadStep.road,
    roadStep.t,
    nextLaneOffsetMeters,
  );

  const impactMagnitude = Math.hypot(
    decayedImpactVelocity.x,
    decayedImpactVelocity.z,
  );

  const decayedAngularVelocityRadps = decayScalar(
    vehicle.impactAngularVelocityRadps,
    IMPACT_ANGULAR_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualYawOffsetRad = decayScalar(
    vehicle.visualYawOffsetRad + decayedAngularVelocityRadps * deltaSeconds,
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualRollRad = decayScalar(
    vehicle.visualRollRad +
      Math.sign(decayedImpactVelocity.x + decayedImpactVelocity.z) *
        Math.min(0.22, impactMagnitude * 0.018),
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualPitchRad = decayScalar(
    vehicle.visualPitchRad + Math.min(0.16, impactMagnitude * 0.01),
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const nextCruiseSpeedMps = getNextCruiseSpeedMps(
    vehicle,
    roadStep.road,
    routedToNewSegment,
  );
  const nextRecoveryMps2 = getNextRecoveryMps2(
    vehicle,
    roadStep.road,
    routedToNewSegment,
  );

  return {
    ...vehicle,

    roadId: roadStep.roadId,
    segmentId: roadStep.segmentId,
    segmentIndex: roadStep.segmentIndex,
    previousSegmentId: roadStep.previousSegmentId,
    junctionCooldownSeconds: routedToNewSegment
      ? JUNCTION_COOLDOWN_SECONDS
      : Math.max(0, vehicle.junctionCooldownSeconds - deltaSeconds),

    t: clamp01(roadStep.t),
    directionSign: roadStep.directionSign,
    laneIndex: nextLaneIndex,
    targetLaneIndex: laneTarget.laneIndex,
    targetLaneOffsetMeters: laneTarget.laneOffsetMeters,
    laneChangeDirection,
    laneChangeCooldownSeconds: nextLaneChangeCooldownSeconds,
    turnSignal: nextTurnSignal,
    brakeLightIntensity,
    followingVehicleId: awarenessDecision?.followingVehicleId ?? null,
    laneOffsetMeters: nextLaneOffsetMeters,

    position: {
      x: basePosition.x + nextImpactOffset.x,
      z: basePosition.z + nextImpactOffset.z,
    },

    headingRad: getHomeDriveTrafficHeadingRadians(
      roadStep.road,
      roadStep.directionSign,
    ),

    speedMps: recoveredSpeedMps,
    cruiseSpeedMps: nextCruiseSpeedMps,
    speedRecoveryMps2: nextRecoveryMps2,

    impactOffset: nextImpactOffset,
    impactVelocity: decayedImpactVelocity,
    visualRollRad: decayedVisualRollRad,
    visualPitchRad: decayedVisualPitchRad,
    visualYawOffsetRad: decayedVisualYawOffsetRad,
    impactAngularVelocityRadps: decayedAngularVelocityRadps,
    yieldingToCrosswalkId: crosswalkYield.crosswalkId,
    yieldTimerSeconds: crosswalkYield.crosswalkId
      ? vehicle.yieldTimerSeconds + deltaSeconds
      : Math.max(0, vehicle.yieldTimerSeconds - deltaSeconds * 2),
  };
}

export function tickTrafficVehicleKinematic(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  topology: HomeDriveRoadTopology,
  deltaSeconds: number,
): HomeDriveTrafficVehicle {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle;
  }

  const cruiseSpeedMps = getSafeVehicleCruiseSpeedMps(vehicle, road);
  const recoveryMps2 = getSafeVehicleSpeedRecoveryMps2(vehicle);
  const nextSpeedMps = moveTowards(
    Math.max(0, Number.isFinite(vehicle.speedMps) ? vehicle.speedMps : cruiseSpeedMps),
    cruiseSpeedMps,
    Math.max(0, recoveryMps2 * deltaSeconds),
  );
  const rawNextT = getNextVehicleT(vehicle, road, deltaSeconds, nextSpeedMps);

  const roadStep = resolveHomeDriveTrafficRoadStep({
    roads,
    topology,
    vehicle,
    currentRoad: road,
    nextT: rawNextT,
    routeSeed: vehicle.routeSeed,
  });

  const routedToNewSegment = roadStep.segmentId !== vehicle.segmentId;
  const laneOffsetMeters = routedToNewSegment
    ? roadStep.laneOffsetMeters
    : moveTowards(
        getNumberOrFallback(vehicle.laneOffsetMeters, roadStep.laneOffsetMeters),
        getNumberOrFallback(vehicle.targetLaneOffsetMeters, roadStep.laneOffsetMeters),
        TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS * 0.55 * deltaSeconds,
      );
  const basePosition = getPositionOnTrafficRoad(
    roadStep.road,
    roadStep.t,
    laneOffsetMeters,
  );

  const decayedImpactVelocity = decayVector(
    vehicle.impactVelocity,
    IMPACT_VELOCITY_DECAY_PER_SECOND,
    deltaSeconds,
  );
  const nextImpactOffset = decayVector(
    {
      x: vehicle.impactOffset.x + decayedImpactVelocity.x * deltaSeconds,
      z: vehicle.impactOffset.z + decayedImpactVelocity.z * deltaSeconds,
    },
    IMPACT_OFFSET_DECAY_PER_SECOND,
    deltaSeconds,
  );

  return {
    ...vehicle,
    roadId: roadStep.roadId,
    segmentId: roadStep.segmentId,
    segmentIndex: roadStep.segmentIndex,
    previousSegmentId: roadStep.previousSegmentId,
    junctionCooldownSeconds: routedToNewSegment
      ? JUNCTION_COOLDOWN_SECONDS
      : Math.max(0, vehicle.junctionCooldownSeconds - deltaSeconds),
    t: clamp01(roadStep.t),
    directionSign: roadStep.directionSign,
    laneIndex: routedToNewSegment ? roadStep.laneIndex : vehicle.laneIndex,
    targetLaneIndex: routedToNewSegment ? roadStep.laneIndex : vehicle.targetLaneIndex,
    targetLaneOffsetMeters: routedToNewSegment
      ? roadStep.laneOffsetMeters
      : vehicle.targetLaneOffsetMeters,
    laneChangeDirection: routedToNewSegment ? 0 : vehicle.laneChangeDirection,
    laneChangeCooldownSeconds: Math.max(0, vehicle.laneChangeCooldownSeconds - deltaSeconds),
    turnSignal: routedToNewSegment ? null : vehicle.turnSignal,
    brakeLightIntensity: Math.max(0, vehicle.brakeLightIntensity - deltaSeconds * 2.8),
    followingVehicleId: null,
    laneOffsetMeters,
    position: {
      x: basePosition.x + nextImpactOffset.x,
      z: basePosition.z + nextImpactOffset.z,
    },
    headingRad: getHomeDriveTrafficHeadingRadians(
      roadStep.road,
      roadStep.directionSign,
    ),
    speedMps: nextSpeedMps,
    cruiseSpeedMps: routedToNewSegment
      ? getCruiseSpeedForVehicleOnRoad(vehicle, roadStep.road)
      : cruiseSpeedMps,
    speedRecoveryMps2: routedToNewSegment
      ? getRecoveryForVehicleOnRoad(vehicle, roadStep.road)
      : recoveryMps2,
    impactOffset: nextImpactOffset,
    impactVelocity: decayedImpactVelocity,
    visualRollRad: decayScalar(
      vehicle.visualRollRad,
      IMPACT_ROTATION_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    visualPitchRad: decayScalar(
      vehicle.visualPitchRad,
      IMPACT_ROTATION_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    visualYawOffsetRad: decayScalar(
      vehicle.visualYawOffsetRad,
      IMPACT_ROTATION_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    impactAngularVelocityRadps: decayScalar(
      vehicle.impactAngularVelocityRadps,
      IMPACT_ANGULAR_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: Math.max(0, vehicle.yieldTimerSeconds - deltaSeconds * 2),
  };
}
