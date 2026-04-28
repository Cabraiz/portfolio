// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.terrain.ts

import {
  FREE_DRIVE_TERRAIN_CELL_SIZE_METERS,
  FREE_DRIVE_TERRAIN_OBJECT_RADIUS_METERS,
  FREE_DRIVE_TERRAIN_TILE_SIZE_METERS,
} from "./homeDrive.constants";
import { clamp, hashVector } from "./homeDrive.math";
import { isHomeDrivePositionBlockedByRoad } from "./homeDrive.roadExclusion";
import { getProjectedVisibleHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type {
  HomeDriveCarState,
  HomeDriveTerrainObject,
  HomeDriveTerrainObjectType,
  HomeDriveTerrainState,
  HomeDriveTerrainTile,
  HomeDriveVector2,
} from "./homeDrive.types";
import { HOME_DRIVE_WORLD_BOUNDS } from "./homeDrive.worldMap";
import type { HomeDriveWorldPosition } from "./homeDrive.worldMap.types";

const ROAD_VISIBILITY_RADIUS_METERS = 760;
const ROAD_MAX_VISIBLE_SEGMENTS = 128;
const WORLD_EDGE_OBJECT_INSET_METERS = 8;

function getObjectType(seed: number): HomeDriveTerrainObjectType {
  if (seed > 0.86) {
    return "marker";
  }

  if (seed > 0.68) {
    return "tree";
  }

  if (seed > 0.44) {
    return "bush";
  }

  return "rock";
}

function getObjectSize(type: HomeDriveTerrainObjectType, seed: number): number {
  switch (type) {
    case "tree":
      return 4.2 + seed * 4.8;
    case "bush":
      return 2.2 + seed * 2.8;
    case "marker":
      return 3.6 + seed * 1.8;
    case "rock":
    default:
      return 1.8 + seed * 2.4;
  }
}

function getObjectRoadRadiusMeters(
  type: HomeDriveTerrainObjectType,
  sizeMeters: number,
): number {
  switch (type) {
    case "tree":
      return Math.max(3.2, sizeMeters * 0.48);
    case "marker":
      return Math.max(2.6, sizeMeters * 0.42);
    case "bush":
      return Math.max(2.2, sizeMeters * 0.46);
    case "rock":
    default:
      return Math.max(1.8, sizeMeters * 0.38);
  }
}

function clampWorldX(value: number): number {
  return clamp(
    value,
    HOME_DRIVE_WORLD_BOUNDS.minX + WORLD_EDGE_OBJECT_INSET_METERS,
    HOME_DRIVE_WORLD_BOUNDS.maxX - WORLD_EDGE_OBJECT_INSET_METERS,
  );
}

function clampWorldZ(value: number): number {
  return clamp(
    value,
    HOME_DRIVE_WORLD_BOUNDS.minY + WORLD_EDGE_OBJECT_INSET_METERS,
    HOME_DRIVE_WORLD_BOUNDS.maxY - WORLD_EDGE_OBJECT_INSET_METERS,
  );
}

function isInsideWorldBounds(position: HomeDriveVector2): boolean {
  return (
    position.x >= HOME_DRIVE_WORLD_BOUNDS.minX &&
    position.x <= HOME_DRIVE_WORLD_BOUNDS.maxX &&
    position.z >= HOME_DRIVE_WORLD_BOUNDS.minY &&
    position.z <= HOME_DRIVE_WORLD_BOUNDS.maxY
  );
}

function doesTileIntersectWorldBounds(
  tileOrigin: HomeDriveVector2,
  tileSizeMeters: number,
): boolean {
  const tileMinX = tileOrigin.x;
  const tileMaxX = tileOrigin.x + tileSizeMeters;
  const tileMinZ = tileOrigin.z;
  const tileMaxZ = tileOrigin.z + tileSizeMeters;

  return (
    tileMaxX >= HOME_DRIVE_WORLD_BOUNDS.minX &&
    tileMinX <= HOME_DRIVE_WORLD_BOUNDS.maxX &&
    tileMaxZ >= HOME_DRIVE_WORLD_BOUNDS.minY &&
    tileMinZ <= HOME_DRIVE_WORLD_BOUNDS.maxY
  );
}

function toWorldPosition(position: HomeDriveVector2): HomeDriveWorldPosition {
  return {
    x: position.x,
    z: position.z,
  };
}

export function getHomeDriveTerrainTiles(
  carPosition: HomeDriveVector2,
): readonly HomeDriveTerrainTile[] {
  const radius = FREE_DRIVE_TERRAIN_OBJECT_RADIUS_METERS;
  const tileSize = FREE_DRIVE_TERRAIN_TILE_SIZE_METERS;
  const minX = Math.floor((carPosition.x - radius) / tileSize);
  const maxX = Math.ceil((carPosition.x + radius) / tileSize);
  const minZ = Math.floor((carPosition.z - radius) / tileSize);
  const maxZ = Math.ceil((carPosition.z + radius) / tileSize);
  const tiles: HomeDriveTerrainTile[] = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let z = minZ; z <= maxZ; z += 1) {
      const originX = x * tileSize;
      const originZ = z * tileSize;
      const origin = {
        x: originX,
        z: originZ,
      };

      if (!doesTileIntersectWorldBounds(origin, tileSize)) {
        continue;
      }

      tiles.push({
        id: `tile-${x}-${z}`,
        origin,
        tone: hashVector(x, z, 73),
      });
    }
  }

  return tiles;
}

export function getHomeDriveReferenceObjects(
  carPosition: HomeDriveVector2,
): readonly HomeDriveTerrainObject[] {
  const radius = FREE_DRIVE_TERRAIN_OBJECT_RADIUS_METERS;
  const cellSize = FREE_DRIVE_TERRAIN_CELL_SIZE_METERS;
  const minX = Math.floor((carPosition.x - radius) / cellSize);
  const maxX = Math.ceil((carPosition.x + radius) / cellSize);
  const minZ = Math.floor((carPosition.z - radius) / cellSize);
  const maxZ = Math.ceil((carPosition.z + radius) / cellSize);
  const objects: HomeDriveTerrainObject[] = [];

  for (let cellX = minX; cellX <= maxX; cellX += 1) {
    for (let cellZ = minZ; cellZ <= maxZ; cellZ += 1) {
      const densitySeed = hashVector(cellX, cellZ, 11);

      if (densitySeed < 0.28) {
        continue;
      }

      const offsetXSeed = hashVector(cellX, cellZ, 23);
      const offsetZSeed = hashVector(cellX, cellZ, 41);
      const typeSeed = hashVector(cellX, cellZ, 59);
      const sizeSeed = hashVector(cellX, cellZ, 83);
      const rotationSeed = hashVector(cellX, cellZ, 101);
      const variantSeed = hashVector(cellX, cellZ, 127);

      const type = getObjectType(typeSeed);
      const sizeMeters = getObjectSize(type, sizeSeed);

      const position = {
        x: clampWorldX(
          cellX * cellSize + (offsetXSeed - 0.5) * cellSize * 0.72,
        ),
        z: clampWorldZ(
          cellZ * cellSize + (offsetZSeed - 0.5) * cellSize * 0.72,
        ),
      };

      if (!isInsideWorldBounds(position)) {
        continue;
      }

      const distanceX = position.x - carPosition.x;
      const distanceZ = position.z - carPosition.z;
      const distance = Math.hypot(distanceX, distanceZ);

      if (distance > radius || distance < 10) {
        continue;
      }

      const objectRoadRadiusMeters = getObjectRoadRadiusMeters(type, sizeMeters);

      if (isHomeDrivePositionBlockedByRoad(position, objectRoadRadiusMeters)) {
        continue;
      }

      objects.push({
        id: `object-${cellX}-${cellZ}`,
        type,
        position,
        sizeMeters,
        rotationDeg: (rotationSeed - 0.5) * 24,
        variant: Math.floor(variantSeed * 4),
      });
    }
  }

  return objects;
}

export function getHomeDriveProjectedRoadSegments(
  car: Pick<HomeDriveCarState, "position" | "headingRad">,
) {
  return getProjectedVisibleHomeDriveRoadSegments(
    {
      position: toWorldPosition(car.position),
      headingRad: car.headingRad,
    },
    {
      radiusMeters: ROAD_VISIBILITY_RADIUS_METERS,
      maxSegments: ROAD_MAX_VISIBLE_SEGMENTS,
      includeBehindCar: false,
    },
  );
}

export function getHomeDriveTerrainState(
  car: Pick<HomeDriveCarState, "position" | "headingRad">,
): HomeDriveTerrainState {
  const roadSegments = getHomeDriveProjectedRoadSegments(car);
  const tiles = getHomeDriveTerrainTiles(car.position);
  const objects = getHomeDriveReferenceObjects(car.position);

  return {
    tiles,
    objects,
    roadSegments,
  };
}
