// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.collision.ts

import {
  createHomeDriveImpactFromCollision,
  mergeHomeDriveImpactStates,
  type HomeDriveRuntimeImpactState,
} from "./homeDrive.impact";
import type {
  HomeDriveCarState,
  HomeDriveVector2,
} from "./homeDrive.types";
import type {
  HomeDriveTrafficCollisionEvent,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";

export type HomeDriveTrafficCollisionOptions = Readonly<{
  playerRadiusMeters?: number;
  cooldownSeconds?: number;
  minImpactSpeedMps?: number;
  brutality?: number;

  /**
   * Raio amplo de pré-filtro. Mantém colisão exata perto do player e evita
   * testar carros frios do outro lado do mapa.
   */
  maxCandidateRadiusMeters?: number;
}>;

export type HomeDriveTrafficCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  traffic: HomeDriveTrafficRuntimeState;
  events: readonly HomeDriveTrafficCollisionEvent[];
  cameraShake: number;
  collisionImpulse: number;
  impact: HomeDriveRuntimeImpactState | null;
}>;

const DEFAULT_PLAYER_RADIUS_METERS = 1.62;
const DEFAULT_COLLISION_COOLDOWN_SECONDS = 0.34;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.85;
const DEFAULT_COLLISION_BRUTALITY = 1.55;

const MAX_VEHICLE_IMPACT_OFFSET_METERS = 4.8;
const MAX_VEHICLE_IMPACT_VELOCITY_MPS = 30;
const MAX_VEHICLE_ANGULAR_VELOCITY_RADPS = 11;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

function getDistance(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function clampVectorMagnitude(
  vector: Readonly<{ x: number; z: number }>,
  maxMagnitude: number,
): Readonly<{ x: number; z: number }> {
  const magnitude = Math.hypot(vector.x, vector.z);

  if (magnitude <= maxMagnitude || magnitude <= 0.000001) {
    return vector;
  }

  const scale = maxMagnitude / magnitude;

  return {
    x: vector.x * scale,
    z: vector.z * scale,
  };
}

function getSafeNormal(
  from: HomeDriveVector2,
  to: HomeDriveVector2,
  fallbackHeadingRad: number,
): Readonly<{ x: number; z: number }> {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= 0.000001) {
    return {
      x: -Math.sin(fallbackHeadingRad),
      z: -Math.cos(fallbackHeadingRad),
    };
  }

  return {
    x: dx / distance,
    z: dz / distance,
  };
}

function getHeadingForwardVector(headingRad: number): Readonly<{
  x: number;
  z: number;
}> {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getHeadingRightVector(headingRad: number): Readonly<{
  x: number;
  z: number;
}> {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function dot(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return first.x * second.x + first.z * second.z;
}

function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  vehicle: HomeDriveTrafficVehicle,
): number {
  const playerSpeed = Math.abs(car.speedMps);
  const npcSpeed = Math.abs(vehicle.speedMps);

  return Math.max(Math.abs(car.speedMps - vehicle.speedMps), playerSpeed * 0.85, npcSpeed * 0.32);
}

function createCollisionEvent(
  car: HomeDriveCarState,
  vehicle: HomeDriveTrafficVehicle,
  normal: Readonly<{ x: number; z: number }>,
  impulse: number,
  occurredAt: number,
): HomeDriveTrafficCollisionEvent {
  return {
    id: `collision-${vehicle.id}-${Math.round(occurredAt * 1000)}`,
    vehicleId: vehicle.id,
    position: {
      x: (car.position.x + vehicle.position.x) / 2,
      z: (car.position.z + vehicle.position.z) / 2,
    },
    normal,
    relativeSpeedMps: getRelativeImpactSpeedMps(car, vehicle),
    impulse,
    occurredAt,
  };
}

function resolveVehicleImpact(
  vehicle: HomeDriveTrafficVehicle,
  normalFromVehicleToPlayer: Readonly<{ x: number; z: number }>,
  impulse: number,
  occurredAt: number,
): HomeDriveTrafficVehicle {
  const right = getHeadingRightVector(vehicle.headingRad);
  const forward = getHeadingForwardVector(vehicle.headingRad);
  const sideDot = dot(normalFromVehicleToPlayer, right);
  const frontDot = dot(normalFromVehicleToPlayer, forward);
  const spinSign = Math.abs(sideDot) > 0.08 ? Math.sign(sideDot) : Math.sign(normalFromVehicleToPlayer.x + normalFromVehicleToPlayer.z) || 1;

  const nextImpactOffset = clampVectorMagnitude(
    {
      x:
        vehicle.impactOffset.x -
        normalFromVehicleToPlayer.x * impulse * 0.22,
      z:
        vehicle.impactOffset.z -
        normalFromVehicleToPlayer.z * impulse * 0.22,
    },
    MAX_VEHICLE_IMPACT_OFFSET_METERS,
  );

  const nextImpactVelocity = clampVectorMagnitude(
    {
      x:
        vehicle.impactVelocity.x -
        normalFromVehicleToPlayer.x * impulse * 3.7,
      z:
        vehicle.impactVelocity.z -
        normalFromVehicleToPlayer.z * impulse * 3.7,
    },
    MAX_VEHICLE_IMPACT_VELOCITY_MPS,
  );

  return {
    ...vehicle,

    /*
      Intencional: colisão não reduz cruiseSpeedMps.
      O bug dos NPCs parados vinha daqui: cada encostada degradava
      a velocidade real usada pelo roteador.
    */
    damage: clamp(vehicle.damage + impulse * 0.16, 0, 1),
    speedMps: Math.max(vehicle.speedMps * 0.72, vehicle.cruiseSpeedMps * 0.48),
    impactOffset: nextImpactOffset,
    impactVelocity: nextImpactVelocity,
    visualRollRad: clampAbs(vehicle.visualRollRad - spinSign * impulse * 0.06, 0.78),
    visualPitchRad: clampAbs(vehicle.visualPitchRad - frontDot * impulse * 0.045, 0.46),
    visualYawOffsetRad: clampAbs(vehicle.visualYawOffsetRad + spinSign * impulse * 0.035, 0.42),
    impactAngularVelocityRadps: clampAbs(
      vehicle.impactAngularVelocityRadps + spinSign * impulse * 0.9,
      MAX_VEHICLE_ANGULAR_VELOCITY_RADPS,
    ),
    lastCollisionAt: occurredAt,
  };
}

function resolvePlayerImpact(
  car: HomeDriveCarState,
  normalFromVehicleToPlayer: Readonly<{ x: number; z: number }>,
  overlapMeters: number,
  impulse: number,
): HomeDriveCarState {
  const pushDistance = Math.min(5.2, overlapMeters * 0.86 + impulse * 0.14);
  const reverseKick = Math.min(14, Math.max(3.2, Math.abs(car.speedMps) * 0.38 + impulse * 0.44));

  return {
    ...car,
    position: {
      x: car.position.x + normalFromVehicleToPlayer.x * pushDistance,
      z: car.position.z + normalFromVehicleToPlayer.z * pushDistance,
    },
    speedMps: car.speedMps >= 0 ? -reverseKick : car.speedMps * 0.42,
    steerAngleRad: car.steerAngleRad * 0.18,
  };
}

export function resolveHomeDriveTrafficCollisions(
  car: HomeDriveCarState,
  traffic: HomeDriveTrafficRuntimeState,
  nowSeconds: number,
  options: HomeDriveTrafficCollisionOptions = {},
): HomeDriveTrafficCollisionResolution {
  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const cooldownSeconds =
    options.cooldownSeconds ?? DEFAULT_COLLISION_COOLDOWN_SECONDS;
  const minImpactSpeedMps =
    options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;
  const brutality = options.brutality ?? DEFAULT_COLLISION_BRUTALITY;
  const maxCandidateRadiusMeters = Math.max(
    playerRadiusMeters + 8,
    options.maxCandidateRadiusMeters ?? 64,
  );

  let resolvedCar = car;
  let maxImpulse = 0;
  let mergedImpact: HomeDriveRuntimeImpactState | null = null;
  const events: HomeDriveTrafficCollisionEvent[] = [];

  let resolvedVehicles: HomeDriveTrafficVehicle[] | null = null;

  traffic.vehicles.forEach((vehicle, vehicleIndex) => {
    if (nowSeconds - vehicle.lastCollisionAt < cooldownSeconds) {
      return;
    }

    const distance = getDistance(resolvedCar.position, vehicle.position);

    if (distance > maxCandidateRadiusMeters + vehicle.collisionRadiusMeters) {
      return;
    }

    const collisionDistance =
      playerRadiusMeters + vehicle.collisionRadiusMeters;

    if (distance >= collisionDistance) {
      return;
    }

    const relativeSpeedMps = getRelativeImpactSpeedMps(resolvedCar, vehicle);

    if (
      relativeSpeedMps < minImpactSpeedMps &&
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      return;
    }

    const overlapMeters = collisionDistance - distance;
    const normal = getSafeNormal(
      vehicle.position,
      resolvedCar.position,
      resolvedCar.headingRad,
    );

    const impulse = clamp(
      overlapMeters * 1.55 + relativeSpeedMps * 0.46,
      0.85,
      18.5,
    );

    maxImpulse = Math.max(maxImpulse, impulse);

    const event = createCollisionEvent(
      resolvedCar,
      vehicle,
      normal,
      impulse,
      nowSeconds,
    );

    events.push(event);

    mergedImpact = mergeHomeDriveImpactStates(
      mergedImpact,
      createHomeDriveImpactFromCollision({
        car: resolvedCar,
        normal,
        relativeSpeedMps,
        impulse,
        occurredAt: nowSeconds,
        brutality,
      }),
    );

    resolvedCar = resolvePlayerImpact(
      resolvedCar,
      normal,
      overlapMeters,
      impulse,
    );

    if (!resolvedVehicles) {
      resolvedVehicles = traffic.vehicles.slice();
    }

    resolvedVehicles[vehicleIndex] = resolveVehicleImpact(
      vehicle,
      normal,
      impulse,
      nowSeconds,
    );
  });

  const nextTraffic = events.length > 0
    ? {
        ...traffic,
        vehicles: resolvedVehicles ?? traffic.vehicles,
        lastCollisionAt: nowSeconds,
      }
    : traffic;

  return {
    car: resolvedCar,
    traffic: nextTraffic,
    events,
    cameraShake: clamp(maxImpulse * 0.17, 0, 1.75),
    collisionImpulse: maxImpulse,
    impact: mergedImpact,
  };
}

export function hasHomeDriveTrafficCollision(
  car: HomeDriveCarState,
  traffic: HomeDriveTrafficRuntimeState,
  options: HomeDriveTrafficCollisionOptions = {},
): boolean {
  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const maxCandidateRadiusMeters = Math.max(
    playerRadiusMeters + 8,
    options.maxCandidateRadiusMeters ?? 64,
  );

  return traffic.vehicles.some((vehicle) => {
    const distance = getDistance(car.position, vehicle.position);

    if (distance > maxCandidateRadiusMeters + vehicle.collisionRadiusMeters) {
      return false;
    }

    return distance < playerRadiusMeters + vehicle.collisionRadiusMeters;
  });
}
