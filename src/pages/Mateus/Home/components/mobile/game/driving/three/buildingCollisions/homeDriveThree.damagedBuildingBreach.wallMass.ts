// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingBreach.wallMass.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type {
	HomeDriveBuildingCollisionBreachProfile,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionBreach.types";
import {
	type FaceSpaceBox,
	MIN_SEGMENT_HEIGHT_METERS,
	clamp,
	pushFaceBoxIfVisible,
	getSampleEdges,
} from "./homeDriveThree.damagedBuildingBreach.faceSpace";

export function addRemainingWallMass(params: Readonly<{
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

export function addInteriorCavity(params: Readonly<{
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
