// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollisionGuard.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianCollisionGuardFrame,
  HomeDrivePedestrianCollisionGuardOptions,
} from "./homeDrive.pedestrianCollisionGuard.types";

const DEFAULT_CAR_RADIUS_METERS = 1.68;
const DEFAULT_PEDESTRIAN_RADIUS_METERS = 0.46;
const DEFAULT_IMPACT_FORWARD_METERS = 4.6;
const DEFAULT_SPEED_LOOKAHEAD_SECONDS = 0.28;
const DEFAULT_MAX_IMPACT_FORWARD_METERS = 18;
const DEFAULT_LATERAL_PADDING_METERS = 0.72;
const DEFAULT_REAR_PADDING_METERS = 4.8;
const DEFAULT_NEAR_STABILITY_FORWARD_METERS = 34;
const DEFAULT_NEAR_STABILITY_LATERAL_METERS = 6.2;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

export function getHomeDrivePedestrianCollisionGuardFrame(
  pedestrianPosition: HomeDriveVector2,
  options: HomeDrivePedestrianCollisionGuardOptions,
): HomeDrivePedestrianCollisionGuardFrame {
  const forward = getForwardVector(options.carHeadingRad);
  const right = getRightVector(options.carHeadingRad);
  const dx = pedestrianPosition.x - options.carPosition.x;
  const dz = pedestrianPosition.z - options.carPosition.z;
  const forwardMeters = dx * forward.x + dz * forward.z;
  const lateralMeters = dx * right.x + dz * right.z;
  const absoluteLateralMeters = Math.abs(lateralMeters);
  const distanceMeters = Math.hypot(dx, dz);

  const carRadiusMeters = Math.max(
    0.2,
    options.carRadiusMeters ?? DEFAULT_CAR_RADIUS_METERS,
  );
  const pedestrianRadiusMeters = Math.max(
    0.1,
    options.pedestrianRadiusMeters ?? DEFAULT_PEDESTRIAN_RADIUS_METERS,
  );
  const lateralPaddingMeters = Math.max(
    0,
    options.lateralPaddingMeters ?? DEFAULT_LATERAL_PADDING_METERS,
  );
  const speedLookaheadSeconds = Math.max(
    0,
    options.speedLookaheadSeconds ?? DEFAULT_SPEED_LOOKAHEAD_SECONDS,
  );
  const impactForwardMeters = Math.max(
    carRadiusMeters + pedestrianRadiusMeters,
    options.impactForwardMeters ?? DEFAULT_IMPACT_FORWARD_METERS,
  );
  const maxImpactForwardMeters = Math.max(
    impactForwardMeters,
    options.maxImpactForwardMeters ?? DEFAULT_MAX_IMPACT_FORWARD_METERS,
  );
  const dynamicForwardMeters = clamp(
    impactForwardMeters + Math.max(0, options.carSpeedMps) * speedLookaheadSeconds,
    impactForwardMeters,
    maxImpactForwardMeters,
  );
  const impactLateralMeters =
    carRadiusMeters + pedestrianRadiusMeters + lateralPaddingMeters;
  const rearPaddingMeters = Math.max(
    0,
    options.rearPaddingMeters ?? DEFAULT_REAR_PADDING_METERS,
  );
  const nearStabilityForwardMeters = Math.max(
    dynamicForwardMeters,
    options.nearStabilityForwardMeters ?? DEFAULT_NEAR_STABILITY_FORWARD_METERS,
  );
  const nearStabilityLateralMeters = Math.max(
    impactLateralMeters,
    options.nearStabilityLateralMeters ?? DEFAULT_NEAR_STABILITY_LATERAL_METERS,
  );

  return {
    forwardMeters,
    lateralMeters,
    absoluteLateralMeters,
    distanceMeters,
    isAhead: forwardMeters >= 0,
    isInsideImpactCapsule:
      forwardMeters >= -rearPaddingMeters &&
      forwardMeters <= dynamicForwardMeters &&
      absoluteLateralMeters <= impactLateralMeters,
    isInsideNearStabilityCapsule:
      forwardMeters >= -rearPaddingMeters &&
      forwardMeters <= nearStabilityForwardMeters &&
      absoluteLateralMeters <= nearStabilityLateralMeters,
  };
}

export function isHomeDrivePedestrianInCollisionGuard(
  pedestrianPosition: HomeDriveVector2,
  options: HomeDrivePedestrianCollisionGuardOptions,
): boolean {
  const frame = getHomeDrivePedestrianCollisionGuardFrame(
    pedestrianPosition,
    options,
  );

  return frame.isInsideImpactCapsule || frame.isInsideNearStabilityCapsule;
}

export function isHomeDrivePedestrianAgentCollisionLocked(
  agent: HomeDrivePedestrianAgent,
  options: HomeDrivePedestrianCollisionGuardOptions,
): boolean {
  const impact = agent.pedestrianImpact;

  if (impact?.active || (impact?.yMeters ?? 0) > 0.01) {
    return true;
  }

  const lockedUntil = agent.collisionLockedUntilSeconds;

  if (
    typeof lockedUntil === "number" &&
    typeof options.nowSeconds === "number" &&
    lockedUntil > options.nowSeconds
  ) {
    return true;
  }

  return isHomeDrivePedestrianInCollisionGuard(agent.position, options);
}
