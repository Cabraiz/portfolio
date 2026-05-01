// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBreach.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionFace,
} from "./homeDrive.buildingCollision.types";

export type HomeDriveBuildingCollisionBreachFace =
  HomeDriveBuildingCollisionFace;

export type HomeDriveBuildingCollisionBreachSample = Readonly<{
  /** 0 = chão/base do prédio. 1 = topo do buraco. */
  yRatio: number;

  /** Altura real desse ponto da brecha a partir do chão do prédio. */
  yMeters: number;

  /** Deslocamento horizontal do centro da brecha nesse ponto. */
  centerOffsetMeters: number;

  /** Metade da largura removida nessa altura. */
  halfWidthMeters: number;

  /** Profundidade removida nessa altura. */
  depthMeters: number;

  /** Irregularidade extra no lado esquerdo da fratura. */
  leftFractureMeters: number;

  /** Irregularidade extra no lado direito da fratura. */
  rightFractureMeters: number;

  /** Espessura sugerida da borda quebrada nesse ponto. */
  rimThicknessMeters: number;

  /** Peso visual para concentrar pedra/poeira nas áreas mais violentas. */
  rubbleWeight: number;

  /** Intensidade de sombra interna da cavidade. */
  shadowOpacity: number;

  seed: number;
}>;

export type HomeDriveBuildingCollisionBreachProfile = Readonly<{
  id: string;
  buildingId: string;
  face: HomeDriveBuildingCollisionBreachFace;

  /**
   * Centro horizontal base da brecha no espaço local da face.
   * Para front/back usa eixo local X.
   * Para left/right usa eixo local Z convertido pelo renderer.
   */
  localX: number;

  /** Normal da face atingida no mundo. */
  normal: HomeDriveVector2;

  /** O buraco profissional fica ancorado no chão. */
  bottomMeters: number;

  /** Topo real do buraco a partir do chão do prédio. */
  topMeters: number;

  heightMeters: number;
  maxHalfWidthMeters: number;
  maxDepthMeters: number;

  /** Amostras verticais que descrevem a silhueta irregular. */
  samples: readonly HomeDriveBuildingCollisionBreachSample[];

  severity: number;
  createdAtSeconds: number;
  seed: number;
}>;

export type HomeDriveBuildingCollisionBreachCreationInput = Readonly<{
  event: HomeDriveBuildingCollisionEvent;

  /** Use quando o resolver de colisão já calculou o localX exato. */
  localX?: number;

  /** Sufixo determinístico para diferenciar múltiplos perfis do mesmo evento. */
  idSuffix?: string;
}>;

export type HomeDriveBuildingCollisionBreachFromZoneInput = Readonly<{
  id: string;
  buildingId: string;
  face: HomeDriveBuildingCollisionBreachFace;
  localX: number;
  normal: HomeDriveVector2;

  buildingHeightMeters: number;
  buildingWidthMeters: number;
  buildingDepthMeters: number;

  holeWidthMeters: number;
  holeHeightMeters: number;
  holeDepthMeters: number;

  severity: number;
  createdAtSeconds: number;
  seed: number;
}>;

export type HomeDriveBuildingCollisionBreachCreationOptions = Readonly<{
  minSamples?: number;
  maxSamples?: number;

  /** Percentual máximo da altura do prédio que o buraco pode alcançar. */
  maxHeightRatio?: number;

  /** Percentual mínimo da altura do prédio que o buraco deve alcançar. */
  minHeightRatio?: number;

  /** Percentual máximo da largura da face ocupado pela brecha. */
  maxWidthRatio?: number;
  minWidthRatio?: number;

  /** Percentual da profundidade da face removida. */
  maxDepthRatio?: number;
  minDepthRatio?: number;

  /** Intensidade de irregularidade horizontal. */
  jaggedness?: number;

  /** Força a brecha a começar no chão. Mantido true por padrão. */
  anchorToGround?: boolean;
}>;

export type HomeDriveBuildingCollisionBreachZonePatch = Readonly<{
  holeBottomMeters: number;
  holeTopMeters: number;
  holeWidthMeters: number;
  holeHeightMeters: number;
  holeDepthMeters: number;
  breachProfile: HomeDriveBuildingCollisionBreachProfile;
}>;
