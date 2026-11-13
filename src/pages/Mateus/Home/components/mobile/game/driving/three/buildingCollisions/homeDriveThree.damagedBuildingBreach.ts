// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingBreach.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import {
	type HomeDriveThreeDamagedBuildingBreachBoxPart,
	type HomeDriveThreeDamagedBuildingBreachZoneLike,
	type FaceSpaceBox,
	getFaceWidthMeters,
	getFaceDepthMeters,
	faceBoxToLocalBox,
	getZoneBreachProfile,
} from "./homeDriveThree.damagedBuildingBreach.faceSpace";
import {
	addRemainingWallMass,
	addInteriorCavity,
} from "./homeDriveThree.damagedBuildingBreach.wallMass";
import { addRaggedRim } from "./homeDriveThree.damagedBuildingBreach.raggedRim";
export type {
	HomeDriveThreeDamagedBuildingBreachMaterialSlot,
	HomeDriveThreeDamagedBuildingBreachBoxPart,
	HomeDriveThreeDamagedBuildingBreachZoneLike,
} from "./homeDriveThree.damagedBuildingBreach.faceSpace";

export function createHomeDriveThreeDamagedBuildingBreachParts(
  params: Readonly<{
    building: HomeDriveBuilding;
    zone: HomeDriveThreeDamagedBuildingBreachZoneLike;
  }>,
): readonly HomeDriveThreeDamagedBuildingBreachBoxPart[] {
  const { building, zone } = params;
  const profile = getZoneBreachProfile({ building, zone });

  if (profile.samples.length < 2) {
    return [];
  }

  const faceWidthMeters = getFaceWidthMeters(building, profile.face);
  const faceDepthMeters = getFaceDepthMeters(building, profile.face);
  const faceBoxes: FaceSpaceBox[] = [];

  addRemainingWallMass({
    boxes: faceBoxes,
    building,
    profile,
    faceWidthMeters,
    faceDepthMeters,
  });

  addInteriorCavity({
    boxes: faceBoxes,
    profile,
    faceWidthMeters,
    faceDepthMeters,
  });

  addRaggedRim({
    boxes: faceBoxes,
    profile,
    faceWidthMeters,
    faceDepthMeters,
  });

  return faceBoxes
    .map((box) => faceBoxToLocalBox(profile.face, box))
    .sort((first, second) => first.renderOrder - second.renderOrder);
}
