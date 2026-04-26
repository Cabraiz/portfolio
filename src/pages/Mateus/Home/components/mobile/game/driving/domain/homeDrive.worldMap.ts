// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.worldMap.ts

import rawWorldMap from "../homeDrive.worldMap.json";

import type {
  HomeDriveWorldBounds,
  HomeDriveWorldDistrict,
  HomeDriveWorldMap,
  HomeDriveWorldNode,
  HomeDriveWorldPoint,
  HomeDriveWorldPosition,
  HomeDriveWorldRoad,
  HomeDriveWorldSpawn,
} from "./homeDrive.worldMap.types";

export const HOME_DRIVE_WORLD_MAP = rawWorldMap as HomeDriveWorldMap;

export const HOME_DRIVE_WORLD_BOUNDS: HomeDriveWorldBounds =
  HOME_DRIVE_WORLD_MAP.worldBounds;

export const HOME_DRIVE_WORLD_SPAWN: HomeDriveWorldSpawn =
  HOME_DRIVE_WORLD_MAP.spawn;

export const HOME_DRIVE_WORLD_DISTRICTS: readonly HomeDriveWorldDistrict[] =
  HOME_DRIVE_WORLD_MAP.districts;

export const HOME_DRIVE_WORLD_NODES: readonly HomeDriveWorldNode[] =
  HOME_DRIVE_WORLD_MAP.nodes;

export const HOME_DRIVE_WORLD_ROADS: readonly HomeDriveWorldRoad[] =
  HOME_DRIVE_WORLD_MAP.roads;

function createRecordById<TItem extends Readonly<{ id: string }>>(
  items: readonly TItem[],
): Readonly<Record<string, TItem>> {
  return Object.freeze(
    Object.fromEntries(items.map((item) => [item.id, item])) as Record<
      string,
      TItem
    >,
  );
}

const DISTRICTS_BY_ID = createRecordById(HOME_DRIVE_WORLD_DISTRICTS);
const NODES_BY_ID = createRecordById(HOME_DRIVE_WORLD_NODES);
const ROADS_BY_ID = createRecordById(HOME_DRIVE_WORLD_ROADS);

export function getHomeDriveWorldMap(): HomeDriveWorldMap {
  return HOME_DRIVE_WORLD_MAP;
}

export function getHomeDriveWorldBounds(): HomeDriveWorldBounds {
  return HOME_DRIVE_WORLD_BOUNDS;
}

export function getHomeDriveWorldSpawn(): HomeDriveWorldSpawn {
  return HOME_DRIVE_WORLD_SPAWN;
}

export function getHomeDriveWorldDistricts(): readonly HomeDriveWorldDistrict[] {
  return HOME_DRIVE_WORLD_DISTRICTS;
}

export function getHomeDriveWorldNodes(): readonly HomeDriveWorldNode[] {
  return HOME_DRIVE_WORLD_NODES;
}

export function getHomeDriveWorldRoads(): readonly HomeDriveWorldRoad[] {
  return HOME_DRIVE_WORLD_ROADS;
}

export function getHomeDriveDistrictById(
  districtId: string,
): HomeDriveWorldDistrict | undefined {
  return DISTRICTS_BY_ID[districtId];
}

export function getHomeDriveNodeById(
  nodeId: string,
): HomeDriveWorldNode | undefined {
  return NODES_BY_ID[nodeId];
}

export function getHomeDriveRoadById(
  roadId: string,
): HomeDriveWorldRoad | undefined {
  return ROADS_BY_ID[roadId];
}

export function getHomeDriveRoadsByDistrictId(
  districtId: string,
): readonly HomeDriveWorldRoad[] {
  return HOME_DRIVE_WORLD_ROADS.filter((road) => {
    return road.districtId === districtId;
  });
}

/**
 * O JSON usa x/y.
 * O motor do jogo usa x/z.
 *
 * Então:
 * map.x -> world.x
 * map.y -> world.z
 */
export function mapPointToWorldPosition(
  point: HomeDriveWorldPoint,
): HomeDriveWorldPosition {
  return {
    x: point.x,
    z: point.y,
  };
}

export function worldPositionToMapPoint(
  position: HomeDriveWorldPosition,
): HomeDriveWorldPoint {
  return {
    x: position.x,
    y: position.z,
  };
}

export function clampWorldPositionToBounds(
  position: HomeDriveWorldPosition,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDriveWorldPosition {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
    z: Math.min(bounds.maxY, Math.max(bounds.minY, position.z)),
  };
}

export function isWorldPositionInsideBounds(
  position: HomeDriveWorldPosition,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): boolean {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.z >= bounds.minY &&
    position.z <= bounds.maxY
  );
}

export function getHomeDriveSpawnWorldPosition(): HomeDriveWorldPosition {
  return mapPointToWorldPosition(HOME_DRIVE_WORLD_SPAWN.position);
}

export function getHomeDriveSpawnHeadingRad(): number {
  return (HOME_DRIVE_WORLD_SPAWN.headingDeg * Math.PI) / 180;
}

export function getHomeDriveSpawnSpeedMps(): number {
  return HOME_DRIVE_WORLD_SPAWN.speedKmh / 3.6;
}

export function getHomeDriveWorldWidthMeters(
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): number {
  return bounds.maxX - bounds.minX;
}

export function getHomeDriveWorldDepthMeters(
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): number {
  return bounds.maxY - bounds.minY;
}

export function getHomeDriveWorldCenter(
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDriveWorldPosition {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minY + bounds.maxY) / 2,
  };
}
