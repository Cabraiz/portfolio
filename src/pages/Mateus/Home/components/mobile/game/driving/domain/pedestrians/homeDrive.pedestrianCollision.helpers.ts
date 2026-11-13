// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollision.helpers.ts
// Constantes e helpers da colisão com pedestres.

import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianCollisionEvent,
  HomeDrivePedestrianImpactState,
} from "./homeDrive.pedestrianCollision.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export const DEFAULT_PLAYER_RADIUS_METERS = 1.72;
export const DEFAULT_PEDESTRIAN_RADIUS_METERS = 0.52;
export const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.72;
export const DEFAULT_MAX_CANDIDATE_RADIUS_METERS = 22;
export const DEFAULT_IMPACT_FORWARD_METERS = 5.4;
export const DEFAULT_LATERAL_PADDING_METERS = 1.16;
export const DEFAULT_SPEED_LOOKAHEAD_SECONDS = 0.38;
export const DEFAULT_MAX_IMPACT_FORWARD_METERS = 24;
export const DEFAULT_COOLDOWN_SECONDS = 1.45;
export const DEFAULT_BRUTALITY = 1.92;
export const DEFAULT_SPEED_LOSS_RATIO = 0.18;
export const DEFAULT_MIN_SPEED_AFTER_HIT_MPS = -1.2;
export const DEFAULT_LOCK_SECONDS = 3.85;
export const DEFAULT_INITIAL_LAUNCH_LEAD_SECONDS = 0.105;
export const DEFAULT_ZERO_CAR_SPIN_ON_PEDESTRIAN_IMPACT = true;
export const DEFAULT_PRESERVE_CAR_HEADING = true;
export const DEFAULT_RESET_STEERING_ON_IMPACT = true;
const DEFAULT_LANDED_SETTLE_SECONDS = 45;
export const GRAVITY_MPS2 = 8.7;
export const HALF_PI = Math.PI * 0.5;
export const STALE_IMPACT_TICK_EPSILON_SECONDS = 0.0001;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

export function normalizeVectorOrFallback(
  vector: HomeDriveVector2,
  fallback: HomeDriveVector2,
): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function normalizeAngleRad(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  let normalized = value;

  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }

  while (normalized < -Math.PI) {
    normalized += Math.PI * 2;
  }

  return normalized;
}

function getImpactTravelYawRelativeToAgent(
  agent: HomeDrivePedestrianAgent,
  impact: HomeDrivePedestrianImpactState,
): number {
  const absoluteTravelYaw = Math.atan2(impact.velocity.x, impact.velocity.z);

  return normalizeAngleRad(absoluteTravelYaw - agent.headingRad);
}

export function getLandingPose(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  impact: HomeDrivePedestrianImpactState;
  position: HomeDriveVector2;
  nowSeconds: number;
}>): Pick<
  HomeDrivePedestrianImpactState,
  | "landedAtSeconds"
  | "settledUntilSeconds"
  | "landedPosition"
  | "landingPitchRad"
  | "landingRollRad"
  | "landingYawRad"
  | "pitchRad"
  | "rollRad"
  | "yawRad"
> {
  const sideSign = Math.sign(params.impact.angularVelocity.z) || 1;
  const landingYawRad = getImpactTravelYawRelativeToAgent(
    params.agent,
    params.impact,
  );
  const landingRollRad = sideSign * 0.08;

  /**
   * A pessoa precisa finalizar deitada, com o eixo vertical do rig tombado.
   * Mantemos a rotação final congelada para evitar o efeito de alternar entre
   * a origem do arremesso e o ponto de pouso a cada tick.
   */
  const landingPitchRad = HALF_PI;

  return {
    landedAtSeconds: params.nowSeconds,
    settledUntilSeconds: params.nowSeconds + DEFAULT_LANDED_SETTLE_SECONDS,
    landedPosition: params.position,
    landingPitchRad,
    landingRollRad,
    landingYawRad,
    pitchRad: landingPitchRad,
    rollRad: landingRollRad,
    yawRad: landingYawRad,
  };
}

export function isImpactStateVisible(
  impact: HomeDrivePedestrianImpactState | undefined,
  nowSeconds: number,
): impact is HomeDrivePedestrianImpactState {
  if (!impact) {
    return false;
  }

  /**
   * Depois do pouso o agente não deve voltar para a pose/posição de calçada.
   * O estado abatido passa a ser a fonte de verdade visual e física até que a
   * sessão reinicie ou o pool seja reconstruído. Isso remove o snap em que a
   * pessoa ficava alguns segundos no chão e voltava para a posição inicial.
   */
  if (typeof impact.landedAtSeconds === "number") {
    return true;
  }

  if (impact.active && impact.expiresAtSeconds > nowSeconds) {
    return true;
  }

  return impact.yMeters > 0.025;
}

export function createPedestrianCollisionEvent(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  car: HomeDriveCarState;
  normal: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  severity: number;
  nowSeconds: number;
}>): HomeDrivePedestrianCollisionEvent {
  return {
    id: [
      "pedestrian-collision",
      params.agent.id,
      Math.round(params.nowSeconds * 1000),
      Math.round(params.impulse * 100),
    ].join(":"),
    agentId: params.agent.id,
    position: params.agent.position,
    normal: params.normal,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    severity: params.severity,
    occurredAtSeconds: params.nowSeconds,
  };
}

export function createPedestrianImpactState(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  car: HomeDriveCarState;
  event: HomeDrivePedestrianCollisionEvent;
  serial: number;
  lockSeconds: number;
}>): HomeDrivePedestrianImpactState {
  const forward = getForwardVector(params.car.headingRad);
  const right = getRightVector(params.car.headingRad);
  const sideSign =
    Math.sign(
      (params.agent.position.x - params.car.position.x) * right.x +
        (params.agent.position.z - params.car.position.z) * right.z,
    ) || (params.serial % 2 === 0 ? 1 : -1);
  const severity = params.event.severity;
  const speed = Math.max(
    2.4,
    Math.abs(params.car.speedMps),
    params.event.relativeSpeedMps,
  );

  /**
   * O arremesso precisa ser visualmente legível em escala de tela pequena.
   * Por isso o impulso vertical/frontal é mais forte que a resposta aplicada
   * no carro. O carro perde velocidade, mas não transfere spin para si mesmo.
   */
  const upwardMps = clamp(7.4 + speed * 0.34 + severity * 3.4, 7.4, 18.5);
  const forwardKickMps = clamp(
    4.5 + speed * (0.62 + severity * 0.22),
    6.5,
    30,
  );
  const sideKickMps = sideSign * clamp(2.4 + speed * 0.08 + severity * 0.9, 2.2, 8.4);
  const startedAtSeconds = params.event.occurredAtSeconds;
  const durationSeconds = clamp(params.lockSeconds, 2.2, 5.2);

  return {
    active: true,
    serial: params.serial,
    startedAtSeconds,
    expiresAtSeconds: startedAtSeconds + durationSeconds,
    origin: params.agent.position,
    velocity: {
      x: forward.x * forwardKickMps + right.x * sideKickMps,
      y: upwardMps,
      z: forward.z * forwardKickMps + right.z * sideKickMps,
    },
    angularVelocity: {
      x: sideSign * clamp(10 + speed * 0.42 + severity * 2.2, 10, 34),
      y: sideSign * clamp(7 + speed * 0.34 + severity * 2.4, 7, 30),
      z: -sideSign * clamp(13 + speed * 0.48 + severity * 3.2, 13, 42),
    },
    yMeters: 0,
    pitchRad: 0,
    rollRad: 0,
    yawRad: 0,
    severity,
  };
}
