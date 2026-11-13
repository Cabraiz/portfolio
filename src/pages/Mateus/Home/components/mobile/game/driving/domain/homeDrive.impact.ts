// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.ts

import type { HomeDriveCarState } from "./homeDrive.types";
import type {
  HomeDriveRuntimeImpactState,
  HomeDriveImpactCollisionInput,
  HomeDriveImpactTickOptions,
  HomeDriveImpactApplicationOptions,
} from "./homeDrive.impact.types";
import {
  DEFAULT_RECOIL_DAMPING_PER_SECOND,
  DEFAULT_SPIN_DAMPING_PER_SECOND,
  DEFAULT_CAMERA_SHAKE_DAMPING_PER_SECOND,
  DEFAULT_VISUAL_DAMPING_PER_SECOND,
  DEFAULT_COLLISION_IMPULSE_DAMPING_PER_SECOND,
  DEFAULT_MAX_RECOIL_SPEED_MPS,
  DEFAULT_MAX_SPIN_VELOCITY_RADPS,
  MIN_ACTIVE_RECOIL_MPS,
  MIN_ACTIVE_SPIN_RADPS,
  MIN_ACTIVE_SHAKE,
  MIN_ACTIVE_VISUAL_RAD,
  clamp,
  clampAbs,
  damp,
  dampVector,
  getVectorLength,
  normalizeVectorOrFallback,
  clampVectorMagnitude,
  dot,
  getCarForwardVector,
  getCarRightVector,
  getSignedFallback,
  getEstimatedImpulse,
} from "./homeDrive.impact.helpers";
import { normalizeHomeDriveImpactState } from "./homeDrive.impact.state";
export type {
  HomeDriveRuntimeImpactState,
  HomeDriveImpactCollisionInput,
  HomeDriveImpactTickOptions,
  HomeDriveImpactApplicationOptions,
} from "./homeDrive.impact.types";
export {
  createHomeDriveImpactState,
  normalizeHomeDriveImpactState,
} from "./homeDrive.impact.state";

export function createHomeDriveImpactFromCollision({
  car,
  normal,
  relativeSpeedMps,
  impulse,
  occurredAt,
  brutality = 1.38,
}: HomeDriveImpactCollisionInput): HomeDriveRuntimeImpactState {
  const forward = getCarForwardVector(car.headingRad);
  const right = getCarRightVector(car.headingRad);

  const safeNormal = normalizeVectorOrFallback(normal, {
    x: -forward.x,
    z: -forward.z,
  });

  const resolvedImpulse = Math.max(
    getEstimatedImpulse(relativeSpeedMps),
    impulse ?? 0,
  );

  const speedWeight = clamp(relativeSpeedMps / 18, 0.35, 2.2);
  const impulseWeight = clamp(resolvedImpulse / 12, 0.35, 2.8);

  const recoilStrength = clamp(
    (5.4 + relativeSpeedMps * 0.92 + resolvedImpulse * 0.74) * brutality,
    5.5,
    38,
  );

  const sideDot = dot(safeNormal, right);
  const frontDot = dot(safeNormal, forward);
  const spinSign = getSignedFallback(sideDot, safeNormal.x + safeNormal.z);

  const spinVelocityRadps = clampAbs(
    spinSign *
      (5.2 + relativeSpeedMps * 0.58 + resolvedImpulse * 1.08) *
      brutality,
    DEFAULT_MAX_SPIN_VELOCITY_RADPS,
  );

  const visualRollRad = clampAbs(
    -spinSign * (0.16 + impulseWeight * 0.36 + speedWeight * 0.18) * brutality,
    1.05,
  );

  const visualPitchRad = clampAbs(
    -frontDot * (0.14 + impulseWeight * 0.28 + speedWeight * 0.12) * brutality,
    0.84,
  );

  /**
   * Mais longo que antes.
   * Este lock não é só visual; ele entra na física como corte de drivetrain.
   */
  const controlLockSeconds = clamp(
    (0.34 + impulseWeight * 0.3 + speedWeight * 0.18) * brutality,
    0.42,
    1.85,
  );

  return {
    recoilVelocity: clampVectorMagnitude(
      {
        x: safeNormal.x * recoilStrength,
        z: safeNormal.z * recoilStrength,
      },
      DEFAULT_MAX_RECOIL_SPEED_MPS,
    ),
    spinVelocityRadps,
    visualRollRad,
    visualPitchRad,
    cameraShake: clamp(
      (0.24 + impulseWeight * 0.46 + speedWeight * 0.18) * brutality,
      0.18,
      2.2,
    ),
    collisionImpulse: resolvedImpulse,
    controlLockSeconds,
    elapsedSinceImpactSeconds: 0,
    lastCollisionAt: occurredAt,
    serial: 1,
  };
}

export function mergeHomeDriveImpactStates(
  currentImpactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
  nextImpactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
): HomeDriveRuntimeImpactState {
  const currentImpact = normalizeHomeDriveImpactState(currentImpactInput);
  const nextImpact = normalizeHomeDriveImpactState(nextImpactInput);

  const mergedRecoilVelocity = clampVectorMagnitude(
    {
      x: currentImpact.recoilVelocity.x + nextImpact.recoilVelocity.x,
      z: currentImpact.recoilVelocity.z + nextImpact.recoilVelocity.z,
    },
    DEFAULT_MAX_RECOIL_SPEED_MPS,
  );

  const nextIsNewer =
    nextImpact.lastCollisionAt >= currentImpact.lastCollisionAt;

  return {
    recoilVelocity: mergedRecoilVelocity,
    spinVelocityRadps: clampAbs(
      currentImpact.spinVelocityRadps + nextImpact.spinVelocityRadps,
      DEFAULT_MAX_SPIN_VELOCITY_RADPS,
    ),
    visualRollRad: clampAbs(
      currentImpact.visualRollRad * 0.35 + nextImpact.visualRollRad,
      1.15,
    ),
    visualPitchRad: clampAbs(
      currentImpact.visualPitchRad * 0.35 + nextImpact.visualPitchRad,
      0.95,
    ),
    cameraShake: clamp(
      Math.max(currentImpact.cameraShake * 0.62, nextImpact.cameraShake),
      0,
      2.6,
    ),
    collisionImpulse: Math.max(
      currentImpact.collisionImpulse * 0.84,
      nextImpact.collisionImpulse,
    ),
    controlLockSeconds: Math.max(
      currentImpact.controlLockSeconds,
      nextImpact.controlLockSeconds,
    ),
    elapsedSinceImpactSeconds: nextIsNewer
      ? nextImpact.elapsedSinceImpactSeconds
      : currentImpact.elapsedSinceImpactSeconds,
    lastCollisionAt: Math.max(
      currentImpact.lastCollisionAt,
      nextImpact.lastCollisionAt,
    ),
    serial: currentImpact.serial + Math.max(1, nextImpact.serial),
  };
}

export function tickHomeDriveImpact(
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
  deltaSeconds: number,
  options: HomeDriveImpactTickOptions = {},
): HomeDriveRuntimeImpactState {
  const impact = normalizeHomeDriveImpactState(impactInput);
  const safeDeltaSeconds = clamp(deltaSeconds, 0, 0.08);

  const recoilDampingPerSecond =
    options.recoilDampingPerSecond ?? DEFAULT_RECOIL_DAMPING_PER_SECOND;
  const spinDampingPerSecond =
    options.spinDampingPerSecond ?? DEFAULT_SPIN_DAMPING_PER_SECOND;
  const cameraShakeDampingPerSecond =
    options.cameraShakeDampingPerSecond ??
    DEFAULT_CAMERA_SHAKE_DAMPING_PER_SECOND;
  const visualDampingPerSecond =
    options.visualDampingPerSecond ?? DEFAULT_VISUAL_DAMPING_PER_SECOND;
  const collisionImpulseDampingPerSecond =
    options.collisionImpulseDampingPerSecond ??
    DEFAULT_COLLISION_IMPULSE_DAMPING_PER_SECOND;

  const recoilVelocity = dampVector(
    impact.recoilVelocity,
    recoilDampingPerSecond,
    safeDeltaSeconds,
  );

  const spinVelocityRadps = damp(
    impact.spinVelocityRadps,
    spinDampingPerSecond,
    safeDeltaSeconds,
  );

  const visualRollRad = damp(
    impact.visualRollRad,
    visualDampingPerSecond,
    safeDeltaSeconds,
  );

  const visualPitchRad = damp(
    impact.visualPitchRad,
    visualDampingPerSecond,
    safeDeltaSeconds,
  );

  const cameraShake = damp(
    impact.cameraShake,
    cameraShakeDampingPerSecond,
    safeDeltaSeconds,
  );

  const collisionImpulse = damp(
    impact.collisionImpulse,
    collisionImpulseDampingPerSecond,
    safeDeltaSeconds,
  );

  return {
    recoilVelocity:
      getVectorLength(recoilVelocity) <= MIN_ACTIVE_RECOIL_MPS
        ? { x: 0, z: 0 }
        : recoilVelocity,
    spinVelocityRadps:
      Math.abs(spinVelocityRadps) <= MIN_ACTIVE_SPIN_RADPS
        ? 0
        : spinVelocityRadps,
    visualRollRad:
      Math.abs(visualRollRad) <= MIN_ACTIVE_VISUAL_RAD ? 0 : visualRollRad,
    visualPitchRad:
      Math.abs(visualPitchRad) <= MIN_ACTIVE_VISUAL_RAD ? 0 : visualPitchRad,
    cameraShake: cameraShake <= MIN_ACTIVE_SHAKE ? 0 : cameraShake,
    collisionImpulse:
      collisionImpulse <= MIN_ACTIVE_SHAKE ? 0 : collisionImpulse,
    controlLockSeconds: Math.max(
      0,
      impact.controlLockSeconds - safeDeltaSeconds,
    ),
    elapsedSinceImpactSeconds:
      impact.elapsedSinceImpactSeconds + safeDeltaSeconds,
    lastCollisionAt: impact.lastCollisionAt,
    serial: impact.serial,
  };
}

export function applyHomeDriveImpactToCar(
  car: HomeDriveCarState,
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
  deltaSeconds: number,
  options: HomeDriveImpactApplicationOptions = {},
): HomeDriveCarState {
  const impact = normalizeHomeDriveImpactState(impactInput);
  const safeDeltaSeconds = clamp(deltaSeconds, 0, 0.08);

  const maxRecoilSpeedMps =
    options.maxRecoilSpeedMps ?? DEFAULT_MAX_RECOIL_SPEED_MPS;
  const maxSpinVelocityRadps =
    options.maxSpinVelocityRadps ?? DEFAULT_MAX_SPIN_VELOCITY_RADPS;

  const recoilVelocity = clampVectorMagnitude(
    impact.recoilVelocity,
    maxRecoilSpeedMps,
  );

  const spinVelocityRadps = clampAbs(
    impact.spinVelocityRadps,
    maxSpinVelocityRadps,
  );

  const forward = getCarForwardVector(car.headingRad);
  const recoilAgainstForward = dot(recoilVelocity, forward);

  const reverseKickSpeed = options.allowReverseKick
    ? clamp(-recoilAgainstForward * 0.34, -18, 18)
    : 0;

  return {
    ...car,
    position: {
      x: car.position.x + recoilVelocity.x * safeDeltaSeconds,
      z: car.position.z + recoilVelocity.z * safeDeltaSeconds,
    },
    headingRad: car.headingRad + spinVelocityRadps * safeDeltaSeconds,
    speedMps: options.allowReverseKick
      ? clamp(car.speedMps + reverseKickSpeed, -24, 46)
      : car.speedMps,
  };
}

export function getHomeDriveImpactControlFactor(
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
): number {
  const impact = normalizeHomeDriveImpactState(impactInput);

  if (impact.controlLockSeconds <= 0) {
    return 1;
  }

  return clamp(1 - impact.controlLockSeconds * 1.35, 0.04, 1);
}

export function getHomeDriveImpactIntensity(
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
): number {
  const impact = normalizeHomeDriveImpactState(impactInput);

  const recoil = clamp(getVectorLength(impact.recoilVelocity) / 28, 0, 1);
  const spin = clamp(Math.abs(impact.spinVelocityRadps) / 24, 0, 1);
  const shake = clamp(impact.cameraShake / 1.8, 0, 1);
  const impulse = clamp(impact.collisionImpulse / 22, 0, 1);
  const lock = clamp(impact.controlLockSeconds / 1.85, 0, 1);

  return clamp(Math.max(recoil, spin, shake, impulse, lock), 0, 1);
}

export function isHomeDriveImpactActive(
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
): boolean {
  const impact = normalizeHomeDriveImpactState(impactInput);

  return (
    getVectorLength(impact.recoilVelocity) > MIN_ACTIVE_RECOIL_MPS ||
    Math.abs(impact.spinVelocityRadps) > MIN_ACTIVE_SPIN_RADPS ||
    impact.cameraShake > MIN_ACTIVE_SHAKE ||
    Math.abs(impact.visualRollRad) > MIN_ACTIVE_VISUAL_RAD ||
    Math.abs(impact.visualPitchRad) > MIN_ACTIVE_VISUAL_RAD ||
    impact.collisionImpulse > MIN_ACTIVE_SHAKE ||
    impact.controlLockSeconds > 0
  );
}
