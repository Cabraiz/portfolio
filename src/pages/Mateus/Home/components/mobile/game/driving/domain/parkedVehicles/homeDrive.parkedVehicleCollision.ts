// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicleCollision.ts

import {
  createHomeDriveImpactFromCollision,
  type HomeDriveRuntimeImpactState,
} from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleRuntimeState,
} from "./homeDrive.parkedVehicles.types";
import {
  getHomeDriveParkedVehicleCollisionRadiusMeters,
  getHomeDriveParkedVehicleImpactOffset,
  getHomeDriveParkedVehicleMassKg,
  getHomeDriveParkedVehicleRenderedPosition,
  withHomeDriveParkedVehicleImpactDefaults,
  type HomeDriveParkedVehicleWithImpact,
} from "./homeDrive.parkedVehicleImpact";
import {
  DEFAULT_PLAYER_RADIUS_METERS,
  DEFAULT_COLLISION_COOLDOWN_SECONDS,
  DEFAULT_MIN_IMPACT_SPEED_MPS,
  DEFAULT_COLLISION_BRUTALITY,
  DEFAULT_PARKED_PUSH_MULTIPLIER,
  DEFAULT_PLAYER_PUSH_MULTIPLIER,
  DEFAULT_PLAYER_REVERSE_KICK_MULTIPLIER,
  DEFAULT_MAX_PARKED_IMPACT_VELOCITY_MPS,
  DEFAULT_MAX_PARKED_ANGULAR_VELOCITY_RADPS,
  DEFAULT_MAX_DAMAGE_PER_HIT,
  getDistance,
  getSafeCollisionNormalFromVehicleToPlayer,
  getRelativeImpactSpeedMps,
  getCollisionImpulse,
} from "./homeDrive.parkedVehicleCollision.math";
import {
  shouldSkipVehicleCollision,
  resolvePlayerCarImpact,
  applyCollisionToParkedVehicle,
} from "./homeDrive.parkedVehicleCollision.impact";

export type HomeDriveParkedVehicleCollisionOptions = Readonly<{
  enabled?: boolean;
  playerRadiusMeters?: number;
  cooldownSeconds?: number;
  minImpactSpeedMps?: number;
  brutality?: number;
  parkedVehiclePushMultiplier?: number;
  playerPushMultiplier?: number;
  playerReverseKickMultiplier?: number;
  maxParkedImpactVelocityMps?: number;
  maxParkedAngularVelocityRadps?: number;
  maxDamagePerHit?: number;
}>;

export type HomeDriveParkedVehicleCollisionEvent = Readonly<{
  vehicleId: string;
  impulse: number;
  relativeSpeedMps: number;
  overlapMeters: number;
  normalFromVehicleToPlayer: HomeDriveVector2;
}>;

export type HomeDriveParkedVehicleCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  parkedVehicles: HomeDriveParkedVehicleRuntimeState;
  impact: HomeDriveRuntimeImpactState | null;
  events: readonly HomeDriveParkedVehicleCollisionEvent[];
}>;

export function resolveHomeDriveParkedVehicleCollisions(
  car: HomeDriveCarState,
  parkedVehicles: HomeDriveParkedVehicleRuntimeState,
  nowSeconds: number,
  options: HomeDriveParkedVehicleCollisionOptions = {},
): HomeDriveParkedVehicleCollisionResolution {
  if (options.enabled === false) {
    return {
      car,
      parkedVehicles,
      impact: null,
      events: [],
    };
  }

  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const cooldownSeconds =
    options.cooldownSeconds ?? DEFAULT_COLLISION_COOLDOWN_SECONDS;
  const minImpactSpeedMps =
    options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;
  const brutality = options.brutality ?? DEFAULT_COLLISION_BRUTALITY;
  const parkedVehiclePushMultiplier =
    options.parkedVehiclePushMultiplier ?? DEFAULT_PARKED_PUSH_MULTIPLIER;
  const playerPushMultiplier =
    options.playerPushMultiplier ?? DEFAULT_PLAYER_PUSH_MULTIPLIER;
  const playerReverseKickMultiplier =
    options.playerReverseKickMultiplier ??
    DEFAULT_PLAYER_REVERSE_KICK_MULTIPLIER;
  const maxParkedImpactVelocityMps =
    options.maxParkedImpactVelocityMps ?? DEFAULT_MAX_PARKED_IMPACT_VELOCITY_MPS;
  const maxParkedAngularVelocityRadps =
    options.maxParkedAngularVelocityRadps ??
    DEFAULT_MAX_PARKED_ANGULAR_VELOCITY_RADPS;
  const maxDamagePerHit = options.maxDamagePerHit ?? DEFAULT_MAX_DAMAGE_PER_HIT;

  let resolvedCar = car;
  let strongestImpact: HomeDriveRuntimeImpactState | null = null;
  const events: HomeDriveParkedVehicleCollisionEvent[] = [];

  const resolvedVehicles = parkedVehicles.vehicles.map((rawVehicle) => {
    const vehicle = withHomeDriveParkedVehicleImpactDefaults(rawVehicle);

    if (shouldSkipVehicleCollision(vehicle, nowSeconds, cooldownSeconds)) {
      return vehicle;
    }

    const renderedVehiclePosition =
      getHomeDriveParkedVehicleRenderedPosition(vehicle);
    const distance = getDistance(resolvedCar.position, renderedVehiclePosition);
    const collisionDistance =
      playerRadiusMeters +
      getHomeDriveParkedVehicleCollisionRadiusMeters(vehicle);

    if (distance >= collisionDistance) {
      return vehicle;
    }

    const normalFromVehicleToPlayer =
      getSafeCollisionNormalFromVehicleToPlayer(
        renderedVehiclePosition,
        resolvedCar,
      );
    const relativeSpeedMps = getRelativeImpactSpeedMps(
      resolvedCar,
      vehicle,
      normalFromVehicleToPlayer,
    );

    if (
      relativeSpeedMps < minImpactSpeedMps &&
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      return vehicle;
    }

    const overlapMeters = collisionDistance - distance;
    const impulse = getCollisionImpulse({
      overlapMeters,
      relativeSpeedMps,
      vehicleMassKg: getHomeDriveParkedVehicleMassKg(vehicle),
      brutality,
    });

    const carAtImpact = resolvedCar;

    events.push({
      vehicleId: vehicle.id,
      impulse,
      relativeSpeedMps,
      overlapMeters,
      normalFromVehicleToPlayer,
    });

    strongestImpact = createHomeDriveImpactFromCollision({
      car: carAtImpact,
      normal: normalFromVehicleToPlayer,
      relativeSpeedMps,
      impulse,
      occurredAt: nowSeconds,
      brutality,
    });

    resolvedCar = resolvePlayerCarImpact({
      car: carAtImpact,
      normalFromVehicleToPlayer,
      overlapMeters,
      impulse,
      playerPushMultiplier,
      reverseKickMultiplier: playerReverseKickMultiplier,
    });

    return applyCollisionToParkedVehicle({
      vehicle,
      car: carAtImpact,
      normalFromVehicleToPlayer,
      impulse,
      relativeSpeedMps,
      nowSeconds,
      pushMultiplier: parkedVehiclePushMultiplier,
      maxVelocityMps: maxParkedImpactVelocityMps,
      maxAngularVelocityRadps: maxParkedAngularVelocityRadps,
      maxDamagePerHit,
    });
  });

  return {
    car: resolvedCar,
    parkedVehicles: {
      ...parkedVehicles,
      vehicles: resolvedVehicles as readonly HomeDriveParkedVehicle[],
    },
    impact: strongestImpact,
    events,
  };
}

export function getHomeDriveParkedVehicleDebugCollisionRadius(
  vehicle: HomeDriveParkedVehicleWithImpact,
): number {
  return getHomeDriveParkedVehicleCollisionRadiusMeters(vehicle);
}

export function getHomeDriveParkedVehicleDebugRenderedPosition(
  vehicle: HomeDriveParkedVehicleWithImpact,
): HomeDriveVector2 {
  const offset = getHomeDriveParkedVehicleImpactOffset(vehicle);

  return {
    x: vehicle.position.x + offset.x,
    z: vehicle.position.z + offset.z,
  };
}

