// src/pages/Mateus/Home/components/mobile/game/driving/view/speedometer/homeDriveSpeedometerImpact.helpers.ts

const DEFAULT_DELTA_SECONDS = 1 / 30;

export const MIN_IMPACT_IMPULSE = 0.75;
export const MIN_CAMERA_SHAKE = 0.035;
export const MIN_ACTIVE_SPEED_DELTA_KMH = 0.6;

export const IMPULSE_FOR_FULL_SHOCK = 18;
export const CAMERA_SHAKE_FOR_FULL_SHOCK = 1.75;
export const PITCH_FOR_FULL_SHOCK_RAD = 0.38;
export const ROLL_FOR_FULL_SHOCK_RAD = 0.42;

export const MIN_DROP_RATIO = 0.46;
export const MAX_DROP_RATIO = 0.985;

export const MIN_HOLD_SECONDS = 0.12;
export const MAX_HOLD_SECONDS = 0.38;

/**
 * Teto visual depois da colisão.
 *
 * Se bater a 100 km/h, o ponteiro não fica mais em 70 km/h.
 * Ele cai para algo entre 3 e 22 km/h, conforme força da pancada.
 */
export const MAX_IMPACT_TARGET_SPEED_KMH = 22;
export const STRONG_IMPACT_TARGET_SPEED_KMH = 3;

/**
 * Recuperação do ponteiro depois da pancada.
 *
 * Menor = volta mais devagar.
 * Maior = volta mais rápido.
 */
export const MIN_RECOVERY_KMH_PER_SECOND = 14;
export const MAX_RECOVERY_KMH_PER_SECOND = 44;

/**
 * Quando a velocidade física cai naturalmente, o ponteiro pode acompanhar
 * mais rápido do que quando está subindo após batida.
 */
export const DOWNWARD_FOLLOW_KMH_PER_SECOND = 260;

/**
 * Quanto maior, mais o ponteiro pode ser derrubado mesmo quando o snapshot
 * já chegou com velocidade baixa.
 */
export const MAX_VISUAL_EXTRA_DROP_KMH = 140;

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function lerpNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * clampNumber(progress, 0, 1);
}

export function moveTowards(
  current: number,
  target: number,
  maxDelta: number,
): number {
  if (!Number.isFinite(current)) {
    return target;
  }

  if (!Number.isFinite(target)) {
    return current;
  }

  const safeMaxDelta = Math.max(0, maxDelta);
  const delta = target - current;

  if (Math.abs(delta) <= safeMaxDelta) {
    return target;
  }

  return current + Math.sign(delta) * safeMaxDelta;
}

export function getFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getSafeDeltaSeconds(deltaSeconds: number | undefined): number {
  return clampNumber(deltaSeconds ?? DEFAULT_DELTA_SECONDS, 1 / 120, 1 / 8);
}
