// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionLean.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDriveBuildingLeanState = Readonly<{
  buildingId: string;

  /**
   * Rotação visual aplicada com pivot na base do prédio.
   * Esses valores são pequenos por design para parecer cedência estrutural,
   * não um prédio girando solto no ar.
   */
  leanXRad: number;
  leanZRad: number;

  /** Vetor horizontal para onde o topo aparenta ceder. */
  leanDirection: HomeDriveVector2;

  visualLeanIntensity: number;
  accumulatedImpulse: number;
  hitCount: number;
  lastImpactNormal: HomeDriveVector2;
  basePivotYOffsetMeters: number;
  createdAtSeconds: number;
  updatedAtSeconds: number;
}>;

export type HomeDriveBuildingLeanCreationOptions = Readonly<{
  buildingLeanIntensity?: number;
  maxBuildingLeanRad?: number;
  basePivotYOffsetMeters?: number;
}>;

export type HomeDriveBuildingLeanRuntimePatch = Readonly<{
  lean: HomeDriveBuildingLeanState;
}>;
