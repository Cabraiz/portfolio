// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.types.ts
// Tipos do estado de impacto.

import type { HomeDriveCarState, HomeDriveVector2 } from "./homeDrive.types";

export type HomeDriveRuntimeImpactState = Readonly<{
  recoilVelocity: HomeDriveVector2;
  spinVelocityRadps: number;
  visualRollRad: number;
  visualPitchRad: number;
  cameraShake: number;
  collisionImpulse: number;
  controlLockSeconds: number;
  elapsedSinceImpactSeconds: number;
  lastCollisionAt: number;
  serial: number;
}>;

export type HomeDriveImpactCollisionInput = Readonly<{
  car: HomeDriveCarState;
  normal: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse?: number;
  occurredAt: number;
  brutality?: number;
}>;

export type HomeDriveImpactTickOptions = Readonly<{
  recoilDampingPerSecond?: number;
  spinDampingPerSecond?: number;
  cameraShakeDampingPerSecond?: number;
  visualDampingPerSecond?: number;
  collisionImpulseDampingPerSecond?: number;
}>;

export type HomeDriveImpactApplicationOptions = Readonly<{
  allowReverseKick?: boolean;
  maxRecoilSpeedMps?: number;
  maxSpinVelocityRadps?: number;
}>;
