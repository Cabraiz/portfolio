// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCarImpact.ts

import {
  createHomeDriveImpactFromCollision,
  type HomeDriveRuntimeImpactState,
} from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";

export type HomeDrivePedestrianCarImpactOptions = Readonly<{
  recoilMultiplier?: number;
  cameraShakeMultiplier?: number;
  visualPitchMultiplier?: number;
  controlLockMultiplier?: number;
  collisionImpulseMultiplier?: number;
}>;

const DEFAULT_RECOIL_MULTIPLIER = 0.62;
const DEFAULT_CAMERA_SHAKE_MULTIPLIER = 0.64;
const DEFAULT_VISUAL_PITCH_MULTIPLIER = 0.34;
const DEFAULT_CONTROL_LOCK_MULTIPLIER = 0.72;
const DEFAULT_COLLISION_IMPULSE_MULTIPLIER = 0.82;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clampAbs(value: number, maxAbs: number): number {
  return clamp(value, -maxAbs, maxAbs);
}

function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

/**
 * Impacto específico para colisão com pedestre.
 *
 * A colisão com prédio/carro pode girar o player, mas uma pessoa não deve
 * aplicar torque suficiente para rodar o carro. Portanto este impacto mantém:
 *
 * - recoil/recuo longitudinal para sensação de batida;
 * - perda de controle curta;
 * - camera shake moderado;
 * - zero spin físico no heading;
 * - zero roll visual da câmera/carro.
 *
 * O pedestre continua com trajetória balística própria em
 * `homeDrive.pedestrianCollision.ts`.
 */
export function createHomeDriveStablePedestrianCarImpact(params: Readonly<{
  car: HomeDriveCarState;
  normal: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  occurredAt: number;
  brutality: number;
  options?: HomeDrivePedestrianCarImpactOptions;
}>): HomeDriveRuntimeImpactState {
  const baseImpact = createHomeDriveImpactFromCollision({
    car: params.car,
    normal: params.normal,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    occurredAt: params.occurredAt,
    brutality: params.brutality,
  });

  const options = params.options ?? {};
  const recoilMultiplier =
    options.recoilMultiplier ?? DEFAULT_RECOIL_MULTIPLIER;
  const cameraShakeMultiplier =
    options.cameraShakeMultiplier ?? DEFAULT_CAMERA_SHAKE_MULTIPLIER;
  const visualPitchMultiplier =
    options.visualPitchMultiplier ?? DEFAULT_VISUAL_PITCH_MULTIPLIER;
  const controlLockMultiplier =
    options.controlLockMultiplier ?? DEFAULT_CONTROL_LOCK_MULTIPLIER;
  const collisionImpulseMultiplier =
    options.collisionImpulseMultiplier ?? DEFAULT_COLLISION_IMPULSE_MULTIPLIER;

  const forward = getForwardVector(params.car.headingRad);
  const speed = Math.max(0, Math.abs(params.relativeSpeedMps));
  const impulse = Math.max(0, params.impulse);
  const recoilStrength = clamp(
    (1.35 + speed * 0.15 + impulse * 0.07) * recoilMultiplier,
    1.2,
    8.5,
  );

  return {
    ...baseImpact,

    /**
     * Mantém somente um tranco contra o eixo de marcha do carro.
     * Sem componente lateral, o carro não entra em rotação por impacto humano.
     */
    recoilVelocity: {
      x: -forward.x * recoilStrength,
      z: -forward.z * recoilStrength,
    },

    /**
     * Campo que `applyHomeDriveImpactToCar` usa para alterar `headingRad`.
     * Para pedestre precisa ser zero.
     */
    spinVelocityRadps: 0,

    /**
     * Evita o efeito visual de o carro/câmera tombar lateralmente na batida.
     */
    visualRollRad: 0,

    /**
     * Pequeno pitch frontal ainda dá impacto sem parecer giro lateral.
     */
    visualPitchRad: clampAbs(
      baseImpact.visualPitchRad * visualPitchMultiplier,
      0.22,
    ),

    cameraShake: clamp(
      baseImpact.cameraShake * cameraShakeMultiplier,
      0.08,
      1.15,
    ),
    collisionImpulse: clamp(
      baseImpact.collisionImpulse * collisionImpulseMultiplier,
      0,
      34,
    ),
    controlLockSeconds: clamp(
      baseImpact.controlLockSeconds * controlLockMultiplier,
      0.18,
      1.15,
    ),
  };
}
