// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionRubble.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDriveBuildingRubblePieceKind =
  | "concrete-boulder"
  | "concrete-rock"
  | "small-stone"
  | "plaster-shard"
  | "broken-slab"
  | "dust-mound"
  | "rebar-piece";

export type HomeDriveBuildingRubblePiece = Readonly<{
  id: string;
  buildingId: string;
  sourceDestructionId?: string;
  sourceZoneId?: string;
  kind: HomeDriveBuildingRubblePieceKind;

  /** Posição em mundo, em metros. */
  position: HomeDriveVector2;

  /** Normal da face atingida. Aponta do prédio para fora, na direção do carro. */
  normal: HomeDriveVector2;

  /** Deslocamentos locais preservados para debug/rebuild. */
  localSideMeters: number;
  localForwardMeters: number;

  yMeters: number;
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;

  rotationXRad: number;
  rotationYRad: number;
  rotationZRad: number;

  opacity: number;
  severity: number;
  createdAtSeconds: number;
  seed: number;
}>;

export type HomeDriveBuildingRubbleCreationOptions = Readonly<{
  rubbleIntensity?: number;
  minRubblePiecesPerImpact?: number;
  maxRubblePiecesPerImpact?: number;
  maxRubblePiecesPerBuilding?: number;
  maxRubblePiecesTotal?: number;
  sourceDestructionId?: string;
  sourceZoneId?: string;
}>;

export type HomeDriveBuildingRubbleRuntimePatch = Readonly<{
  rubble: readonly HomeDriveBuildingRubblePiece[];
}>;
