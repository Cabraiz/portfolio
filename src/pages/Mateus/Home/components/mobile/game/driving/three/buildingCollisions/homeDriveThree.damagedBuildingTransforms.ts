// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingTransforms.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type { HomeDriveBuildingLeanState } from "../../domain/buildingCollisions/homeDrive.buildingCollisionLean.types";
import type { HomeDriveThreeDamagedBuildingBoxPart } from "./homeDriveThree.damagedBuildingGeometry";

type ThreeTuple = [number, number, number];

export type HomeDriveThreeDamagedBuildingGroupTransform = Readonly<{
  position: ThreeTuple;
  rotation: ThreeTuple;
}>;

export type HomeDriveThreeDamagedBuildingPartTransform = Readonly<{
  position: ThreeTuple;
  rotation: ThreeTuple;
  scale: ThreeTuple;
}>;

function clampLean(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-0.18, Math.min(0.18, value));
}

export function getHomeDriveThreeDamagedBuildingGroupTransform(
  building: HomeDriveBuilding,
  lean?: HomeDriveBuildingLeanState | null,
): HomeDriveThreeDamagedBuildingGroupTransform {
  return {
    /*
     * Pivot na base: as partes do prédio usam localY a partir de 0.
     * Assim, ao inclinar o group, o topo cede e a base permanece visualmente presa.
     */
    position: [
      building.position.x,
      lean?.basePivotYOffsetMeters ?? 0,
      building.position.z,
    ],
    rotation: [
      clampLean(lean?.leanXRad ?? 0),
      building.rotationYRad,
      clampLean(lean?.leanZRad ?? 0),
    ],
  };
}

export function getHomeDriveThreeDamagedBuildingPartTransform(
  part: HomeDriveThreeDamagedBuildingBoxPart,
): HomeDriveThreeDamagedBuildingPartTransform {
  return {
    position: [
      part.localPosition[0],
      part.localPosition[1],
      part.localPosition[2],
    ],
    rotation: [0, 0, 0],
    scale: [
      part.localScale[0],
      part.localScale[1],
      part.localScale[2],
    ],
  };
}
