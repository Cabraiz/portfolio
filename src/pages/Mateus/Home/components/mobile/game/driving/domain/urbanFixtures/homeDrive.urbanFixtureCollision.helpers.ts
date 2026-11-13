// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtureCollision.helpers.ts

import { createHomeDriveImpactFromCollision } from "../homeDrive.impact";
import type { HomeDriveRuntimeImpactState } from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveUrbanFixtureCollisionKind,
  HomeDriveUrbanFixtureCollisionOptions,
} from "./homeDrive.urbanFixtureCollision.types";

export const DEFAULT_PLAYER_RADIUS_METERS = 1.68;
export const DEFAULT_STREET_LIGHT_RADIUS_METERS = 0.72;
export const DEFAULT_TRAFFIC_LIGHT_RADIUS_METERS = 0.88;
export const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.68;
export const DEFAULT_MAX_CANDIDATE_RADIUS_METERS = 18;
export const DEFAULT_MAX_IMPACTS_PER_STEP = 1;
export const DEFAULT_MAX_TRACKED_IMPACTS = 360;
export const DEFAULT_BRUTALITY = 1.56;
export const DEFAULT_PLAYER_PUSH_MULTIPLIER = 0.82;
export const DEFAULT_REVERSE_KICK_MULTIPLIER = 0.055;
export const DEFAULT_MAX_REVERSE_KICK_MPS = 1.15;
export const DEFAULT_STREET_LIGHT_LEAN_MULTIPLIER = 1.04;
export const DEFAULT_TRAFFIC_LIGHT_LEAN_MULTIPLIER = 1.18;
export const DEFAULT_STREET_LIGHT_MIN_FALL_RAD = 0.92;
export const DEFAULT_TRAFFIC_LIGHT_MIN_FALL_RAD = 1.02;
export const DEFAULT_STREET_LIGHT_MAX_FALL_RAD = 1.38;
export const DEFAULT_TRAFFIC_LIGHT_MAX_FALL_RAD = 1.48;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

export function getDistanceSq(first: HomeDriveVector2, second: HomeDriveVector2): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

export function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

export function getRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

export function normalizeVectorOrFallback(
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

export function getFixtureCollisionRadiusMeters(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
  options: Required<
    Pick<
      HomeDriveUrbanFixtureCollisionOptions,
      "streetLightRadiusMeters" | "trafficLightRadiusMeters"
    >
  >,
): number {
  return fixtureKind === "traffic-light"
    ? options.trafficLightRadiusMeters
    : options.streetLightRadiusMeters;
}

function getFixtureMassFactor(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
): number {
  return fixtureKind === "traffic-light" ? 1.22 : 0.92;
}

export function getFixtureLeanMultiplier(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
  options: Required<
    Pick<
      HomeDriveUrbanFixtureCollisionOptions,
      "streetLightLeanMultiplier" | "trafficLightLeanMultiplier"
    >
  >,
): number {
  return fixtureKind === "traffic-light"
    ? options.trafficLightLeanMultiplier
    : options.streetLightLeanMultiplier;
}

export function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  normalFromFixtureToPlayer: HomeDriveVector2,
): number {
  const forward = getForwardVector(car.headingRad);
  const velocity = {
    x: forward.x * car.speedMps,
    z: forward.z * car.speedMps,
  };
  const closingSpeed =
    velocity.x * -normalFromFixtureToPlayer.x +
    velocity.z * -normalFromFixtureToPlayer.z;

  return Math.max(Math.abs(car.speedMps), closingSpeed, 0);
}

export function getCollisionImpulse(params: {
  fixtureKind: HomeDriveUrbanFixtureCollisionKind;
  overlapMeters: number;
  relativeSpeedMps: number;
  brutality: number;
}): number {
  return clamp(
    (params.overlapMeters * 2.1 + params.relativeSpeedMps * 0.74) *
      getFixtureMassFactor(params.fixtureKind) *
      params.brutality,
    2.2,
    34,
  );
}

export function createStableUrbanFixtureCarImpact(params: Readonly<{
  car: HomeDriveCarState;
  normalFromFixtureToPlayer: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  occurredAt: number;
  brutality: number;
}>): HomeDriveRuntimeImpactState {
  const baseImpact = createHomeDriveImpactFromCollision({
    car: params.car,
    normal: params.normalFromFixtureToPlayer,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    occurredAt: params.occurredAt,
    brutality: params.brutality,
  });

  const speed = Math.max(0, Math.abs(params.relativeSpeedMps));
  const recoilStrength = clamp(
    (1.8 + speed * 0.16 + params.impulse * 0.065) * params.brutality,
    1.8,
    9.6,
  );

  return {
    ...baseImpact,
    recoilVelocity: {
      x: params.normalFromFixtureToPlayer.x * recoilStrength,
      z: params.normalFromFixtureToPlayer.z * recoilStrength,
    },
    spinVelocityRadps: 0,
    visualRollRad: 0,
    visualPitchRad: clamp(baseImpact.visualPitchRad * 0.42, -0.28, 0.28),
    cameraShake: clamp(baseImpact.cameraShake * 0.72, 0.16, 1.35),
    collisionImpulse: clamp(baseImpact.collisionImpulse * 0.92, 0, 36),
    controlLockSeconds: clamp(baseImpact.controlLockSeconds * 0.88, 0.42, 1.28),
  };
}

export function resolvePlayerFixtureImpact(params: {
  car: HomeDriveCarState;
  normalFromFixtureToPlayer: HomeDriveVector2;
  overlapMeters: number;
  impulse: number;
  relativeSpeedMps: number;
  playerPushMultiplier: number;
  reverseKickMultiplier: number;
  maxReverseKickMps: number;
}): HomeDriveCarState {
  const severity = clamp(params.relativeSpeedMps / 24 + params.impulse / 58, 0, 1);
  const pushDistance = clamp(
    params.overlapMeters * params.playerPushMultiplier + params.impulse * 0.018,
    0.12,
    0.74,
  );
  const retainedForwardSpeedMps = Math.max(0, params.car.speedMps) * lerp(0.055, 0.006, severity);
  const reverseKickMps = clamp(
    Math.abs(params.car.speedMps) * params.reverseKickMultiplier +
      params.impulse * 0.028,
    0,
    params.maxReverseKickMps,
  );
  const nextSpeedMps =
    params.car.speedMps >= 0
      ? -reverseKickMps
      : Math.min(0, params.car.speedMps * 0.22);

  return {
    ...params.car,
    position: {
      x:
        params.car.position.x +
        params.normalFromFixtureToPlayer.x * pushDistance,
      z:
        params.car.position.z +
        params.normalFromFixtureToPlayer.z * pushDistance,
    },
    speedMps: clamp(
      nextSpeedMps,
      -params.maxReverseKickMps,
      retainedForwardSpeedMps,
    ),
    steerAngleRad: 0,
  };
}
