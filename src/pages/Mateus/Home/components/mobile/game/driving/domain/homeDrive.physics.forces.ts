// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.physics.forces.ts
// Recuperação pós-impacto, arrasto e perda de velocidade em curva.

import {
  FREE_DRIVE_ACCELERATION_MPS2,
  FREE_DRIVE_BRAKE_MPS2,
  FREE_DRIVE_CORNERING_DRAG_MPS2,
  FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS,
  FREE_DRIVE_CORNERING_SPEED_EXPONENT,
  FREE_DRIVE_CORNERING_STEER_EXPONENT,
  FREE_DRIVE_IMPACT_RECOVERY_ACCELERATION_MULTIPLIER,
  FREE_DRIVE_MAX_SPEED_MPS,
  FREE_DRIVE_MAX_STEER_ANGLE_DEG,
  FREE_DRIVE_NATURAL_DRAG_MPS2,
  FREE_DRIVE_POST_IMPACT_BRAKE_MPS2,
  FREE_DRIVE_POST_IMPACT_DRAG_MPS2,
  FREE_DRIVE_POST_IMPACT_FULL_LOCK_SECONDS,
  FREE_DRIVE_POST_IMPACT_MAX_SPEED_CAP_MPS,
  FREE_DRIVE_POST_IMPACT_MIN_ACCELERATION_FACTOR,
  FREE_DRIVE_POST_IMPACT_MIN_SPEED_CAP_MPS,
  FREE_DRIVE_POST_IMPACT_MIN_THROTTLE_FACTOR,
  FREE_DRIVE_POST_IMPACT_RECOVERY_SECONDS,
  FREE_DRIVE_REVERSE_RECOVERY_ACCELERATION_MULTIPLIER,
} from "./homeDrive.constants";
import { getHomeDriveImpactIntensity } from "./homeDrive.impact";
import type { HomeDriveRuntimeImpactState } from "./homeDrive.impact";
import { clamp, degToRad, lerp, moveTowards } from "./homeDrive.math";

type HomeDrivePostImpactDriveRecovery = Readonly<{
  recoveryRatio: number;
  throttleFactor: number;
  accelerationFactor: number;
  speedCapMps: number;
  extraDragMps2: number;
  extraBrakeMps2: number;
}>;

export function getHomeDrivePostImpactDriveRecovery(
  impact: HomeDriveRuntimeImpactState,
): HomeDrivePostImpactDriveRecovery {
  const hasValidImpactAge =
    Number.isFinite(impact.elapsedSinceImpactSeconds) &&
    impact.elapsedSinceImpactSeconds >= 0;

  const impactAgeRatio = hasValidImpactAge
    ? clamp(
        1 -
          impact.elapsedSinceImpactSeconds /
            FREE_DRIVE_POST_IMPACT_RECOVERY_SECONDS,
        0,
        1,
      )
    : 0;

  const lockRatio =
    impact.controlLockSeconds > 0
      ? clamp(
          impact.controlLockSeconds / FREE_DRIVE_POST_IMPACT_FULL_LOCK_SECONDS,
          0,
          1,
        )
      : 0;

  const impactIntensity = getHomeDriveImpactIntensity(impact);

  const recoveryRatio = clamp(
    Math.max(
      lockRatio,
      impactAgeRatio * (0.48 + impactIntensity * 0.52),
    ),
    0,
    1,
  );

  if (recoveryRatio <= 0.001) {
    return {
      recoveryRatio: 0,
      throttleFactor: 1,
      accelerationFactor: 1,
      speedCapMps: FREE_DRIVE_MAX_SPEED_MPS,
      extraDragMps2: 0,
      extraBrakeMps2: 0,
    };
  }

  const shapedRecovery = Math.pow(recoveryRatio, 0.72);
  const isFullLock =
    hasValidImpactAge &&
    impact.elapsedSinceImpactSeconds <=
      FREE_DRIVE_POST_IMPACT_FULL_LOCK_SECONDS &&
    impactIntensity >= 0.08;

  const throttleFactor = isFullLock
    ? 0
    : lerp(1, FREE_DRIVE_POST_IMPACT_MIN_THROTTLE_FACTOR, shapedRecovery);

  const accelerationFactor = isFullLock
    ? 0
    : lerp(
        1,
        FREE_DRIVE_POST_IMPACT_MIN_ACCELERATION_FACTOR,
        shapedRecovery,
      );

  const speedCapMps = isFullLock
    ? 0
    : lerp(
        FREE_DRIVE_POST_IMPACT_MAX_SPEED_CAP_MPS,
        FREE_DRIVE_POST_IMPACT_MIN_SPEED_CAP_MPS,
        shapedRecovery,
      );

  return {
    recoveryRatio,
    throttleFactor,
    accelerationFactor,
    speedCapMps,
    extraDragMps2: FREE_DRIVE_POST_IMPACT_DRAG_MPS2 * shapedRecovery,
    extraBrakeMps2: FREE_DRIVE_POST_IMPACT_BRAKE_MPS2 * shapedRecovery,
  };
}

export function getHomeDriveThrottleAccelerationBudget(params: {
  throttle: number;
  controlFactor: number;
  accelerationFactor: number;
  currentSpeedMps: number;
  targetSpeedMps: number;
  deltaSeconds: number;
}): number {
  const normalizedThrottle = clamp(params.throttle, 0, 1);
  const controlFactor = clamp(params.controlFactor, 0, 1);
  const accelerationFactor = clamp(params.accelerationFactor, 0, 1);

  if (controlFactor <= 0 || accelerationFactor <= 0) {
    return 0;
  }

  /**
   * Importante:
   * antes havia floor mesmo quando throttle efetivo era 0.
   * Isso fazia o carro acelerar mesmo durante lock de colisão.
   */
  const throttleFloor =
    normalizedThrottle > 0.005 ? 0.2 * controlFactor : 0;
  const throttleForce = Math.max(normalizedThrottle, throttleFloor);

  if (throttleForce <= 0) {
    return 0;
  }

  const currentAbsSpeed = Math.abs(params.currentSpeedMps);
  const targetAbsSpeed = Math.max(Math.abs(params.targetSpeedMps), 0.001);
  const speedRatio = clamp(currentAbsSpeed / targetAbsSpeed, 0, 1);
  const highSpeedEase = lerp(1, 0.48, Math.pow(speedRatio, 1.15));

  const reverseRecoveryMultiplier =
    params.currentSpeedMps < -0.15 && params.targetSpeedMps > 0
      ? FREE_DRIVE_REVERSE_RECOVERY_ACCELERATION_MULTIPLIER
      : 1;

  const impactRecoveryMultiplier = lerp(
    FREE_DRIVE_IMPACT_RECOVERY_ACCELERATION_MULTIPLIER,
    1,
    controlFactor,
  );

  return (
    FREE_DRIVE_ACCELERATION_MPS2 *
    params.deltaSeconds *
    throttleForce *
    highSpeedEase *
    reverseRecoveryMultiplier *
    impactRecoveryMultiplier *
    accelerationFactor
  );
}

export function applyHomeDriveNaturalDrag(params: {
  speedMps: number;
  throttle: number;
  brake: number;
  deltaSeconds: number;
}): number {
  const normalizedThrottle = clamp(params.throttle, 0, 1);
  const normalizedBrake = clamp(params.brake, 0, 1);

  let speedMps = params.speedMps;

  const naturalDragFactor = clamp(1 - normalizedThrottle * 0.78, 0.14, 1);

  speedMps -=
    FREE_DRIVE_NATURAL_DRAG_MPS2 *
    params.deltaSeconds *
    naturalDragFactor *
    Math.sign(speedMps || 1);

  if (normalizedBrake > 0) {
    const brakeAmount =
      FREE_DRIVE_BRAKE_MPS2 * params.deltaSeconds * normalizedBrake;

    if (speedMps > 0) {
      speedMps = Math.max(0, speedMps - brakeAmount);
    } else if (speedMps < 0) {
      speedMps = Math.min(0, speedMps + brakeAmount);
    }
  }

  return speedMps;
}

export function applyHomeDrivePostImpactDrag(params: {
  speedMps: number;
  recovery: HomeDrivePostImpactDriveRecovery;
  deltaSeconds: number;
}): number {
  if (params.recovery.recoveryRatio <= 0) {
    return params.speedMps;
  }

  let speedMps = params.speedMps;

  const extraBrakeAmount =
    (params.recovery.extraDragMps2 + params.recovery.extraBrakeMps2) *
    params.deltaSeconds;

  if (speedMps > params.recovery.speedCapMps) {
    speedMps = moveTowards(
      speedMps,
      params.recovery.speedCapMps,
      extraBrakeAmount,
    );
  }

  if (Math.abs(speedMps) > 0.001) {
    speedMps = moveTowards(speedMps, 0, extraBrakeAmount * 0.42);
  }

  return speedMps;
}

export function applyHomeDriveCorneringSpeedLoss(params: {
  speedMps: number;
  steerAngleRad: number;
  deltaSeconds: number;
}): number {
  const absSpeedMps = Math.abs(params.speedMps);

  if (absSpeedMps <= 0.001) {
    return 0;
  }

  const maxSteerRad = Math.max(
    degToRad(FREE_DRIVE_MAX_STEER_ANGLE_DEG),
    0.001,
  );

  const steeringIntensity = clamp(
    Math.abs(params.steerAngleRad) / maxSteerRad,
    0,
    1,
  );

  if (steeringIntensity <= 0.015) {
    return params.speedMps;
  }

  const speedIntensity = clamp(absSpeedMps / FREE_DRIVE_MAX_SPEED_MPS, 0, 1);

  const corneringDragMps =
    FREE_DRIVE_CORNERING_DRAG_MPS2 *
    Math.pow(steeringIntensity, FREE_DRIVE_CORNERING_STEER_EXPONENT) *
    Math.pow(speedIntensity, FREE_DRIVE_CORNERING_SPEED_EXPONENT) *
    params.deltaSeconds;

  if (corneringDragMps <= 0) {
    return params.speedMps;
  }

  const minimumRetainedAbsSpeed =
    absSpeedMps >= FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS
      ? FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS
      : absSpeedMps;

  const nextAbsSpeedMps = Math.max(
    absSpeedMps - corneringDragMps,
    minimumRetainedAbsSpeed,
  );

  return Math.sign(params.speedMps) * nextAbsSpeedMps;
}
