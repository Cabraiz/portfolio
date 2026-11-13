// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingBreach.raggedRim.ts

import type {
	HomeDriveBuildingCollisionBreachProfile,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionBreach.types";
import {
	type FaceSpaceBox,
	clamp,
	pushFaceBoxIfVisible,
	getSampleEdges,
} from "./homeDriveThree.damagedBuildingBreach.faceSpace";

export function addRaggedRim(params: Readonly<{
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
