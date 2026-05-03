// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollisionGuard.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDrivePedestrianCollisionGuardFrame = Readonly<{
  forwardMeters: number;
  lateralMeters: number;
  absoluteLateralMeters: number;
  distanceMeters: number;
  isAhead: boolean;
  isInsideImpactCapsule: boolean;
  isInsideNearStabilityCapsule: boolean;
}>;

export type HomeDrivePedestrianCollisionGuardOptions = Readonly<{
  carPosition: HomeDriveVector2;
  carHeadingRad: number;
  carSpeedMps: number;
  nowSeconds?: number;

  /** Raio físico aproximado do carro no plano XZ. */
  carRadiusMeters?: number;

  /** Raio físico aproximado do pedestre no plano XZ. */
  pedestrianRadiusMeters?: number;

  /** Janela frontal onde o pedestre não pode ser teleportado/reclamado. */
  impactForwardMeters?: number;

  /** Proteção extra baseada na velocidade para impedir sumiço em alta velocidade. */
  speedLookaheadSeconds?: number;

  /** Limite absoluto da cápsula frontal de colisão. */
  maxImpactForwardMeters?: number;

  /** Largura lateral da cápsula de colisão/estabilidade. */
  lateralPaddingMeters?: number;

  /** Margem atrás do carro antes de liberar reciclagem. */
  rearPaddingMeters?: number;

  /** Janela mais ampla onde o pedestre ainda precisa ficar estável/visível. */
  nearStabilityForwardMeters?: number;
  nearStabilityLateralMeters?: number;
}>;
