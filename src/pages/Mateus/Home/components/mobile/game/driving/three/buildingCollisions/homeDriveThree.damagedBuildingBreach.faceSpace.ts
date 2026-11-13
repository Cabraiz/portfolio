// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingBreach.faceSpace.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import {
	createHomeDriveBuildingCollisionBreachProfileFromZone,
	normalizeHomeDriveBuildingCollisionBreachProfile,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionBreach";
import type {
	HomeDriveBuildingCollisionBreachFace,
	HomeDriveBuildingCollisionBreachProfile,
	HomeDriveBuildingCollisionBreachSample,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionBreach.types";

export type HomeDriveThreeDamagedBuildingBreachMaterialSlot =
  | "body"
  | "interior"
  | "shadow"
  | "fracture"
  | "rim";

export type HomeDriveThreeDamagedBuildingBreachBoxPart = Readonly<{
  id: string;
  materialSlot: HomeDriveThreeDamagedBuildingBreachMaterialSlot;
  localPosition: readonly [number, number, number];
  localScale: readonly [number, number, number];
  renderOrder: number;
}>;

export type HomeDriveThreeDamagedBuildingBreachZoneLike = Readonly<{
  id: string;
  buildingId: string;
  face: HomeDriveBuildingCollisionBreachFace;
  localX: number;
  localY: number;

  holeWidthMeters: number;
  holeHeightMeters: number;
  holeDepthMeters: number;

  holeBottomMeters?: number;
  holeTopMeters?: number;

  severity: number;
  createdAtSeconds: number;
  updatedAtSeconds?: number;
  seed: number;

  normal?: Readonly<{
    x: number;
    z: number;
  }>;

  breachProfile?: HomeDriveBuildingCollisionBreachProfile;
  breachSamples?: readonly HomeDriveBuildingCollisionBreachSample[];
}>;

export type FaceSpaceBox = Readonly<{
  id: string;
  materialSlot: HomeDriveThreeDamagedBuildingBreachMaterialSlot;
  uCenter: number;
  yCenter: number;
  nCenter: number;
  uSize: number;
  ySize: number;
  nSize: number;
  renderOrder: number;
}>;

const MIN_PART_SIZE_METERS = 0.045;
export const MIN_SEGMENT_HEIGHT_METERS = 0.08;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function getFaceWidthMeters(
  building: HomeDriveBuilding,
  face: HomeDriveBuildingCollisionBreachFace,
): number {
  return face === "front" || face === "back"
    ? building.widthMeters
    : building.depthMeters;
}

export function getFaceDepthMeters(
  building: HomeDriveBuilding,
  face: HomeDriveBuildingCollisionBreachFace,
): number {
  return face === "front" || face === "back"
    ? building.depthMeters
    : building.widthMeters;
}

function faceSpaceToBuildingLocal(
  face: HomeDriveBuildingCollisionBreachFace,
  u: number,
  y: number,
  n: number,
): readonly [number, number, number] {
  switch (face) {
    case "back":
      return [-u, y, -n];

    case "right":
      return [n, y, -u];

    case "left":
      return [-n, y, u];

    case "front":
    default:
      return [u, y, n];
  }
}

export function faceBoxToLocalBox(
  face: HomeDriveBuildingCollisionBreachFace,
  box: FaceSpaceBox,
): HomeDriveThreeDamagedBuildingBreachBoxPart {
  const localPosition = faceSpaceToBuildingLocal(
    face,
    box.uCenter,
    box.yCenter,
    box.nCenter,
  );

  const isFrontBack = face === "front" || face === "back";

  return {
    id: box.id,
    materialSlot: box.materialSlot,
    localPosition,
    localScale: isFrontBack
      ? [box.uSize, box.ySize, box.nSize]
      : [box.nSize, box.ySize, box.uSize],
    renderOrder: box.renderOrder,
  };
}

export function pushFaceBoxIfVisible(
  boxes: FaceSpaceBox[],
  box: FaceSpaceBox,
): void {
  if (
    box.uSize <= MIN_PART_SIZE_METERS ||
    box.ySize <= MIN_PART_SIZE_METERS ||
    box.nSize <= MIN_PART_SIZE_METERS
  ) {
    return;
  }

  boxes.push(box);
}

export function getZoneBreachProfile(params: Readonly<{
  building: HomeDriveBuilding;
  zone: HomeDriveThreeDamagedBuildingBreachZoneLike;
}>): HomeDriveBuildingCollisionBreachProfile {
  const { building, zone } = params;

  if (zone.breachProfile) {
    return normalizeHomeDriveBuildingCollisionBreachProfile(zone.breachProfile);
  }

  if (zone.breachSamples && zone.breachSamples.length > 0) {
    return normalizeHomeDriveBuildingCollisionBreachProfile({
      id: `${zone.id}:breach:inline`,
      buildingId: zone.buildingId,
      face: zone.face,
      localX: zone.localX,
      normal: zone.normal ?? { x: 0, z: 1 },
      bottomMeters: zone.holeBottomMeters ?? 0,
      topMeters:
        zone.holeTopMeters ??
        Math.max(zone.holeHeightMeters, zone.localY + zone.holeHeightMeters * 0.5),
      heightMeters:
        (zone.holeTopMeters ??
          Math.max(
            zone.holeHeightMeters,
            zone.localY + zone.holeHeightMeters * 0.5,
          )) - (zone.holeBottomMeters ?? 0),
      maxHalfWidthMeters: zone.holeWidthMeters * 0.5,
      maxDepthMeters: zone.holeDepthMeters,
      samples: zone.breachSamples,
      severity: zone.severity,
      createdAtSeconds: zone.createdAtSeconds,
      seed: zone.seed,
    });
  }

  return createHomeDriveBuildingCollisionBreachProfileFromZone({
    id: zone.id,
    buildingId: zone.buildingId,
    face: zone.face,
    localX: zone.localX,
    normal: zone.normal ?? { x: 0, z: 1 },
    buildingHeightMeters: building.heightMeters,
    buildingWidthMeters: building.widthMeters,
    buildingDepthMeters: building.depthMeters,
    holeWidthMeters: zone.holeWidthMeters,
    holeHeightMeters: zone.holeHeightMeters,
    holeDepthMeters: zone.holeDepthMeters,
    severity: zone.severity,
    createdAtSeconds: zone.createdAtSeconds,
    seed: zone.seed,
  });
}

export function getSampleEdges(params: Readonly<{
  profile: HomeDriveBuildingCollisionBreachProfile;
  sample: HomeDriveBuildingCollisionBreachSample;
  faceHalfWidthMeters: number;
}>): Readonly<{
  left: number;
  right: number;
  width: number;
  center: number;
  depth: number;
}> {
  const { profile, sample, faceHalfWidthMeters } = params;

  const rawCenter = profile.localX + sample.centerOffsetMeters;
  const rawLeft =
    rawCenter - sample.halfWidthMeters - sample.leftFractureMeters * 0.34;
  const rawRight =
    rawCenter + sample.halfWidthMeters + sample.rightFractureMeters * 0.34;

  const left = clamp(rawLeft, -faceHalfWidthMeters + 0.04, faceHalfWidthMeters - 0.08);
  const right = clamp(rawRight, left + 0.08, faceHalfWidthMeters - 0.04);
  const width = Math.max(0.08, right - left);
  const center = (left + right) * 0.5;

  return {
    left,
    right,
    width,
    center,
    depth: Math.max(0.08, sample.depthMeters),
  };
}
