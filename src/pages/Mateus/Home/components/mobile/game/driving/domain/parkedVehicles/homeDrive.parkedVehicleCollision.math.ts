// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicleCollision.math.ts

import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveParkedVehicleWithImpact,
} from "./homeDrive.parkedVehicleImpact";

export const DEFAULT_PLAYER_RADIUS_METERS = 1.52;
export const DEFAULT_COLLISION_COOLDOWN_SECONDS = 0.34;
export const DEFAULT_MIN_IMPACT_SPEED_MPS = 1.25;
export const DEFAULT_COLLISION_BRUTALITY = 1.58;
export const DEFAULT_PARKED_PUSH_MULTIPLIER = 1.18;
export const DEFAULT_PLAYER_PUSH_MULTIPLIER = 0.88;
export const DEFAULT_PLAYER_REVERSE_KICK_MULTIPLIER = 0.56;
export const DEFAULT_MAX_PARKED_IMPACT_VELOCITY_MPS = 18.5;
export const DEFAULT_MAX_PARKED_ANGULAR_VELOCITY_RADPS = 10.2;
export const DEFAULT_MAX_DAMAGE_PER_HIT = 0.78;

/**
 * Maior que antes para a batida realmente derrubar a velocidade física.
 */
export const MAX_PLAYER_REVERSE_KICK_MPS = 10.5;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

export function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

export function getDistance(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function normalizeVectorOrFallback(
  vector: HomeDriveVector2,
  fallback: HomeDriveVector2,
): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getCarForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

export function getCarRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function getCarTravelDirection(car: HomeDriveCarState): HomeDriveVector2 {
  const forward = getCarForwardVector(car.headingRad);
  const speedSign = car.speedMps >= 0 ? 1 : -1;

  return {
    x: forward.x * speedSign,
    z: forward.z * speedSign,
  };
}

export function blendImpactPushDirection(params: {
  car: HomeDriveCarState;
  normalFromVehicleToPlayer: HomeDriveVector2;
}): HomeDriveVector2 {
  const contactPushDirection = {
    x: -params.normalFromVehicleToPlayer.x,
    z: -params.normalFromVehicleToPlayer.z,
  };
  const travelDirection = getCarTravelDirection(params.car);

  return normalizeVectorOrFallback(
    {
      x: contactPushDirection.x * 0.72 + travelDirection.x * 0.28,
      z: contactPushDirection.z * 0.72 + travelDirection.z * 0.28,
    },
    contactPushDirection,
  );
}

export function getImpactDamageSide(params: {
  vehicleHeadingRad: number;
  normalFromVehicleToPlayer: HomeDriveVector2;
}): -1 | 1 {
  const right = getCarRightVector(params.vehicleHeadingRad);

  return params.normalFromVehicleToPlayer.x * right.x +
    params.normalFromVehicleToPlayer.z * right.z >=
    0
    ? 1
    : -1;
}

export function getImpactDamageLocalZ(params: {
  vehicle: HomeDriveParkedVehicleWithImpact;
  normalFromVehicleToPlayer: HomeDriveVector2;
}): number {
  const forward = getCarForwardVector(params.vehicle.headingRad);
  const longitudinalDot =
    params.normalFromVehicleToPlayer.x * forward.x +
    params.normalFromVehicleToPlayer.z * forward.z;

  return clamp(
    longitudinalDot * params.vehicle.lengthMeters * 0.44,
    -params.vehicle.lengthMeters * 0.42,
    params.vehicle.lengthMeters * 0.42,
  );
}

export function getSafeCollisionNormalFromVehicleToPlayer(
  vehiclePosition: HomeDriveVector2,
  car: HomeDriveCarState,
): HomeDriveVector2 {
  const forward = getCarForwardVector(car.headingRad);

  return normalizeVectorOrFallback(
    {
      x: car.position.x - vehiclePosition.x,
      z: car.position.z - vehiclePosition.z,
    },
    {
      x: -forward.x,
      z: -forward.z,
    },
  );
}

export function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  vehicle: HomeDriveParkedVehicleWithImpact,
  normalFromVehicleToPlayer: HomeDriveVector2,
): number {
  const carForward = getCarForwardVector(car.headingRad);
  const carVelocity = {
    x: carForward.x * car.speedMps,
    z: carForward.z * car.speedMps,
  };

  const vehicleVelocity = vehicle.impactVelocity ?? { x: 0, z: 0 };

  const relativeVelocity = {
    x: carVelocity.x - vehicleVelocity.x,
    z: carVelocity.z - vehicleVelocity.z,
  };

  const closingSpeed =
    relativeVelocity.x * -normalFromVehicleToPlayer.x +
    relativeVelocity.z * -normalFromVehicleToPlayer.z;

  return Math.max(Math.abs(car.speedMps), closingSpeed, 0);
}

export function getCollisionImpulse(params: {
  overlapMeters: number;
  relativeSpeedMps: number;
  vehicleMassKg: number;
  brutality: number;
}): number {
  const massFactor = clamp(params.vehicleMassKg / 1450, 0.72, 1.65);

  return clamp(
    (params.overlapMeters * 1.45 + params.relativeSpeedMps * 0.56) *
      massFactor *
      params.brutality,
    0.65,
    26,
  );
}
