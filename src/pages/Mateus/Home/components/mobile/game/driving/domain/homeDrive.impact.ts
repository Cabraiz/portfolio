// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.ts

import type {
  HomeDriveCarState,
  HomeDriveVector2,
} from "./homeDrive.types";

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

const DEFAULT_RECOIL_DAMPING_PER_SECOND = 5.8;
const DEFAULT_SPIN_DAMPING_PER_SECOND = 4.25;
const DEFAULT_CAMERA_SHAKE_DAMPING_PER_SECOND = 8.8;
const DEFAULT_VISUAL_DAMPING_PER_SECOND = 7.2;

/**
 * Antes o collisionImpulse morria muito rápido.
 * Agora ele dura mais para a física conseguir usar como sinal de recuperação
 * pós-impacto.
 */
const DEFAULT_COLLISION_IMPULSE_DAMPING_PER_SECOND = 1.05;

const DEFAULT_MAX_RECOIL_SPEED_MPS = 42;
const DEFAULT_MAX_SPIN_VELOCITY_RADPS = 34;

const MIN_ACTIVE_RECOIL_MPS = 0.025;
const MIN_ACTIVE_SPIN_RADPS = 0.025;
const MIN_ACTIVE_SHAKE = 0.003;
const MIN_ACTIVE_VISUAL_RAD = 0.003;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

function damp(
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

function dampVector(
  vector: HomeDriveVector2,
  dampingPerSecond: number,
  deltaSeconds: number,
): HomeDriveVector2 {
  return {
    x: damp(vector.x, dampingPerSecond, deltaSeconds),
    z: damp(vector.z, dampingPerSecond, deltaSeconds),
  };
}

function getVectorLength(vector: HomeDriveVector2): number {
  return Math.hypot(vector.x, vector.z);
}

function normalizeVectorOrFallback(
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

function clampVectorMagnitude(
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

function dot(first: HomeDriveVector2, second: HomeDriveVector2): number {
  return first.x * second.x + first.z * second.z;
}

function getCarForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getCarRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function getSignedFallback(value: number, fallback: number): number {
  if (Math.abs(value) > 0.08) {
    return Math.sign(value);
  }

  return fallback >= 0 ? 1 : -1;
}

function getEstimatedImpulse(relativeSpeedMps: number): number {
  return clamp(2.4 + relativeSpeedMps * 1.18, 2.4, 28);
}

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
