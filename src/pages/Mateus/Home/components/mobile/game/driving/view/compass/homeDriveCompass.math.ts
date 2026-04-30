// src/pages/Mateus/Home/components/mobile/game/driving/view/compass/homeDriveCompass.math.ts

const FULL_CIRCLE_DEGREES = 360;
const HALF_CIRCLE_DEGREES = 180;

/**
 * Normaliza qualquer valor angular para o intervalo:
 * 0 <= degrees < 360
 */
export function normalizeHomeDriveCompassDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }

  const normalized = ((degrees % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) %
    FULL_CIRCLE_DEGREES;

  return Object.is(normalized, -0) ? 0 : normalized;
}

/**
 * Converte radianos para graus já normalizados.
 */
export function homeDriveCompassRadiansToDegrees(radians: number): number {
  if (!Number.isFinite(radians)) {
    return 0;
  }

  return normalizeHomeDriveCompassDegrees((radians * HALF_CIRCLE_DEGREES) / Math.PI);
}

/**
 * Retorna a menor distância angular assinada entre dois ângulos.
 *
 * Resultado:
 * - negativo: alvo está à esquerda do heading.
 * - positivo: alvo está à direita do heading.
 * - faixa: -180 até 180.
 */
export function getHomeDriveCompassSignedDeltaDegrees(
  targetDegrees: number,
  headingDegrees: number,
): number {
  const target = normalizeHomeDriveCompassDegrees(targetDegrees);
  const heading = normalizeHomeDriveCompassDegrees(headingDegrees);

  return ((target - heading + 540) % FULL_CIRCLE_DEGREES) - HALF_CIRCLE_DEGREES;
}

export function clampHomeDriveCompassNumber(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function getHomeDriveCompassDistanceRatio(
  deltaDegrees: number,
  visibleDegrees: number,
): number {
  const safeVisibleDegrees = Math.max(1, Math.abs(visibleDegrees));

  return clampHomeDriveCompassNumber(
    Math.abs(deltaDegrees) / safeVisibleDegrees,
    0,
    1,
  );
}

export function roundHomeDriveCompassNumber(
  value: number,
  decimals = 3,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** Math.max(0, Math.floor(decimals));

  return Math.round(value * factor) / factor;
}
