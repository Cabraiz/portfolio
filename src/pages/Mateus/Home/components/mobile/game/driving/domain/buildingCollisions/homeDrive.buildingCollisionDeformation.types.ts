// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDeformation.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionFace,
  HomeDriveBuildingCollisionEvent,
} from "./homeDrive.buildingCollision.types";

export type HomeDriveBuildingDamagePlaneKind =
  | "crater-shadow"
  | "inner-hole"
  | "broken-plaster"
  | "impact-stain"
  | "radial-cracks"
  | "paint-transfer";

export type HomeDriveBuildingDamageChunkKind =
  | "concrete-slab"
  | "broken-plaster"
  | "dark-concrete";

export type HomeDriveBuildingDamageRebarKind = "rebar";

export type HomeDriveBuildingDamageDebrisKind =
  | "concrete"
  | "plaster"
  | "dark-concrete"
  | "dust-clump";

export type HomeDriveBuildingCollisionDeformationKind =
  | "wall-dent"
  | "deep-crater"
  | "collapsed-chunk"
  | "exposed-rebar"
  | "grotesque-facade-damage";

export type HomeDriveBuildingDamagePlane = Readonly<{
  id: string;
  kind: HomeDriveBuildingDamagePlaneKind;
  localX: number;
  localY: number;
  widthMeters: number;
  heightMeters: number;
  rotationZRad: number;
  opacity: number;
  surfaceOffsetMeters: number;
}>;

export type HomeDriveBuildingDamageChunk = Readonly<{
  id: string;
  kind: HomeDriveBuildingDamageChunkKind;
  localX: number;
  localY: number;
  localOutMeters: number;
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
  rotationYRadOffset: number;
  rotationZRad: number;
  opacity: number;
  seed: number;
}>;

export type HomeDriveBuildingDamageRebar = Readonly<{
  id: string;
  kind: HomeDriveBuildingDamageRebarKind;
  localX: number;
  localY: number;
  localOutMeters: number;
  lengthMeters: number;
  radiusMeters: number;
  rotationYRadOffset: number;
  rotationZRad: number;
  bendRatio: number;
  opacity: number;
  seed: number;
}>;

export type HomeDriveBuildingDamageDebrisPiece = Readonly<{
  id: string;
  kind: HomeDriveBuildingDamageDebrisKind;
  localX: number;
  localForwardMeters: number;
  yMeters: number;
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
  rotationYRad: number;
  rotationZRad: number;
  opacity: number;
  seed: number;
}>;

export type HomeDriveBuildingCollisionDeformation = Readonly<{
  id: string;
  kind: HomeDriveBuildingCollisionDeformationKind;
  buildingId: string;
  face: HomeDriveBuildingCollisionFace;
  position: HomeDriveVector2;
  normal: HomeDriveVector2;
  rotationYRad: number;

  /**
   * Âncora local do dano na face atingida.
   *
   * O contato já vem em world-space, então estes valores começam em zero.
   * Eles permitem deslocar camadas/rachaduras sem recalcular a base da face.
   */
  localX: number;
  localY: number;

  yMeters: number;
  severity: number;
  accumulatedSeverity: number;
  hitCount: number;
  radiusMeters: number;
  depthMeters: number;
  opacity: number;
  createdAtSeconds: number;
  updatedAtSeconds: number;

  /**
   * null significa deformação persistente.
   * Use expiração somente para efeitos leves/temporários.
   */
  expiresAtSeconds: number | null;
  isPersistent: boolean;

  seed: number;
  rimSeed: number;
  crackSeed: number;
  stainSeed: number;

  sourceEvent: HomeDriveBuildingCollisionEvent;
  planes: readonly HomeDriveBuildingDamagePlane[];
  chunks: readonly HomeDriveBuildingDamageChunk[];
  rebars: readonly HomeDriveBuildingDamageRebar[];
  debris: readonly HomeDriveBuildingDamageDebrisPiece[];
}>;

export type HomeDriveBuildingCollisionDeformationRuntimePatch = Readonly<{
  deformations: readonly HomeDriveBuildingCollisionDeformation[];
}>;

export type HomeDriveBuildingCollisionDeformationCreationOptions = Readonly<{
  /**
   * Mantido para compatibilidade, mas por padrão o dano principal é persistente.
   */
  lifetimeSeconds?: number;
  persistent?: boolean;
  maxDeformations?: number;
  maxChunksPerImpact?: number;
  maxRebarsPerImpact?: number;
  maxDebrisPiecesPerImpact?: number;
  mergeDistanceMeters?: number;
}>;
