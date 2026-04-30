// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicleImpact.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleRuntimeState,
} from "./homeDrive.parkedVehicles.types";

export type HomeDriveParkedVehicleImpactVector2 = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveParkedVehicleImpactFields = Readonly<{
  collisionRadiusMeters: number;
  massKg: number;
  damage: number;

  impactOffset: HomeDriveParkedVehicleImpactVector2;
  impactVelocity: HomeDriveParkedVehicleImpactVector2;

  visualRollRad: number;
  visualPitchRad: number;
  visualYawOffsetRad: number;
  impactAngularVelocityRadps: number;

  lastCollisionAt: number;
}>;

export type HomeDriveParkedVehicleWithImpact = HomeDriveParkedVehicle &
  Partial<HomeDriveParkedVehicleImpactFields>;

export type HomeDriveParkedVehicleImpactTickOptions = Readonly<{
  maxDeltaSeconds?: number;
  offsetDecayPerSecond?: number;
  velocityDecayPerSecond?: number;
  rotationDecayPerSecond?: number;
  angularDecayPerSecond?: number;
  maxImpactOffsetMeters?: number;
}>;

const DEFAULT_OFFSET_DECAY_PER_SECOND = 3.35;
const DEFAULT_VELOCITY_DECAY_PER_SECOND = 4.8;
const DEFAULT_ROTATION_DECAY_PER_SECOND = 5.25;
const DEFAULT_ANGULAR_DECAY_PER_SECOND = 4.7;
const DEFAULT_MAX_DELTA_SECONDS = 1 / 18;
const DEFAULT_MAX_IMPACT_OFFSET_METERS = 2.6;

const MIN_ACTIVE_VECTOR_MAGNITUDE = 0.0001;
const MIN_ACTIVE_SCALAR_MAGNITUDE = 0.0001;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function damp(value: number, decayPerSecond: number, deltaSeconds: number): number {
  const nextValue = value * Math.exp(-decayPerSecond * deltaSeconds);

  return Math.abs(nextValue) <= MIN_ACTIVE_SCALAR_MAGNITUDE ? 0 : nextValue;
}

function dampVector(
  vector: HomeDriveParkedVehicleImpactVector2,
  decayPerSecond: number,
  deltaSeconds: number,
): HomeDriveParkedVehicleImpactVector2 {
  const nextVector = {
    x: damp(vector.x, decayPerSecond, deltaSeconds),
    z: damp(vector.z, decayPerSecond, deltaSeconds),
  };

  const magnitude = Math.hypot(nextVector.x, nextVector.z);

  if (magnitude <= MIN_ACTIVE_VECTOR_MAGNITUDE) {
    return {
      x: 0,
      z: 0,
    };
  }

  return nextVector;
}

function clampVectorMagnitude(
  vector: HomeDriveParkedVehicleImpactVector2,
  maxMagnitude: number,
): HomeDriveParkedVehicleImpactVector2 {
  const magnitude = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(magnitude) || magnitude <= maxMagnitude || magnitude <= 0) {
    return vector;
  }

  const ratio = maxMagnitude / magnitude;

  return {
    x: vector.x * ratio,
    z: vector.z * ratio,
  };
}

function getFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getFiniteVector(
  value: unknown,
  fallback: HomeDriveParkedVehicleImpactVector2 = { x: 0, z: 0 },
): HomeDriveParkedVehicleImpactVector2 {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const vector = value as Partial<HomeDriveVector2>;

  return {
    x: getFiniteNumber(vector.x, fallback.x),
    z: getFiniteNumber(vector.z, fallback.z),
  };
}

export function getHomeDriveParkedVehicleCollisionRadiusMeters(
  vehicle: HomeDriveParkedVehicleWithImpact,
): number {
  if (
    Number.isFinite(vehicle.collisionRadiusMeters) &&
    Number(vehicle.collisionRadiusMeters) > 0
  ) {
    return Number(vehicle.collisionRadiusMeters);
  }

  const width = Math.max(1.2, vehicle.widthMeters);
  const length = Math.max(2.2, vehicle.lengthMeters);

  return clamp(Math.hypot(width * 0.46, length * 0.28), 1.25, 3.65);
}

export function getHomeDriveParkedVehicleMassKg(
  vehicle: HomeDriveParkedVehicleWithImpact,
): number {
  if (Number.isFinite(vehicle.massKg) && Number(vehicle.massKg) > 0) {
    return Number(vehicle.massKg);
  }

  const footprint = Math.max(1, vehicle.widthMeters * vehicle.lengthMeters);
  const heightFactor = clamp(vehicle.heightMeters / 1.7, 0.78, 1.45);

  return clamp(780 + footprint * 58 * heightFactor, 860, 2450);
}

export function getHomeDriveParkedVehicleDamage(
  vehicle: HomeDriveParkedVehicleWithImpact,
): number {
  return clamp(getFiniteNumber(vehicle.damage, 0), 0, 1);
}

export function getHomeDriveParkedVehicleImpactOffset(
  vehicle: HomeDriveParkedVehicleWithImpact,
): HomeDriveParkedVehicleImpactVector2 {
  return getFiniteVector(vehicle.impactOffset);
}

export function getHomeDriveParkedVehicleImpactVelocity(
  vehicle: HomeDriveParkedVehicleWithImpact,
): HomeDriveParkedVehicleImpactVector2 {
  return getFiniteVector(vehicle.impactVelocity);
}

export function withHomeDriveParkedVehicleImpactDefaults(
  vehicle: HomeDriveParkedVehicleWithImpact,
): HomeDriveParkedVehicleWithImpact & HomeDriveParkedVehicleImpactFields {
  return {
    ...vehicle,
    collisionRadiusMeters: getHomeDriveParkedVehicleCollisionRadiusMeters(vehicle),
    massKg: getHomeDriveParkedVehicleMassKg(vehicle),
    damage: getHomeDriveParkedVehicleDamage(vehicle),
    impactOffset: getHomeDriveParkedVehicleImpactOffset(vehicle),
    impactVelocity: getHomeDriveParkedVehicleImpactVelocity(vehicle),
    visualRollRad: getFiniteNumber(vehicle.visualRollRad, 0),
    visualPitchRad: getFiniteNumber(vehicle.visualPitchRad, 0),
    visualYawOffsetRad: getFiniteNumber(vehicle.visualYawOffsetRad, 0),
    impactAngularVelocityRadps: getFiniteNumber(
      vehicle.impactAngularVelocityRadps,
      0,
    ),
    lastCollisionAt: getFiniteNumber(vehicle.lastCollisionAt, -999),
  };
}

export function getHomeDriveParkedVehicleRenderedPosition(
  vehicle: HomeDriveParkedVehicleWithImpact,
): HomeDriveParkedVehicleImpactVector2 {
  const offset = getHomeDriveParkedVehicleImpactOffset(vehicle);

  return {
    x: vehicle.position.x + offset.x,
    z: vehicle.position.z + offset.z,
  };
}

export function tickHomeDriveParkedVehicleImpact(
  vehicle: HomeDriveParkedVehicleWithImpact,
  rawDeltaSeconds: number,
  options: HomeDriveParkedVehicleImpactTickOptions = {},
): HomeDriveParkedVehicleWithImpact {
  const deltaSeconds = clamp(
    rawDeltaSeconds,
    0,
    options.maxDeltaSeconds ?? DEFAULT_MAX_DELTA_SECONDS,
  );

  if (deltaSeconds <= 0) {
    return withHomeDriveParkedVehicleImpactDefaults(vehicle);
  }

  const resolvedVehicle = withHomeDriveParkedVehicleImpactDefaults(vehicle);

  const velocityDecayPerSecond =
    options.velocityDecayPerSecond ?? DEFAULT_VELOCITY_DECAY_PER_SECOND;
  const offsetDecayPerSecond =
    options.offsetDecayPerSecond ?? DEFAULT_OFFSET_DECAY_PER_SECOND;
  const rotationDecayPerSecond =
    options.rotationDecayPerSecond ?? DEFAULT_ROTATION_DECAY_PER_SECOND;
  const angularDecayPerSecond =
    options.angularDecayPerSecond ?? DEFAULT_ANGULAR_DECAY_PER_SECOND;
  const maxImpactOffsetMeters =
    options.maxImpactOffsetMeters ?? DEFAULT_MAX_IMPACT_OFFSET_METERS;

  const decayedVelocity = dampVector(
    resolvedVehicle.impactVelocity,
    velocityDecayPerSecond,
    deltaSeconds,
  );

  const nextOffsetBeforeDecay = clampVectorMagnitude(
    {
      x: resolvedVehicle.impactOffset.x + decayedVelocity.x * deltaSeconds,
      z: resolvedVehicle.impactOffset.z + decayedVelocity.z * deltaSeconds,
    },
    maxImpactOffsetMeters,
  );

  const nextOffset = clampVectorMagnitude(
    dampVector(nextOffsetBeforeDecay, offsetDecayPerSecond, deltaSeconds),
    maxImpactOffsetMeters,
  );

  const impactMagnitude = Math.hypot(decayedVelocity.x, decayedVelocity.z);

  const nextAngularVelocity = damp(
    resolvedVehicle.impactAngularVelocityRadps,
    angularDecayPerSecond,
    deltaSeconds,
  );

  const nextYaw = damp(
    resolvedVehicle.visualYawOffsetRad + nextAngularVelocity * deltaSeconds,
    rotationDecayPerSecond,
    deltaSeconds,
  );

  const lateralSign =
    Math.sign(decayedVelocity.x * Math.cos(vehicle.headingRad)) ||
    Math.sign(decayedVelocity.z * Math.sin(vehicle.headingRad)) ||
    1;

  const nextRoll = damp(
    resolvedVehicle.visualRollRad +
      lateralSign * clamp(impactMagnitude * 0.012, -0.18, 0.18),
    rotationDecayPerSecond,
    deltaSeconds,
  );

  const nextPitch = damp(
    resolvedVehicle.visualPitchRad + clamp(impactMagnitude * 0.008, -0.14, 0.14),
    rotationDecayPerSecond,
    deltaSeconds,
  );

  return {
    ...resolvedVehicle,
    impactOffset: nextOffset,
    impactVelocity: decayedVelocity,
    visualRollRad: nextRoll,
    visualPitchRad: nextPitch,
    visualYawOffsetRad: nextYaw,
    impactAngularVelocityRadps: nextAngularVelocity,
  };
}

export function tickHomeDriveParkedVehicleImpactState(
  state: HomeDriveParkedVehicleRuntimeState,
  deltaSeconds: number,
  options: HomeDriveParkedVehicleImpactTickOptions = {},
): HomeDriveParkedVehicleRuntimeState {
  return {
    ...state,
    vehicles: state.vehicles.map((vehicle) =>
      tickHomeDriveParkedVehicleImpact(vehicle, deltaSeconds, options),
    ),
  };
}
