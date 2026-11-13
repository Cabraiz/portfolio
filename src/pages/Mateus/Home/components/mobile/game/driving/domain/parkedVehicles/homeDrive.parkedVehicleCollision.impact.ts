// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicleCollision.impact.ts

import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import {
  getHomeDriveParkedVehicleMassKg,
  withHomeDriveParkedVehicleImpactDefaults,
} from "./homeDrive.parkedVehicleImpact";
import type {
  HomeDriveParkedVehicleWithImpact,
} from "./homeDrive.parkedVehicleImpact";
import {
  clamp,
  MAX_PLAYER_REVERSE_KICK_MPS,
  lerp,
  blendImpactPushDirection,
  getCarRightVector,
  getImpactDamageSide,
  getImpactDamageLocalZ,
  clampAbs,
} from "./homeDrive.parkedVehicleCollision.math";

export function resolvePlayerCarImpact(params: {
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

export function applyCollisionToParkedVehicle(params: {
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

export function shouldSkipVehicleCollision(
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
