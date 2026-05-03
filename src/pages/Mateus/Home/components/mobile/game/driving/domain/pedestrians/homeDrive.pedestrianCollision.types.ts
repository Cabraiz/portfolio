// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollision.types.ts

import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveRuntimeImpactState } from "../homeDrive.impact";

export type HomeDrivePedestrianCollisionVector3 = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

export type HomeDrivePedestrianImpactState = Readonly<{
  active: boolean;
  serial: number;
  startedAtSeconds: number;
  expiresAtSeconds: number;

  /**
   * Último relógio absoluto usado para resolver a parábola.
   *
   * Protege contra ticks atrasados: depois do initial launch lead, nenhum tick
   * pode recalcular o mesmo impacto com tempo menor e puxar o agente para trás.
   */
  lastTickedAtSeconds?: number;

  origin: HomeDriveVector2;
  velocity: HomeDrivePedestrianCollisionVector3;
  angularVelocity: HomeDrivePedestrianCollisionVector3;
  yMeters: number;
  pitchRad: number;
  rollRad: number;
  yawRad: number;
  severity: number;

  /**
   * Landing state freezes the last ballistic frame.
   * Without this guard the normal pedestrian tick can move the agent back to
   * its sidewalk slot, while the ballistic tick snaps it back to the computed
   * endpoint on the next frame.
   */
  landedAtSeconds?: number;
  settledUntilSeconds?: number;
  landedPosition?: HomeDriveVector2;
  landingPitchRad?: number;
  landingRollRad?: number;
  landingYawRad?: number;
}>;

export type HomeDrivePedestrianCollisionEvent = Readonly<{
  id: string;
  agentId: string;
  position: HomeDriveVector2;
  normal: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  severity: number;
  occurredAtSeconds: number;
}>;

export type HomeDrivePedestrianCollisionOptions = Readonly<{
  enabled?: boolean;
  playerRadiusMeters?: number;
  pedestrianRadiusMeters?: number;
  minImpactSpeedMps?: number;
  maxCandidateRadiusMeters?: number;
  impactForwardMeters?: number;
  lateralPaddingMeters?: number;
  speedLookaheadSeconds?: number;
  maxImpactForwardMeters?: number;
  cooldownSeconds?: number;
  brutality?: number;
  speedLossRatio?: number;
  minSpeedAfterHitMps?: number;
  lockSeconds?: number;
  initialLaunchLeadSeconds?: number;

  /**
   * Colisão com pessoa não deve aplicar spin/torque no carro.
   * Mantido true por padrão.
   */
  zeroCarSpinOnPedestrianImpact?: boolean;

  /** Preserva o heading absoluto do carro no instante da colisão. */
  preserveCarHeading?: boolean;

  /** Zera o esterço no impacto para evitar giro residual no frame seguinte. */
  resetSteeringOnImpact?: boolean;

  carRecoilMultiplier?: number;
  carCameraShakeMultiplier?: number;
  carVisualPitchMultiplier?: number;
  carControlLockMultiplier?: number;
  carCollisionImpulseMultiplier?: number;
}>;

export type HomeDrivePedestrianCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  agents: readonly import("./homeDrive.pedestrians.types").HomeDrivePedestrianAgent[];
  events: readonly HomeDrivePedestrianCollisionEvent[];
  impact: HomeDriveRuntimeImpactState | null;
}>;
