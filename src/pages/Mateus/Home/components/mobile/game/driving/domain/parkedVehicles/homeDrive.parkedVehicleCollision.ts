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

const DEFAULT_PLAYER_RADIUS_METERS = 1.52;
const DEFAULT_COLLISION_COOLDOWN_SECONDS = 0.34;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 1.25;
const DEFAULT_COLLISION_BRUTALITY = 1.58;
const DEFAULT_PARKED_PUSH_MULTIPLIER = 1.18;
const DEFAULT_PLAYER_PUSH_MULTIPLIER = 0.88;
const DEFAULT_PLAYER_REVERSE_KICK_MULTIPLIER = 0.56;
const DEFAULT_MAX_PARKED_IMPACT_VELOCITY_MPS = 18.5;
const DEFAULT_MAX_PARKED_ANGULAR_VELOCITY_RADPS = 10.2;
const DEFAULT_MAX_DAMAGE_PER_HIT = 0.78;

/**
 * Maior que antes para a batida realmente derrubar a velocidade física.
 */
const MAX_PLAYER_REVERSE_KICK_MPS = 10.5;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

function getDistance(
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

function getCarRightVector(headingRad: number): HomeDriveVector2 {
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

function blendImpactPushDirection(params: {
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

function getImpactDamageSide(params: {
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

function getImpactDamageLocalZ(params: {
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

function getSafeCollisionNormalFromVehicleToPlayer(
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

function getRelativeImpactSpeedMps(
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

function getCollisionImpulse(params: {
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

function resolvePlayerCarImpact(params: {
  car: HomeDriveCarState;
  normalFromVehicleToPlayer: HomeDriveVector2;
  overlapMeters: number;
  impulse: number;
  playerPushMultiplier: number;
  reverseKickMultiplier: number;
}): HomeDriveCarState {
  const impactSeverity = clamp(params.impulse / 26, 0, 1);

  const pushDistance = clamp(
    params.overlapMeters * params.playerPushMultiplier + params.impulse * 0.045,
    0.18,
    4.25,
  );

  const reverseKick = clamp(
    Math.abs(params.car.speedMps) * params.reverseKickMultiplier +
      params.impulse * 0.34,
    2.2,
    MAX_PLAYER_REVERSE_KICK_MPS,
  );

  const forwardSpeedMps = Math.max(0, params.car.speedMps);

  /**
   * Antes mantinha 18% -> 2% da velocidade frontal.
   * Agora mantém 8% -> 0%.
   *
   * Em colisão forte, a velocidade frontal praticamente some.
   */
  const retainedForwardSpeedMps =
    forwardSpeedMps * lerp(0.08, 0, impactSeverity);

  const nextSpeedMps =
    params.car.speedMps >= 0
      ? -reverseKick
      : Math.min(params.car.speedMps * 0.38, -retainedForwardSpeedMps);

  return {
    ...params.car,
    position: {
      x:
        params.car.position.x +
        params.normalFromVehicleToPlayer.x * pushDistance,
      z:
        params.car.position.z +
        params.normalFromVehicleToPlayer.z * pushDistance,
    },
    speedMps: clamp(
      nextSpeedMps,
      -MAX_PLAYER_REVERSE_KICK_MPS,
      retainedForwardSpeedMps,
    ),
    steerAngleRad: params.car.steerAngleRad * 0.18,
  };
}

function applyCollisionToParkedVehicle(params: {
  vehicle: HomeDriveParkedVehicleWithImpact;
  car: HomeDriveCarState;
  normalFromVehicleToPlayer: HomeDriveVector2;
  impulse: number;
  relativeSpeedMps: number;
  nowSeconds: number;
  pushMultiplier: number;
  maxVelocityMps: number;
  maxAngularVelocityRadps: number;
  maxDamagePerHit: number;
}): HomeDriveParkedVehicleWithImpact {
  const vehicle = withHomeDriveParkedVehicleImpactDefaults(params.vehicle);
  const massKg = getHomeDriveParkedVehicleMassKg(vehicle);
  const inverseMassFactor = clamp(1450 / massKg, 0.42, 1.42);

  const pushDirection = blendImpactPushDirection({
    car: params.car,
    normalFromVehicleToPlayer: params.normalFromVehicleToPlayer,
  });

  const impactVelocityMps = clamp(
    params.impulse * 0.48 * params.pushMultiplier * inverseMassFactor,
    0,
    params.maxVelocityMps,
  );

  const right = getCarRightVector(vehicle.headingRad);
  const sideHit =
    pushDirection.x * right.x + pushDirection.z * right.z >= 0 ? 1 : -1;
  const damageSide = getImpactDamageSide({
    vehicleHeadingRad: vehicle.headingRad,
    normalFromVehicleToPlayer: params.normalFromVehicleToPlayer,
  });
  const damageLocalZ = getImpactDamageLocalZ({
    vehicle,
    normalFromVehicleToPlayer: params.normalFromVehicleToPlayer,
  });

  const angularKick = clampAbs(
    sideHit * params.impulse * 0.34 * inverseMassFactor,
    params.maxAngularVelocityRadps,
  );

  const damageDelta = clamp(
    0.34 + (params.impulse / 26) * 0.34 + params.relativeSpeedMps * 0.014,
    0.34,
    params.maxDamagePerHit,
  );

  const nextDamage = clamp(Math.max(vehicle.damage ?? 0, damageDelta), 0, 1);

  return {
    ...vehicle,
    damage: nextDamage,
    hasBeenHit: true,
    damageSide,
    damageLocalZ,
    impactVelocity: {
      x: clampAbs(
        pushDirection.x * impactVelocityMps,
        params.maxVelocityMps,
      ),
      z: clampAbs(
        pushDirection.z * impactVelocityMps,
        params.maxVelocityMps,
      ),
    },
    impactOffset: {
      x:
        vehicle.impactOffset.x +
        pushDirection.x * clamp(params.impulse * 0.052, 0.42, 1.18),
      z:
        vehicle.impactOffset.z +
        pushDirection.z * clamp(params.impulse * 0.052, 0.42, 1.18),
    },
    visualRollRad: clampAbs(
      vehicle.visualRollRad + sideHit * params.impulse * 0.014,
      0.48,
    ),
    visualPitchRad: clampAbs(
      vehicle.visualPitchRad + params.impulse * 0.009,
      0.36,
    ),
    visualYawOffsetRad: clampAbs(
      vehicle.visualYawOffsetRad + angularKick * 0.032,
      0.58,
    ),
    impactAngularVelocityRadps: clampAbs(
      vehicle.impactAngularVelocityRadps + angularKick,
      params.maxAngularVelocityRadps,
    ),
    lastCollisionAt: params.nowSeconds,
  };
}

function shouldSkipVehicleCollision(
  vehicle: HomeDriveParkedVehicleWithImpact,
  nowSeconds: number,
  cooldownSeconds: number,
): boolean {
  if (vehicle.hasBeenHit === true || (vehicle.damage ?? 0) >= 0.99) {
    return true;
  }

  const lastCollisionAt =
    typeof vehicle.lastCollisionAt === "number" &&
    Number.isFinite(vehicle.lastCollisionAt)
      ? vehicle.lastCollisionAt
      : -999;

  return nowSeconds - lastCollisionAt < cooldownSeconds;
}

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


