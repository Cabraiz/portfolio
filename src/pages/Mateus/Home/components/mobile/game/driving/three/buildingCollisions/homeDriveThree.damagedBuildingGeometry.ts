// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingGeometry.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type {
  HomeDriveBuildingCollisionDestruction,
  HomeDriveBuildingDestructionZone,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionDestruction.types";
import {
  createHomeDriveThreeDamagedBuildingBreachParts,
} from "./homeDriveThree.damagedBuildingBreach";

export type HomeDriveThreeDamagedBuildingMaterialSlot =
  | "body"
  | "interior"
  | "shadow"
  | "fracture"
  | "rim";

export type HomeDriveThreeDamagedBuildingBoxPart = Readonly<{
  id: string;
  materialSlot: HomeDriveThreeDamagedBuildingMaterialSlot;
  localPosition: readonly [number, number, number];
  localScale: readonly [number, number, number];
  renderOrder: number;
}>;

function getPrimaryZone(
  destruction: HomeDriveBuildingCollisionDestruction,
): HomeDriveBuildingDestructionZone | null {
  if (destruction.zones.length <= 0) {
    return null;
  }

  return [...destruction.zones].sort((first, second) => {
    return (
      second.severity * 2 + second.hitCount * 0.22 -
      (first.severity * 2 + first.hitCount * 0.22)
    );
  })[0] ?? null;
}

function createIntactFallbackPart(
  building: HomeDriveBuilding,
): readonly HomeDriveThreeDamagedBuildingBoxPart[] {
  return [
    {
      id: `${building.id}:intact-body`,
      materialSlot: "body",
      localPosition: [0, building.heightMeters * 0.5, 0],
      localScale: [
        building.widthMeters,
        building.heightMeters,
        building.depthMeters,
      ],
      renderOrder: 72,
    },
  ];
}

export function createHomeDriveThreeDamagedBuildingParts(params: Readonly<{
  building: HomeDriveBuilding;
  destruction: HomeDriveBuildingCollisionDestruction;
}>): readonly HomeDriveThreeDamagedBuildingBoxPart[] {
  const { building, destruction } = params;
  const zone = getPrimaryZone(destruction);

  if (!zone) {
    return createIntactFallbackPart(building);
  }

  const breachParts = createHomeDriveThreeDamagedBuildingBreachParts({
    building,
    zone,
  });

  if (breachParts.length <= 0) {
    return createIntactFallbackPart(building);
  }

  return breachParts.map((part): HomeDriveThreeDamagedBuildingBoxPart => ({
    id: part.id,
    materialSlot: part.materialSlot,
    localPosition: part.localPosition,
    localScale: part.localScale,
    renderOrder: part.renderOrder,
  }));
}
