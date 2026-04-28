// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.boundaryMountains.ts

import { clamp, hashNumber, hashVector } from "./homeDrive.math";
import type { HomeDriveVector2 } from "./homeDrive.types";
import {
  HOME_DRIVE_WORLD_BOUNDS,
  getHomeDriveWorldCenter,
  getHomeDriveWorldDepthMeters,
  getHomeDriveWorldWidthMeters,
} from "./homeDrive.worldMap";
import type { HomeDriveWorldBounds } from "./homeDrive.worldMap.types";
import type { HomeDriveWorldBoundarySide } from "./homeDrive.worldBoundary";

export type HomeDriveBoundaryMountainSegment = Readonly<{
  id: string;
  side: HomeDriveWorldBoundarySide;
  from: HomeDriveVector2;
  to: HomeDriveVector2;
  lengthMeters: number;
  normal: HomeDriveVector2;
}>;

export type HomeDriveBoundaryMountainInstance = Readonly<{
  id: string;
  side: HomeDriveWorldBoundarySide;
  rowIndex: number;
  position: HomeDriveVector2;
  heightMeters: number;
  radiusXmeters: number;
  radiusZmeters: number;
  rotationYRad: number;
  tone: number;
  seed: number;
}>;

export type HomeDriveBoundaryMountainsConfig = Readonly<{
  rowCount: number;
  baseSpacingMeters: number;
  rowSpacingMeters: number;
  edgeOffsetMeters: number;
  lateralJitterMeters: number;
  depthJitterMeters: number;
  minHeightMeters: number;
  maxHeightMeters: number;
  minRadiusMeters: number;
  maxRadiusMeters: number;
}>;

export const HOME_DRIVE_BOUNDARY_MOUNTAINS_CONFIG: HomeDriveBoundaryMountainsConfig =
  Object.freeze({
    rowCount: 3,
    baseSpacingMeters: 54,
    rowSpacingMeters: 34,
    edgeOffsetMeters: 32,
    lateralJitterMeters: 16,
    depthJitterMeters: 13,
    minHeightMeters: 42,
    maxHeightMeters: 124,
    minRadiusMeters: 22,
    maxRadiusMeters: 58,
  });

function getSideLengthMeters(
  side: HomeDriveWorldBoundarySide,
  bounds: HomeDriveWorldBounds,
): number {
  if (side === "north" || side === "south") {
    return getHomeDriveWorldWidthMeters(bounds);
  }

  return getHomeDriveWorldDepthMeters(bounds);
}

function getSideNormal(side: HomeDriveWorldBoundarySide): HomeDriveVector2 {
  switch (side) {
    case "north":
      return { x: 0, z: 1 };
    case "south":
      return { x: 0, z: -1 };
    case "east":
      return { x: 1, z: 0 };
    case "west":
    default:
      return { x: -1, z: 0 };
  }
}

function getSegmentForSide(
  side: HomeDriveWorldBoundarySide,
  bounds: HomeDriveWorldBounds,
): HomeDriveBoundaryMountainSegment {
  switch (side) {
    case "north":
      return {
        id: "boundary-mountains-north",
        side,
        from: { x: bounds.minX, z: bounds.maxY },
        to: { x: bounds.maxX, z: bounds.maxY },
        lengthMeters: getSideLengthMeters(side, bounds),
        normal: getSideNormal(side),
      };

    case "south":
      return {
        id: "boundary-mountains-south",
        side,
        from: { x: bounds.minX, z: bounds.minY },
        to: { x: bounds.maxX, z: bounds.minY },
        lengthMeters: getSideLengthMeters(side, bounds),
        normal: getSideNormal(side),
      };

    case "east":
      return {
        id: "boundary-mountains-east",
        side,
        from: { x: bounds.maxX, z: bounds.minY },
        to: { x: bounds.maxX, z: bounds.maxY },
        lengthMeters: getSideLengthMeters(side, bounds),
        normal: getSideNormal(side),
      };

    case "west":
    default:
      return {
        id: "boundary-mountains-west",
        side,
        from: { x: bounds.minX, z: bounds.minY },
        to: { x: bounds.minX, z: bounds.maxY },
        lengthMeters: getSideLengthMeters(side, bounds),
        normal: getSideNormal(side),
      };
  }
}

function getSidePositionAt(
  segment: HomeDriveBoundaryMountainSegment,
  t: number,
): HomeDriveVector2 {
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * t,
    z: segment.from.z + (segment.to.z - segment.from.z) * t,
  };
}

function getSideTangent(segment: HomeDriveBoundaryMountainSegment): HomeDriveVector2 {
  const deltaX = segment.to.x - segment.from.x;
  const deltaZ = segment.to.z - segment.from.z;
  const length = Math.hypot(deltaX, deltaZ) || 1;

  return {
    x: deltaX / length,
    z: deltaZ / length,
  };
}

function getMountainSeed(
  side: HomeDriveWorldBoundarySide,
  rowIndex: number,
  instanceIndex: number,
): number {
  const sideSalt = {
    north: 1103,
    south: 2207,
    east: 3301,
    west: 4409,
  } satisfies Record<HomeDriveWorldBoundarySide, number>;

  return hashVector(
    instanceIndex + sideSalt[side],
    rowIndex * 37 + sideSalt[side],
    9001,
  );
}

function createMountainInstancesForSegment(
  segment: HomeDriveBoundaryMountainSegment,
  config: HomeDriveBoundaryMountainsConfig,
): readonly HomeDriveBoundaryMountainInstance[] {
  const tangent = getSideTangent(segment);
  const instances: HomeDriveBoundaryMountainInstance[] = [];

  for (let rowIndex = 0; rowIndex < config.rowCount; rowIndex += 1) {
    const rowFactor = config.rowCount <= 1 ? 0 : rowIndex / (config.rowCount - 1);
    const rowSpacing =
      config.baseSpacingMeters * (1 + rowIndex * 0.16);

    const count = Math.max(2, Math.ceil(segment.lengthMeters / rowSpacing) + 2);

    for (let instanceIndex = 0; instanceIndex < count; instanceIndex += 1) {
      const t = clamp(instanceIndex / Math.max(1, count - 1), 0, 1);
      const seed = getMountainSeed(segment.side, rowIndex, instanceIndex);
      const seedA = hashNumber(Math.floor(seed * 100000) + 17);
      const seedB = hashNumber(Math.floor(seed * 100000) + 31);
      const seedC = hashNumber(Math.floor(seed * 100000) + 47);
      const seedD = hashNumber(Math.floor(seed * 100000) + 61);
      const seedE = hashNumber(Math.floor(seed * 100000) + 79);

      const basePosition = getSidePositionAt(segment, t);
      const lateralJitter = (seedA - 0.5) * config.lateralJitterMeters * 2;
      const depthJitter = (seedB - 0.5) * config.depthJitterMeters * 2;

      const offsetFromEdge =
        config.edgeOffsetMeters +
        rowIndex * config.rowSpacingMeters +
        depthJitter;

      const heightNoise = Math.pow(seedC, 0.72);
      const radiusNoise = Math.pow(seedD, 0.82);

      const heightMeters =
        config.minHeightMeters +
        (config.maxHeightMeters - config.minHeightMeters) *
          (0.5 + rowFactor * 0.22 + heightNoise * 0.5);

      const radiusMeters =
        config.minRadiusMeters +
        (config.maxRadiusMeters - config.minRadiusMeters) *
          (0.38 + rowFactor * 0.28 + radiusNoise * 0.42);

      instances.push({
        id: `boundary-mountain-${segment.side}-${rowIndex}-${instanceIndex}`,
        side: segment.side,
        rowIndex,
        position: {
          x:
            basePosition.x +
            tangent.x * lateralJitter +
            segment.normal.x * offsetFromEdge,
          z:
            basePosition.z +
            tangent.z * lateralJitter +
            segment.normal.z * offsetFromEdge,
        },
        heightMeters,
        radiusXmeters: radiusMeters * (0.82 + seedE * 0.5),
        radiusZmeters: radiusMeters * (0.76 + seedA * 0.56),
        rotationYRad: seedB * Math.PI * 2,
        tone: clamp(0.28 + rowFactor * 0.24 + seedC * 0.36, 0, 1),
        seed,
      });
    }
  }

  return instances;
}

export function getHomeDriveBoundaryMountainSegments(
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): readonly HomeDriveBoundaryMountainSegment[] {
  return [
    getSegmentForSide("north", bounds),
    getSegmentForSide("south", bounds),
    getSegmentForSide("east", bounds),
    getSegmentForSide("west", bounds),
  ];
}

export function getHomeDriveBoundaryMountainInstances(
  config: HomeDriveBoundaryMountainsConfig = HOME_DRIVE_BOUNDARY_MOUNTAINS_CONFIG,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): readonly HomeDriveBoundaryMountainInstance[] {
  return getHomeDriveBoundaryMountainSegments(bounds).flatMap((segment) => {
    return createMountainInstancesForSegment(segment, config);
  });
}

export function getHomeDriveBoundaryMountainsCenter(): HomeDriveVector2 {
  return getHomeDriveWorldCenter();
}

export function getHomeDriveBoundaryMountainsApproximateRadiusMeters(
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): number {
  return Math.hypot(
    getHomeDriveWorldWidthMeters(bounds),
    getHomeDriveWorldDepthMeters(bounds),
  );
}
