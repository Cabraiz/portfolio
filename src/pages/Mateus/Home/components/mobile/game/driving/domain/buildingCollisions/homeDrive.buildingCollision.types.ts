// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollision.types.ts

import type { HomeDriveBuilding } from "../homeDrive.building.types";
import type { HomeDriveRuntimeImpactState } from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionDeformation } from "./homeDrive.buildingCollisionDeformation.types";
import type { HomeDriveBuildingCollisionDestruction } from "./homeDrive.buildingCollisionDestruction.types";

export type HomeDriveBuildingCollisionMarkKind =
  | "crack"
  | "dust"
  | "scratch"
  | "comic-burst"
  | "bent-sign"
  | "impact-stain"
  | "concrete-hole"
  | "paint-transfer"
  | "broken-plaster";

export type HomeDriveBuildingCollisionFace =
  | "front"
  | "back"
  | "left"
  | "right";

export type HomeDriveBuildingCollisionBounds = Readonly<{
  buildingId: string;
  center: HomeDriveVector2;
  halfWidthMeters: number;
  halfDepthMeters: number;
  heightMeters: number;
  rotationYRad: number;
  right: HomeDriveVector2;
  forward: HomeDriveVector2;
}>;

export type HomeDriveBuildingCollisionHit = Readonly<{
  building: HomeDriveBuilding;
  bounds: HomeDriveBuildingCollisionBounds;
  face: HomeDriveBuildingCollisionFace;
  normalFromBuildingToPlayer: HomeDriveVector2;
  contactPosition: HomeDriveVector2;
  contactYMeters: number;
  overlapMeters: number;
  distanceMeters: number;
}>;

export type HomeDriveBuildingCollisionEvent = Readonly<{
  buildingId: string;
  buildingKind: HomeDriveBuilding["kind"];
  buildingHeightMeters: number;
  buildingWidthMeters: number;
  buildingDepthMeters: number;
  buildingRotationYRad: number;
  face: HomeDriveBuildingCollisionFace;
  position: HomeDriveVector2;
  normal: HomeDriveVector2;
  contactYMeters: number;
  overlapMeters: number;
  relativeSpeedMps: number;
  impulse: number;
  severity: number;
  message: string;
  occurredAtSeconds: number;
}>;

export type HomeDriveBuildingCollisionMark = Readonly<{
  id: string;
  buildingId: string;
  kind: HomeDriveBuildingCollisionMarkKind;
  message?: string;
  position: HomeDriveVector2;
  normal: HomeDriveVector2;
  rotationYRad: number;
  yMeters: number;
  widthMeters: number;
  heightMeters: number;
  opacity: number;
  severity: number;
  createdAtSeconds: number;
  expiresAtSeconds: number;
  seed: number;
}>;

export type HomeDriveBuildingCollisionRuntimeState = Readonly<{
  serial: number;
  marks: readonly HomeDriveBuildingCollisionMark[];

  /**
   * Legado: marcas/planes de dano superficial.
   *
   * Mantido para compatibilidade de tipos, mas não deve ser usado como fonte
   * principal do dano visual. O buraco real do prédio vem de `destructions`.
   */
  deformations: readonly HomeDriveBuildingCollisionDeformation[];

  /**
   * Dano volumétrico real por prédio.
   *
   * Quando uma construção entra aqui, a instância retangular perfeita dela é
   * ocultada no batch original e substituída por um mesh próprio composto por
   * blocos remanescentes, cavidade interna, fundo escuro e bordas quebradas.
   */
  destructions: readonly HomeDriveBuildingCollisionDestruction[];

  lastCollisionAtByBuildingId: Readonly<Record<string, number>>;
}>;

export type HomeDriveBuildingCollisionOptions = Readonly<{
  enabled?: boolean;
  playerRadiusMeters?: number;
  cooldownSeconds?: number;
  minImpactSpeedMps?: number;
  brutality?: number;
  playerPushMultiplier?: number;
  reverseKickMultiplier?: number;
  maxReverseKickMps?: number;
  maxCandidateBuildings?: number;
  candidateRadiusMeters?: number;

  /**
   * Distância máxima para mesclar pancadas repetidas na mesma região da fachada.
   * Mantém o dano acumulativo em vez de criar dezenas de buracos soltos.
   */
  maxDestructionMergeDistanceMeters?: number;
  maxDestructions?: number;
  maxDestructionZonesPerBuilding?: number;

  /**
   * Quantidade/intensidade de pedregulhos persistentes gerados junto do buraco real.
   */
  maxRubblePiecesPerImpact?: number;
  maxRubblePiecesPerBuilding?: number;
  maxRubblePiecesTotal?: number;
  rubbleIntensity?: number;

  /**
   * Inclinação visual acumulada do prédio danificado.
   * Aplicada apenas no mesh substituto de HomeDriveThreeDamagedBuildings.
   */
  buildingLeanIntensity?: number;
  maxBuildingLeanRad?: number;
  basePivotYOffsetMeters?: number;
}>;

export type HomeDriveBuildingCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  buildingCollisions: HomeDriveBuildingCollisionRuntimeState;
  events: readonly HomeDriveBuildingCollisionEvent[];
  impact: HomeDriveRuntimeImpactState | null;
}>;
