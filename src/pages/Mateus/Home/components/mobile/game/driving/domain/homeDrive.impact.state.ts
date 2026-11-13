// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.state.ts
// Criação e normalização do estado de impacto.

import type { HomeDriveRuntimeImpactState } from "./homeDrive.impact.types";

export function createHomeDriveImpactState(): HomeDriveRuntimeImpactState {
  return {
    recoilVelocity: {
      x: 0,
      z: 0,
    },
    spinVelocityRadps: 0,
    visualRollRad: 0,
    visualPitchRad: 0,
    cameraShake: 0,
    collisionImpulse: 0,
    controlLockSeconds: 0,
    elapsedSinceImpactSeconds: Number.POSITIVE_INFINITY,
    lastCollisionAt: Number.NEGATIVE_INFINITY,
    serial: 0,
  };
}

export function normalizeHomeDriveImpactState(
  impact?: Partial<HomeDriveRuntimeImpactState> | null,
): HomeDriveRuntimeImpactState {
  const empty = createHomeDriveImpactState();

  if (!impact) {
    return empty;
  }

  return {
    recoilVelocity: {
      x: Number.isFinite(impact.recoilVelocity?.x)
        ? Number(impact.recoilVelocity?.x)
        : empty.recoilVelocity.x,
      z: Number.isFinite(impact.recoilVelocity?.z)
        ? Number(impact.recoilVelocity?.z)
        : empty.recoilVelocity.z,
    },
    spinVelocityRadps: Number.isFinite(impact.spinVelocityRadps)
      ? Number(impact.spinVelocityRadps)
      : empty.spinVelocityRadps,
    visualRollRad: Number.isFinite(impact.visualRollRad)
      ? Number(impact.visualRollRad)
      : empty.visualRollRad,
    visualPitchRad: Number.isFinite(impact.visualPitchRad)
      ? Number(impact.visualPitchRad)
      : empty.visualPitchRad,
    cameraShake: Number.isFinite(impact.cameraShake)
      ? Number(impact.cameraShake)
      : empty.cameraShake,
    collisionImpulse: Number.isFinite(impact.collisionImpulse)
      ? Number(impact.collisionImpulse)
      : empty.collisionImpulse,
    controlLockSeconds: Number.isFinite(impact.controlLockSeconds)
      ? Number(impact.controlLockSeconds)
      : empty.controlLockSeconds,
    elapsedSinceImpactSeconds: Number.isFinite(
      impact.elapsedSinceImpactSeconds,
    )
      ? Number(impact.elapsedSinceImpactSeconds)
      : empty.elapsedSinceImpactSeconds,
    lastCollisionAt: Number.isFinite(impact.lastCollisionAt)
      ? Number(impact.lastCollisionAt)
      : empty.lastCollisionAt,
    serial: Number.isFinite(impact.serial)
      ? Number(impact.serial)
      : empty.serial,
  };
}
