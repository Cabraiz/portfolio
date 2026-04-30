// src/pages/Mateus/Home/components/mobile/game/driving/view/speedometer/homeDriveSpeedometerImpact.ts

import type { HomeDriveRuntimeImpactState } from "../../domain/homeDrive.impact";

export type HomeDriveSpeedometerImpactRuntimeState = Readonly<{
  initialized: boolean;
  lastImpactSerial: number | null;

  /**
   * Velocidade visual persistida.
   *
   * O ponteiro não volta mais direto para rawSpeedKmh.
   * Ele se move gradualmente até o alvo físico.
   */
  visualSpeedKmh: number;

  holdSeconds: number;
  shockRatio: number;
}>;

export type HomeDriveSpeedometerImpactResolveInput = Readonly<{
  speedMps: number;
  impact?: HomeDriveRuntimeImpactState | null;
  previousState?: HomeDriveSpeedometerImpactRuntimeState | null;
  deltaSeconds?: number;
}>;

export type HomeDriveSpeedometerImpactResolveResult = Readonly<{
  state: HomeDriveSpeedometerImpactRuntimeState;
  rawSpeedKmh: number;
  visualSpeedKmh: number;
  visualSpeedMps: number;
  shockRatio: number;
  isImpacting: boolean;
}>;

const DEFAULT_DELTA_SECONDS = 1 / 30;

const MIN_IMPACT_IMPULSE = 0.75;
const MIN_CAMERA_SHAKE = 0.035;
const MIN_ACTIVE_SPEED_DELTA_KMH = 0.6;

const IMPULSE_FOR_FULL_SHOCK = 18;
const CAMERA_SHAKE_FOR_FULL_SHOCK = 1.75;
const PITCH_FOR_FULL_SHOCK_RAD = 0.38;
const ROLL_FOR_FULL_SHOCK_RAD = 0.42;

const MIN_DROP_RATIO = 0.46;
const MAX_DROP_RATIO = 0.985;

const MIN_HOLD_SECONDS = 0.12;
const MAX_HOLD_SECONDS = 0.38;

/**
 * Teto visual depois da colisão.
 *
 * Se bater a 100 km/h, o ponteiro não fica mais em 70 km/h.
 * Ele cai para algo entre 3 e 22 km/h, conforme força da pancada.
 */
const MAX_IMPACT_TARGET_SPEED_KMH = 22;
const STRONG_IMPACT_TARGET_SPEED_KMH = 3;

/**
 * Recuperação do ponteiro depois da pancada.
 *
 * Menor = volta mais devagar.
 * Maior = volta mais rápido.
 */
const MIN_RECOVERY_KMH_PER_SECOND = 14;
const MAX_RECOVERY_KMH_PER_SECOND = 44;

/**
 * Quando a velocidade física cai naturalmente, o ponteiro pode acompanhar
 * mais rápido do que quando está subindo após batida.
 */
const DOWNWARD_FOLLOW_KMH_PER_SECOND = 260;

/**
 * Quanto maior, mais o ponteiro pode ser derrubado mesmo quando o snapshot
 * já chegou com velocidade baixa.
 */
const MAX_VISUAL_EXTRA_DROP_KMH = 140;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerpNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * clampNumber(progress, 0, 1);
}

function moveTowards(
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

function getFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSafeDeltaSeconds(deltaSeconds: number | undefined): number {
  return clampNumber(deltaSeconds ?? DEFAULT_DELTA_SECONDS, 1 / 120, 1 / 8);
}

/**
 * Velocímetro analógico mostra avanço.
 * Se a batida joga o carro para trás, o ponteiro deve cair.
 */
export function getHomeDriveSpeedometerForwardSpeedKmh(speedMps: number): number {
  if (!Number.isFinite(speedMps)) {
    return 0;
  }

  return Math.max(0, speedMps) * 3.6;
}

export function getHomeDriveSpeedometerForwardSpeedMps(
  speedMps: number,
): number {
  if (!Number.isFinite(speedMps)) {
    return 0;
  }

  return Math.max(0, speedMps);
}

export function createInitialHomeDriveSpeedometerImpactState(): HomeDriveSpeedometerImpactRuntimeState {
  return {
    initialized: false,
    lastImpactSerial: null,
    visualSpeedKmh: 0,
    holdSeconds: 0,
    shockRatio: 0,
  };
}

export function getHomeDriveSpeedometerImpactStrength(
  impact?: HomeDriveRuntimeImpactState | null,
): number {
  if (!impact) {
    return 0;
  }

  const collisionImpulse = getFiniteNumber(impact.collisionImpulse);
  const cameraShake = getFiniteNumber(impact.cameraShake);
  const visualPitchRad = Math.abs(getFiniteNumber(impact.visualPitchRad));
  const visualRollRad = Math.abs(getFiniteNumber(impact.visualRollRad));

  if (
    collisionImpulse < MIN_IMPACT_IMPULSE &&
    cameraShake < MIN_CAMERA_SHAKE &&
    visualPitchRad <= 0.001 &&
    visualRollRad <= 0.001
  ) {
    return 0;
  }

  const impulseRatio = clampNumber(
    collisionImpulse / IMPULSE_FOR_FULL_SHOCK,
    0,
    1,
  );
  const cameraShakeRatio = clampNumber(
    cameraShake / CAMERA_SHAKE_FOR_FULL_SHOCK,
    0,
    1,
  );
  const pitchRatio = clampNumber(
    visualPitchRad / PITCH_FOR_FULL_SHOCK_RAD,
    0,
    1,
  );
  const rollRatio = clampNumber(
    visualRollRad / ROLL_FOR_FULL_SHOCK_RAD,
    0,
    1,
  );

  return clampNumber(
    Math.max(
      impulseRatio,
      cameraShakeRatio * 0.9,
      pitchRatio * 0.72,
      rollRatio * 0.68,
    ),
    0,
    1,
  );
}

export function getHomeDriveSpeedometerImpactDropRatio(
  impact?: HomeDriveRuntimeImpactState | null,
): number {
  const strength = getHomeDriveSpeedometerImpactStrength(impact);

  if (strength <= 0) {
    return 0;
  }

  const shapedStrength = Math.sqrt(strength);

  return lerpNumber(MIN_DROP_RATIO, MAX_DROP_RATIO, shapedStrength);
}

function getImpactSerial(
  impact?: HomeDriveRuntimeImpactState | null,
): number | null {
  if (!impact || !Number.isFinite(impact.serial)) {
    return null;
  }

  return impact.serial;
}

function isNewSpeedometerImpact(params: {
  impact?: HomeDriveRuntimeImpactState | null;
  previousState: HomeDriveSpeedometerImpactRuntimeState;
  strength: number;
}): boolean {
  const serial = getImpactSerial(params.impact);

  if (serial === null) {
    return false;
  }

  if (params.strength <= 0) {
    return false;
  }

  return serial !== params.previousState.lastImpactSerial;
}

function getImpactTargetSpeedKmh(params: {
  rawSpeedKmh: number;
  previousVisualSpeedKmh: number;
  impact?: HomeDriveRuntimeImpactState | null;
  strength: number;
}): number {
  const dropRatio = getHomeDriveSpeedometerImpactDropRatio(params.impact);
  const collisionImpulse = getFiniteNumber(params.impact?.collisionImpulse);
  const cameraShake = getFiniteNumber(params.impact?.cameraShake);

  const proportionalDropKmh = params.rawSpeedKmh * dropRatio;
  const impulseDropKmh =
    collisionImpulse * lerpNumber(4.2, 8.2, params.strength);
  const shakeDropKmh = cameraShake * 26;

  const totalDropKmh = clampNumber(
    Math.max(proportionalDropKmh, impulseDropKmh, shakeDropKmh),
    0,
    params.rawSpeedKmh + MAX_VISUAL_EXTRA_DROP_KMH,
  );

  const targetSpeedKmh = clampNumber(
    params.rawSpeedKmh - totalDropKmh,
    0,
    params.rawSpeedKmh,
  );

  const impactTargetCapKmh = lerpNumber(
    MAX_IMPACT_TARGET_SPEED_KMH,
    STRONG_IMPACT_TARGET_SPEED_KMH,
    params.strength,
  );

  /**
   * Nunca deixa uma pancada "subir" o ponteiro.
   * A pancada só derruba ou mantém abaixo.
   *
   * Também aplica teto pós-impacto para não ficar descendo só até 70 km/h.
   */
  return Math.min(
    params.previousVisualSpeedKmh,
    targetSpeedKmh,
    impactTargetCapKmh,
  );
}

function recoverVisualSpeedKmh(params: {
  previousVisualSpeedKmh: number;
  rawSpeedKmh: number;
  holdSeconds: number;
  shockRatio: number;
  deltaSeconds: number;
}): number {
  const previousVisualSpeedKmh = clampNumber(
    params.previousVisualSpeedKmh,
    0,
    Math.max(params.rawSpeedKmh, params.previousVisualSpeedKmh, 0),
  );

  if (params.rawSpeedKmh < previousVisualSpeedKmh) {
    return moveTowards(
      previousVisualSpeedKmh,
      params.rawSpeedKmh,
      DOWNWARD_FOLLOW_KMH_PER_SECOND * params.deltaSeconds,
    );
  }

  if (params.holdSeconds > 0) {
    return Math.min(previousVisualSpeedKmh, params.rawSpeedKmh);
  }

  const recoveryKmhPerSecond = lerpNumber(
    MAX_RECOVERY_KMH_PER_SECOND,
    MIN_RECOVERY_KMH_PER_SECOND,
    params.shockRatio,
  );

  return moveTowards(
    previousVisualSpeedKmh,
    params.rawSpeedKmh,
    recoveryKmhPerSecond * params.deltaSeconds,
  );
}

export function resolveHomeDriveSpeedometerImpactSpeed(
  input: HomeDriveSpeedometerImpactResolveInput,
): HomeDriveSpeedometerImpactResolveResult {
  const previousState =
    input.previousState ?? createInitialHomeDriveSpeedometerImpactState();

  const deltaSeconds = getSafeDeltaSeconds(input.deltaSeconds);
  const rawSpeedKmh = getHomeDriveSpeedometerForwardSpeedKmh(input.speedMps);
  const strength = getHomeDriveSpeedometerImpactStrength(input.impact);

  const previousVisualSpeedKmh = previousState.initialized
    ? previousState.visualSpeedKmh
    : rawSpeedKmh;

  const newImpact = isNewSpeedometerImpact({
    impact: input.impact,
    previousState,
    strength,
  });

  const nextSerial = newImpact
    ? getImpactSerial(input.impact)
    : previousState.lastImpactSerial;

  const nextShockRatio = newImpact
    ? strength
    : clampNumber(previousState.shockRatio - deltaSeconds * 0.82, 0, 1);

  const nextHoldSeconds = newImpact
    ? lerpNumber(MIN_HOLD_SECONDS, MAX_HOLD_SECONDS, strength)
    : Math.max(0, previousState.holdSeconds - deltaSeconds);

  const visualSpeedKmh = newImpact
    ? getImpactTargetSpeedKmh({
        rawSpeedKmh,
        previousVisualSpeedKmh,
        impact: input.impact,
        strength,
      })
    : recoverVisualSpeedKmh({
        previousVisualSpeedKmh,
        rawSpeedKmh,
        holdSeconds: nextHoldSeconds,
        shockRatio: previousState.shockRatio,
        deltaSeconds,
      });

  const clampedVisualSpeedKmh = clampNumber(
    visualSpeedKmh,
    0,
    Math.max(rawSpeedKmh, visualSpeedKmh, 0),
  );

  const state: HomeDriveSpeedometerImpactRuntimeState = {
    initialized: true,
    lastImpactSerial: nextSerial,
    visualSpeedKmh: clampedVisualSpeedKmh,
    holdSeconds: nextHoldSeconds,
    shockRatio: nextShockRatio,
  };

  const speedDeltaKmh = Math.abs(rawSpeedKmh - clampedVisualSpeedKmh);

  return {
    state,
    rawSpeedKmh,
    visualSpeedKmh: clampedVisualSpeedKmh,
    visualSpeedMps: clampedVisualSpeedKmh / 3.6,
    shockRatio: nextShockRatio,
    isImpacting:
      newImpact ||
      nextHoldSeconds > 0 ||
      nextShockRatio > 0.02 ||
      speedDeltaKmh > MIN_ACTIVE_SPEED_DELTA_KMH,
  };
}

export function getHomeDriveSpeedometerImpactAdjustedSpeedMps(
  input: HomeDriveSpeedometerImpactResolveInput,
): number {
  return resolveHomeDriveSpeedometerImpactSpeed(input).visualSpeedMps;
}
