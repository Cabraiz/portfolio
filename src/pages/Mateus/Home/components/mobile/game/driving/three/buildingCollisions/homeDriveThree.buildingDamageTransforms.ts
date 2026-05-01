// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingDamageTransforms.ts

import type {
  HomeDriveBuildingCollisionDeformation,
  HomeDriveBuildingDamageChunk,
  HomeDriveBuildingDamageDebrisPiece,
  HomeDriveBuildingDamagePlane,
  HomeDriveBuildingDamageRebar,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionDeformation.types";

export type HomeDriveThreeDamageTransform = Readonly<{
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

function getRightVector(rotationYRad: number): Readonly<{
  x: number;
  z: number;
}> {
  return {
    x: Math.cos(rotationYRad),
    z: -Math.sin(rotationYRad),
  };
}

function getWorldPositionOnFacade(params: Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  localX: number;
  localY: number;
  surfaceOffsetMeters: number;
}>): readonly [number, number, number] {
  const right = getRightVector(params.deformation.rotationYRad);

  return [
    params.deformation.position.x +
      right.x * params.localX +
      params.deformation.normal.x * params.surfaceOffsetMeters,
    params.deformation.yMeters + params.localY,
    params.deformation.position.z +
      right.z * params.localX +
      params.deformation.normal.z * params.surfaceOffsetMeters,
  ];
}

export function getHomeDriveThreeDamagePlaneTransform(
  deformation: HomeDriveBuildingCollisionDeformation,
  plane: HomeDriveBuildingDamagePlane,
): HomeDriveThreeDamageTransform {
  return {
    position: getWorldPositionOnFacade({
      deformation,
      localX: plane.localX,
      localY: plane.localY,
      surfaceOffsetMeters: plane.surfaceOffsetMeters,
    }),
    rotation: [0, deformation.rotationYRad, plane.rotationZRad],
    scale: [plane.widthMeters, plane.heightMeters, 1],
  };
}

export function getHomeDriveThreeDamageChunkTransform(
  deformation: HomeDriveBuildingCollisionDeformation,
  chunk: HomeDriveBuildingDamageChunk,
): HomeDriveThreeDamageTransform {
  return {
    position: getWorldPositionOnFacade({
      deformation,
      localX: chunk.localX,
      localY: chunk.localY,
      surfaceOffsetMeters: 0.09 + chunk.localOutMeters,
    }),
    rotation: [
      0,
      deformation.rotationYRad + chunk.rotationYRadOffset,
      chunk.rotationZRad,
    ],
    scale: [chunk.widthMeters, chunk.heightMeters, chunk.depthMeters],
  };
}

export function getHomeDriveThreeDamageRebarTransform(
  deformation: HomeDriveBuildingCollisionDeformation,
  rebar: HomeDriveBuildingDamageRebar,
): HomeDriveThreeDamageTransform {
  return {
    position: getWorldPositionOnFacade({
      deformation,
      localX: rebar.localX,
      localY: rebar.localY,
      surfaceOffsetMeters: 0.14 + rebar.localOutMeters,
    }),
    rotation: [
      Math.PI / 2,
      deformation.rotationYRad + rebar.rotationYRadOffset,
      rebar.rotationZRad,
    ],
    scale: [rebar.radiusMeters, rebar.lengthMeters, rebar.radiusMeters],
  };
}

export function getHomeDriveThreeDamageDebrisTransform(
  deformation: HomeDriveBuildingCollisionDeformation,
  debris: HomeDriveBuildingDamageDebrisPiece,
): HomeDriveThreeDamageTransform {
  const right = getRightVector(deformation.rotationYRad);

  return {
    position: [
      deformation.position.x +
        right.x * debris.localX +
        deformation.normal.x * debris.localForwardMeters,
      debris.yMeters,
      deformation.position.z +
        right.z * debris.localX +
        deformation.normal.z * debris.localForwardMeters,
    ],
    rotation: [
      0,
      deformation.rotationYRad + debris.rotationYRad,
      debris.rotationZRad,
    ],
    scale: [debris.widthMeters, debris.heightMeters, debris.depthMeters],
  };
}
