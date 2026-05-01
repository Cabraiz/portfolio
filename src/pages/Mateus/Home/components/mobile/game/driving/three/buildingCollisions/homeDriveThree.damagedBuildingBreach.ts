// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingBreach.ts

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

type FaceSpaceBox = Readonly<{
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
const MIN_SEGMENT_HEIGHT_METERS = 0.08;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getFaceWidthMeters(
  building: HomeDriveBuilding,
  face: HomeDriveBuildingCollisionBreachFace,
): number {
  return face === "front" || face === "back"
    ? building.widthMeters
    : building.depthMeters;
}

function getFaceDepthMeters(
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

function faceBoxToLocalBox(
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

function pushFaceBoxIfVisible(
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

function getZoneBreachProfile(params: Readonly<{
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

function getSampleEdges(params: Readonly<{
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

function addRemainingWallMass(params: Readonly<{
  boxes: FaceSpaceBox[];
  building: HomeDriveBuilding;
  profile: HomeDriveBuildingCollisionBreachProfile;
  faceWidthMeters: number;
  faceDepthMeters: number;
}>): void {
  const { boxes, building, profile, faceWidthMeters, faceDepthMeters } = params;

  const samples = profile.samples;
  const faceHalfWidthMeters = faceWidthMeters * 0.5;
  const leftLimit = -faceHalfWidthMeters;
  const rightLimit = faceHalfWidthMeters;

  samples.slice(0, -1).forEach((sample, index) => {
    const nextSample = samples[index + 1];

    if (!nextSample) {
      return;
    }

    const yBottom = Math.max(0, sample.yMeters);
    const yTop = clamp(nextSample.yMeters, yBottom, building.heightMeters);
    const segmentHeight = yTop - yBottom;

    if (segmentHeight < MIN_SEGMENT_HEIGHT_METERS) {
      return;
    }

    const currentEdges = getSampleEdges({
      profile,
      sample,
      faceHalfWidthMeters,
    });
    const nextEdges = getSampleEdges({
      profile,
      sample: nextSample,
      faceHalfWidthMeters,
    });

    const holeLeft = Math.min(currentEdges.left, nextEdges.left);
    const holeRight = Math.max(currentEdges.right, nextEdges.right);
    const yCenter = (yBottom + yTop) * 0.5;

    const leftMassWidth = Math.max(0, holeLeft - leftLimit);
    const rightMassWidth = Math.max(0, rightLimit - holeRight);

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:wall:left:${index}`,
      materialSlot: "body",
      uCenter: leftLimit + leftMassWidth * 0.5,
      yCenter,
      nCenter: 0,
      uSize: leftMassWidth,
      ySize: segmentHeight,
      nSize: faceDepthMeters,
      renderOrder: 70,
    });

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:wall:right:${index}`,
      materialSlot: "body",
      uCenter: holeRight + rightMassWidth * 0.5,
      yCenter,
      nCenter: 0,
      uSize: rightMassWidth,
      ySize: segmentHeight,
      nSize: faceDepthMeters,
      renderOrder: 70,
    });
  });

  const topMassHeight = building.heightMeters - profile.topMeters;

  pushFaceBoxIfVisible(boxes, {
    id: `${profile.id}:wall:top-mass`,
    materialSlot: "body",
    uCenter: 0,
    yCenter: profile.topMeters + topMassHeight * 0.5,
    nCenter: 0,
    uSize: faceWidthMeters,
    ySize: topMassHeight,
    nSize: faceDepthMeters,
    renderOrder: 70,
  });
}

function addInteriorCavity(params: Readonly<{
  boxes: FaceSpaceBox[];
  profile: HomeDriveBuildingCollisionBreachProfile;
  faceWidthMeters: number;
  faceDepthMeters: number;
}>): void {
  const { boxes, profile, faceWidthMeters, faceDepthMeters } = params;

  const samples = profile.samples;
  const faceHalfWidthMeters = faceWidthMeters * 0.5;
  const faceOut = faceDepthMeters * 0.5;

  samples.slice(0, -1).forEach((sample, index) => {
    const nextSample = samples[index + 1];

    if (!nextSample) {
      return;
    }

    const yBottom = sample.yMeters;
    const yTop = nextSample.yMeters;
    const segmentHeight = yTop - yBottom;

    if (segmentHeight < MIN_SEGMENT_HEIGHT_METERS) {
      return;
    }

    const currentEdges = getSampleEdges({
      profile,
      sample,
      faceHalfWidthMeters,
    });
    const nextEdges = getSampleEdges({
      profile,
      sample: nextSample,
      faceHalfWidthMeters,
    });

    const holeLeft = Math.min(currentEdges.left, nextEdges.left);
    const holeRight = Math.max(currentEdges.right, nextEdges.right);
    const holeWidth = Math.max(0.08, holeRight - holeLeft);
    const holeCenter = (holeLeft + holeRight) * 0.5;
    const segmentDepth = clamp(
      Math.max(currentEdges.depth, nextEdges.depth),
      0.08,
      faceDepthMeters * 0.98,
    );

    const yCenter = (yBottom + yTop) * 0.5;
    const cavityBackN = faceOut - segmentDepth;
    const cavityCenterN = faceOut - segmentDepth * 0.5;
    const sideWallThickness = clamp(
      (sample.rimThicknessMeters + nextSample.rimThicknessMeters) * 0.5,
      0.12,
      0.55,
    );

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:cavity:back:${index}`,
      materialSlot: "interior",
      uCenter: holeCenter,
      yCenter,
      nCenter: cavityBackN,
      uSize: holeWidth * 0.98,
      ySize: segmentHeight,
      nSize: 0.08,
      renderOrder: 74,
    });

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:cavity:left-wall:${index}`,
      materialSlot: index % 2 === 0 ? "fracture" : "interior",
      uCenter: holeLeft + sideWallThickness * 0.5,
      yCenter,
      nCenter: cavityCenterN,
      uSize: sideWallThickness,
      ySize: segmentHeight,
      nSize: Math.max(0.12, segmentDepth),
      renderOrder: 75,
    });

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:cavity:right-wall:${index}`,
      materialSlot: index % 2 === 1 ? "fracture" : "interior",
      uCenter: holeRight - sideWallThickness * 0.5,
      yCenter,
      nCenter: cavityCenterN,
      uSize: sideWallThickness,
      ySize: segmentHeight,
      nSize: Math.max(0.12, segmentDepth),
      renderOrder: 75,
    });

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:cavity:shadow:${index}`,
      materialSlot: "shadow",
      uCenter: holeCenter,
      yCenter,
      nCenter: faceOut + 0.012,
      uSize: holeWidth * 1.015,
      ySize: segmentHeight * 1.025,
      nSize: 0.035,
      renderOrder: 82,
    });
  });
}

function addRaggedRim(params: Readonly<{
  boxes: FaceSpaceBox[];
  profile: HomeDriveBuildingCollisionBreachProfile;
  faceWidthMeters: number;
  faceDepthMeters: number;
}>): void {
  const { boxes, profile, faceWidthMeters, faceDepthMeters } = params;

  const faceHalfWidthMeters = faceWidthMeters * 0.5;
  const faceOut = faceDepthMeters * 0.5;
  const samples = profile.samples;

  samples.forEach((sample, index) => {
    const edges = getSampleEdges({
      profile,
      sample,
      faceHalfWidthMeters,
    });

    const rimThickness = clamp(sample.rimThicknessMeters, 0.1, 0.64);
    const chipHeight = clamp(
      0.26 + sample.rimThicknessMeters * 1.35 + sample.rubbleWeight * 0.18,
      0.22,
      0.92,
    );
    const rimDepth = clamp(
      0.16 + sample.depthMeters * 0.18 + sample.rubbleWeight * 0.08,
      0.14,
      0.72,
    );

    const yCenter = clamp(sample.yMeters, 0.08, profile.topMeters - 0.04);

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:rim:left:${index}`,
      materialSlot: index % 3 === 0 ? "fracture" : "rim",
      uCenter: edges.left - rimThickness * 0.5,
      yCenter,
      nCenter: faceOut + 0.018 * (index % 2),
      uSize: rimThickness,
      ySize: chipHeight,
      nSize: rimDepth,
      renderOrder: 84,
    });

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:rim:right:${index}`,
      materialSlot: index % 3 === 1 ? "fracture" : "rim",
      uCenter: edges.right + rimThickness * 0.5,
      yCenter,
      nCenter: faceOut + 0.018 * ((index + 1) % 2),
      uSize: rimThickness,
      ySize: chipHeight,
      nSize: rimDepth,
      renderOrder: 84,
    });

    if (index % 2 === 0) {
      pushFaceBoxIfVisible(boxes, {
        id: `${profile.id}:rim:loose-chip:${index}`,
        materialSlot: "fracture",
        uCenter:
          edges.center +
          Math.sin(sample.seed * 0.00001) * edges.width * 0.32,
        yCenter: clamp(
          sample.yMeters + chipHeight * 0.16,
          0.12,
          profile.topMeters,
        ),
        nCenter: faceOut + 0.05,
        uSize: clamp(rimThickness * 1.25, 0.12, 0.76),
        ySize: clamp(chipHeight * 0.58, 0.14, 0.62),
        nSize: clamp(rimDepth * 0.86, 0.12, 0.58),
        renderOrder: 86,
      });
    }
  });

  const topSample = samples[samples.length - 1];

  if (topSample) {
    const topEdges = getSampleEdges({
      profile,
      sample: topSample,
      faceHalfWidthMeters,
    });

    const topRimHeight = clamp(
      0.22 + topSample.rimThicknessMeters * 1.2,
      0.18,
      0.76,
    );

    pushFaceBoxIfVisible(boxes, {
      id: `${profile.id}:rim:top-jagged`,
      materialSlot: "fracture",
      uCenter: topEdges.center,
      yCenter: profile.topMeters + topRimHeight * 0.5,
      nCenter: faceOut + 0.02,
      uSize: topEdges.width * 1.05,
      ySize: topRimHeight,
      nSize: clamp(0.22 + topSample.depthMeters * 0.12, 0.18, 0.62),
      renderOrder: 85,
    });
  }

  const bottomSample = samples[0];

  if (bottomSample) {
    const bottomEdges = getSampleEdges({
      profile,
      sample: bottomSample,
      faceHalfWidthMeters,
    });

    const chunkCount = Math.max(5, Math.min(11, Math.round(5 + profile.severity * 7)));

    Array.from({ length: chunkCount }, (_, index) => {
      const ratio = chunkCount <= 1 ? 0.5 : index / (chunkCount - 1);
      const u = bottomEdges.left + bottomEdges.width * ratio;
      const phase = Math.sin((bottomSample.seed + index * 31) * 0.017);

      pushFaceBoxIfVisible(boxes, {
        id: `${profile.id}:rim:floor-fracture:${index}`,
        materialSlot: index % 2 === 0 ? "fracture" : "rim",
        uCenter: u + phase * 0.12,
        yCenter: 0.08 + Math.abs(phase) * 0.08,
        nCenter: faceOut + 0.035 + Math.abs(phase) * 0.04,
        uSize: clamp(0.22 + Math.abs(phase) * 0.34, 0.16, 0.68),
        ySize: clamp(0.12 + Math.abs(phase) * 0.2, 0.1, 0.42),
        nSize: clamp(0.22 + bottomSample.rubbleWeight * 0.36, 0.16, 0.72),
        renderOrder: 87,
      });
    });
  }
}

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
