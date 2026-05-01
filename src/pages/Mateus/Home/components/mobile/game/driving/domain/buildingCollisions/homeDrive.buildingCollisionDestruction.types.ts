// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionFace,
} from "./homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingLeanCreationOptions,
  HomeDriveBuildingLeanState,
} from "./homeDrive.buildingCollisionLean.types";
import type {
  HomeDriveBuildingRubbleCreationOptions,
  HomeDriveBuildingRubblePiece,
} from "./homeDrive.buildingCollisionRubble.types";

export type HomeDriveBuildingDestructionFace = HomeDriveBuildingCollisionFace;

export type HomeDriveBuildingDestructionEdgePoint = Readonly<{
  /** Horizontal offset around the rectangular bite, normalized from -1 to 1. */
  x: number;

  /** Vertical offset around the rectangular bite, normalized from -1 to 1. */
  y: number;

  /** Extra irregularity in meters for chipped/ragged edges. */
  offsetMeters: number;
}>;

export type HomeDriveBuildingDestructionZone = Readonly<{
  id: string;
  buildingId: string;
  face: HomeDriveBuildingDestructionFace;

  /**
   * Horizontal center of the removed block in the impacted face local frame.
   * For front/back this maps to local X. For left/right this maps to local Z.
   */
  localX: number;

  /** Vertical center from the building base, in meters. */
  localY: number;

  worldPosition: HomeDriveVector2;
  normal: HomeDriveVector2;
  rotationYRad: number;

  holeWidthMeters: number;
  holeHeightMeters: number;
  holeDepthMeters: number;

  severity: number;
  accumulatedSeverity: number;
  hitCount: number;

  createdAtSeconds: number;
  updatedAtSeconds: number;
  seed: number;

  /** Deterministic jagged rim profile used by the renderer. */
  edgeProfile: readonly HomeDriveBuildingDestructionEdgePoint[];

  /** Last collision event that updated this zone. */
  sourceEvent: HomeDriveBuildingCollisionEvent;
}>;

export type HomeDriveBuildingCollisionDestruction = Readonly<{
  id: string;
  buildingId: string;
  zones: readonly HomeDriveBuildingDestructionZone[];

  /** Pedregulhos persistentes gerados por esta destruição real. */
  rubble: readonly HomeDriveBuildingRubblePiece[];

  /** Inclinação acumulada do prédio, aplicada com pivot na base. */
  lean: HomeDriveBuildingLeanState;

  strongestSeverity: number;
  totalHitCount: number;
  createdAtSeconds: number;
  updatedAtSeconds: number;
  serial: number;
}>;

export type HomeDriveBuildingCollisionDestructionRuntimePatch = Readonly<{
  destructions: readonly HomeDriveBuildingCollisionDestruction[];
}>;

export type HomeDriveBuildingCollisionDestructionCreationOptions =
  HomeDriveBuildingRubbleCreationOptions &
    HomeDriveBuildingLeanCreationOptions &
    Readonly<{
      maxDestructions?: number;
      maxZonesPerBuilding?: number;
      mergeDistanceMeters?: number;

      /** Optional building center. When supplied, localX is computed precisely. */
      buildingCenter?: HomeDriveVector2;

      /** Overrides used by the resolver when it already knows the local hit point. */
      localXMeters?: number;
      localYMeters?: number;
    }>;
