// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.impact.ts

import type {
  HomeDriveCarState,
  HomeDriveVector2,
} from "./homeDrive.types";

export type HomeDriveRuntimeImpactState = Readonly<{
  /**
   * Velocidade residual que empurra o player depois da batida.
   * É aplicada no domínio/física, não no render.
   */
  recoilVelocity: HomeDriveVector2;

  /**
   * Velocidade angular residual do carro do player.
   * Valor alto = carro rodando grotescamente após impacto.
   */
  spinVelocityRadps: number;

  /**
   * Inclinação lateral visual do player.
   * Pode ser usada depois no rig/cockpit/modelo do carro.
   */
  visualRollRad: number;

  /**
   * Inclinação longitudinal visual do player.
   * Pode ser usada em câmera/carro para dar sensação de tranco.
   */
  visualPitchRad: number;

  /**
   * Intensidade de shake para a câmera.
   */
  cameraShake: number;

  /**
   * Força consolidada da pancada.
   */
  collisionImpulse: number;

  /**
   * Tempo restante em que input do player deve ficar limitado.
   */
  controlLockSeconds: number;

  /**
   * Tempo desde a última pancada.
   */
  elapsedSinceImpactSeconds: number;

  /**
   * Timestamp do último impacto dentro do runtime do jogo.
   */
  lastCollisionAt: number;

  /**
   * Incrementa a cada nova pancada.
   * Útil para efeitos visuais detectarem impacto novo sem depender só de timestamp.
   */
  serial: number;
}>;

export type HomeDriveImpactCollisionInput = Readonly<{
  /**
   * Estado atual do carro do player no momento da pancada.
   */
  car: HomeDriveCarState;

  /**
   * Normal da colisão apontando na direção para onde o player deve ser empurrado.
   */
  normal: HomeDriveVector2;

  /**
   * Velocidade relativa da colisão.
   */
  relativeSpeedMps: number;

  /**
   * Impulso calculado pela colisão.
   * Se não vier, o módulo estima a partir da velocidade.
   */
  impulse?: number;

  /**
   * Instante da pancada no relógio do jogo.
   */
  occurredAt: number;

  /**
   * Multiplicador arcade.
   * 1 = forte.
   * 1.35+ = grotesco.
   */
  brutality?: number;
}>;

export type HomeDriveImpactTickOptions = Readonly<{
  /**
   * Quanto maior, mais rápido o recoil perde força.
   */
  recoilDampingPerSecond?: number;

  /**
   * Quanto maior, mais rápido o giro perde força.
   */
  spinDampingPerSecond?: number;

  /**
   * Quanto maior, mais rápido a câmera para de tremer.
   */
  cameraShakeDampingPerSecond?: number;

  /**
   * Quanto maior, mais rápido roll/pitch visual volta ao normal.
   */
  visualDampingPerSecond?: number;
}>;

export type HomeDriveImpactApplicationOptions = Readonly<{
  /**
   * Se true, permite o impacto inverter o movimento de maneira mais agressiva.
   */
  allowReverseKick?: boolean;

  /**
   * Limite de velocidade linear residual aplicada no player.
   */
  maxRecoilSpeedMps?: number;

  /**
   * Limite de giro residual aplicado no player.
   */
  maxSpinVelocityRadps?: number;
}>;

const DEFAULT_RECOIL_DAMPING_PER_SECOND = 5.8;
const DEFAULT_SPIN_DAMPING_PER_SECOND = 4.25;
const DEFAULT_CAMERA_SHAKE_DAMPING_PER_SECOND = 8.8;
const DEFAULT_VISUAL_DAMPING_PER_SECOND = 7.2;

const DEFAULT_MAX_RECOIL_SPEED_MPS = 42;
const DEFAULT_MAX_SPIN_VELOCITY_RADPS = 34;

const MIN_ACTIVE_RECOIL_MPS = 0.025;
const MIN_ACTIVE_SPIN_RADPS = 0.025;
const MIN_ACTIVE_SHAKE = 0.003;
const MIN_ACTIVE_VISUAL_RAD = 0.003;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

function damp(value: number, dampingPerSecond: number, deltaSeconds: number): number {
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
        ? impact.recoilVelocity.x
        : empty.recoilVelocity.x,
      z: Number.isFinite(impact.recoilVelocity?.z)
        ? impact.recoilVelocity.z
        : empty.recoilVelocity.z,
    },
    spinVelocityRadps: Number.isFinite(impact.spinVelocityRadps)
      ? impact.spinVelocityRadps
      : empty.spinVelocityRadps,
    visualRollRad: Number.isFinite(impact.visualRollRad)
      ? impact.visualRollRad
      : empty.visualRollRad,
    visualPitchRad: Number.isFinite(impact.visualPitchRad)
      ? impact.visualPitchRad
      : empty.visualPitchRad,
    cameraShake: Number.isFinite(impact.cameraShake)
      ? impact.cameraShake
      : empty.cameraShake,
    collisionImpulse: Number.isFinite(impact.collisionImpulse)
      ? impact.collisionImpulse
      : empty.collisionImpulse,
    controlLockSeconds: Number.isFinite(impact.controlLockSeconds)
      ? impact.controlLockSeconds
      : empty.controlLockSeconds,
    elapsedSinceImpactSeconds: Number.isFinite(impact.elapsedSinceImpactSeconds)
      ? impact.elapsedSinceImpactSeconds
      : empty.elapsedSinceImpactSeconds,
    lastCollisionAt: Number.isFinite(impact.lastCollisionAt)
      ? impact.lastCollisionAt
      : empty.lastCollisionAt,
    serial: Number.isFinite(impact.serial) ? impact.serial : empty.serial,
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
    controlLockSeconds: clamp(
      (0.16 + impulseWeight * 0.14 + speedWeight * 0.08) * brutality,
      0.18,
      0.86,
    ),
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
      currentImpact.collisionImpulse * 0.7,
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
    cameraShakeDampingPerSecond * 0.82,
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
    collisionImpulse: collisionImpulse <= MIN_ACTIVE_SHAKE ? 0 : collisionImpulse,
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

  return clamp(1 - impact.controlLockSeconds * 1.9, 0.12, 1);
}

export function getHomeDriveImpactIntensity(
  impactInput: Partial<HomeDriveRuntimeImpactState> | null | undefined,
): number {
  const impact = normalizeHomeDriveImpactState(impactInput);

  const recoil = clamp(getVectorLength(impact.recoilVelocity) / 28, 0, 1);
  const spin = clamp(Math.abs(impact.spinVelocityRadps) / 24, 0, 1);
  const shake = clamp(impact.cameraShake / 1.8, 0, 1);
  const impulse = clamp(impact.collisionImpulse / 22, 0, 1);

  return clamp(Math.max(recoil, spin, shake, impulse), 0, 1);
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
    impact.controlLockSeconds > 0
  );
}
