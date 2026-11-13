// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.helpers.ts
// Constantes e helpers vetoriais do impacto.

import type { HomeDriveVector2 } from "./homeDrive.types";

export const DEFAULT_RECOIL_DAMPING_PER_SECOND = 5.8;
export const DEFAULT_SPIN_DAMPING_PER_SECOND = 4.25;
export const DEFAULT_CAMERA_SHAKE_DAMPING_PER_SECOND = 8.8;
export const DEFAULT_VISUAL_DAMPING_PER_SECOND = 7.2;

/**
 * Antes o collisionImpulse morria muito rápido.
 * Agora ele dura mais para a física conseguir usar como sinal de recuperação
 * pós-impacto.
 */
export const DEFAULT_COLLISION_IMPULSE_DAMPING_PER_SECOND = 1.05;

export const DEFAULT_MAX_RECOIL_SPEED_MPS = 42;
export const DEFAULT_MAX_SPIN_VELOCITY_RADPS = 34;

export const MIN_ACTIVE_RECOIL_MPS = 0.025;
export const MIN_ACTIVE_SPIN_RADPS = 0.025;
export const MIN_ACTIVE_SHAKE = 0.003;
export const MIN_ACTIVE_VISUAL_RAD = 0.003;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

export function damp(
  value: number,
  dampingPerSecond: number,
  deltaSeconds: number,
): number {
  if (Math.abs(value) <= 0.000001) {
    return 0;
  }

  const factor = Math.exp(-Math.max(0, dampingPerSecond) * deltaSeconds);
  const nextValue = value * factor;

  return Math.abs(nextValue) <= 0.000001 ? 0 : nextValue;
}

export function dampVector(
  vector: HomeDriveVector2,
  dampingPerSecond: number,
  deltaSeconds: number,
): HomeDriveVector2 {
  return {
    x: damp(vector.x, dampingPerSecond, deltaSeconds),
    z: damp(vector.z, dampingPerSecond, deltaSeconds),
  };
}

export function getVectorLength(vector: HomeDriveVector2): number {
  return Math.hypot(vector.x, vector.z);
}

export function normalizeVectorOrFallback(
  vector: HomeDriveVector2,
  fallback: HomeDriveVector2,
): HomeDriveVector2 {
  const length = getVectorLength(vector);

  if (length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

export function clampVectorMagnitude(
  vector: HomeDriveVector2,
  maxMagnitude: number,
): HomeDriveVector2 {
  const magnitude = getVectorLength(vector);

  if (magnitude <= maxMagnitude || magnitude <= 0.000001) {
    return vector;
  }

  const scale = maxMagnitude / magnitude;

  return {
    x: vector.x * scale,
    z: vector.z * scale,
  };
}

export function dot(first: HomeDriveVector2, second: HomeDriveVector2): number {
  return first.x * second.x + first.z * second.z;
}

export function getCarForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

export function getCarRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

export function getSignedFallback(value: number, fallback: number): number {
  if (Math.abs(value) > 0.08) {
    return Math.sign(value);
  }

  return fallback >= 0 ? 1 : -1;
}

export function getEstimatedImpulse(relativeSpeedMps: number): number {
  return clamp(2.4 + relativeSpeedMps * 1.18, 2.4, 28);
}
