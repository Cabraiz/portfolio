// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianImpactVisual.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";

export type HomeDriveThreePedestrianImpactVisual = Readonly<{
  isActive: boolean;
  isLanded: boolean;
  yOffsetMeters: number;
  pitchRad: number;
  yawRad: number;
  rollRad: number;
  suppressesLocomotionPose: boolean;
}>;

const EMPTY_IMPACT_VISUAL: HomeDriveThreePedestrianImpactVisual = Object.freeze({
  isActive: false,
  isLanded: false,
  yOffsetMeters: 0,
  pitchRad: 0,
  yawRad: 0,
  rollRad: 0,
  suppressesLocomotionPose: false,
});

const LANDED_BODY_Y_OFFSET_METERS = 0.10;
const LANDED_FALLBACK_PITCH_RAD = Math.PI * 0.5;

function safeFinite(value: number | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Transforma o estado balístico do domínio em offset/rotação de render.
 *
 * Importante: pouso não é animação procedural. Quando `landedAtSeconds` existe,
 * a pose fica congelada em corpo deitado para baixo. Isso impede o bug de
 * alternar entre a origem do arremesso e o ponto final enquanto o tick normal
 * tenta voltar o agente para a calçada.
 */
export function getHomeDriveThreePedestrianImpactVisual(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianImpactVisual {
  const impact = agent.pedestrianImpact;

  if (!impact) {
    return EMPTY_IMPACT_VISUAL;
  }

  const isLanded = typeof impact.landedAtSeconds === "number";

  if (isLanded) {
    return {
      isActive: true,
      isLanded: true,
      yOffsetMeters: LANDED_BODY_Y_OFFSET_METERS,
      pitchRad: safeFinite(impact.landingPitchRad, LANDED_FALLBACK_PITCH_RAD),
      yawRad: safeFinite(impact.landingYawRad, impact.yawRad),
      rollRad: safeFinite(impact.landingRollRad, 0),
      suppressesLocomotionPose: true,
    };
  }

  const yOffsetMeters = Math.max(0, safeFinite(impact.yMeters));
  const isActive = Boolean(impact.active) || yOffsetMeters > 0.01;

  if (!isActive) {
    return EMPTY_IMPACT_VISUAL;
  }

  return {
    isActive,
    isLanded: false,
    yOffsetMeters,
    pitchRad: safeFinite(impact.pitchRad),
    yawRad: safeFinite(impact.yawRad),
    rollRad: safeFinite(impact.rollRad),
    suppressesLocomotionPose: true,
  };
}
