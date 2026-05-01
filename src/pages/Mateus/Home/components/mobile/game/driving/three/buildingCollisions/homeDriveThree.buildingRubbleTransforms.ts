// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingRubbleTransforms.ts

import type { Object3D } from "three";

import type { HomeDriveBuildingRubblePiece } from "../../domain/buildingCollisions/homeDrive.buildingCollisionRubble.types";

export type HomeDriveThreeBuildingRubbleTransform = Readonly<{
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

export function getHomeDriveThreeBuildingRubbleTransform(
  piece: HomeDriveBuildingRubblePiece,
): HomeDriveThreeBuildingRubbleTransform {
  return {
    position: [piece.position.x, piece.yMeters, piece.position.z],
    rotation: [piece.rotationXRad, piece.rotationYRad, piece.rotationZRad],
    scale: [piece.widthMeters, piece.heightMeters, piece.depthMeters],
  };
}

export function applyHomeDriveThreeBuildingRubbleTransformToObject(
  object: Object3D,
  piece: HomeDriveBuildingRubblePiece,
): void {
  const transform = getHomeDriveThreeBuildingRubbleTransform(piece);

  object.position.set(...transform.position);
  object.rotation.set(...transform.rotation);
  object.scale.set(...transform.scale);
  object.updateMatrix();
}

export function getHomeDriveThreeBuildingRubbleDistanceSquared(
  piece: HomeDriveBuildingRubblePiece,
  position: Readonly<{ x: number; z: number }>,
): number {
  return (piece.position.x - position.x) ** 2 + (piece.position.z - position.z) ** 2;
}
