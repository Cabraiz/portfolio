// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSpatialIndex.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianAgentSpatialIndex,
  HomeDrivePedestrianNearestQueryResult,
  HomeDrivePedestrianSpatialIndex,
  HomeDrivePedestrianSpatialIndexBuildOptions,
  HomeDrivePedestrianSpatialIndexCellKey,
  HomeDrivePedestrianSpatialIndexEntry,
  HomeDrivePedestrianSpatialQueryOptions,
  HomeDrivePedestrianSpatialQueryResult,
  HomeDrivePedestrianZoneSpatialIndex,
} from "./homeDrive.pedestrianSpatialIndex.types";

const DEFAULT_AGENT_CELL_SIZE_METERS = 18;
const DEFAULT_ZONE_CELL_SIZE_METERS = 56;

function clampRadius(radiusMeters: number): number {
  if (!Number.isFinite(radiusMeters)) {
    return 0;
  }

  return Math.max(0, radiusMeters);
}

export function getHomeDrivePedestrianSpatialDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

export function getHomeDrivePedestrianSpatialCellKey(
  position: Readonly<{ x: number; z: number }>,
  cellSizeMeters: number,
): HomeDrivePedestrianSpatialIndexCellKey {
  const safeCellSizeMeters = Math.max(1, cellSizeMeters);

  return `${Math.floor(position.x / safeCellSizeMeters)}:${Math.floor(
    position.z / safeCellSizeMeters,
  )}`;
}

function parseCellKey(
  cellKey: HomeDrivePedestrianSpatialIndexCellKey,
): Readonly<{ x: number; z: number }> | null {
  const [rawX, rawZ] = cellKey.split(":");
  const x = Number.parseInt(rawX, 10);
  const z = Number.parseInt(rawZ, 10);

  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null;
  }

  return { x, z };
}

export function getHomeDrivePedestrianSpatialNeighborCellKeys(
  center: HomeDriveVector2,
  radiusMeters: number,
  cellSizeMeters: number,
): readonly HomeDrivePedestrianSpatialIndexCellKey[] {
  const safeCellSizeMeters = Math.max(1, cellSizeMeters);
  const safeRadiusMeters = clampRadius(radiusMeters);
  const minX = Math.floor((center.x - safeRadiusMeters) / safeCellSizeMeters);
  const maxX = Math.floor((center.x + safeRadiusMeters) / safeCellSizeMeters);
  const minZ = Math.floor((center.z - safeRadiusMeters) / safeCellSizeMeters);
  const maxZ = Math.floor((center.z + safeRadiusMeters) / safeCellSizeMeters);
  const keys: HomeDrivePedestrianSpatialIndexCellKey[] = [];

  for (let z = minZ; z <= maxZ; z += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      keys.push(`${x}:${z}`);
    }
  }

  return keys;
}

export function createHomeDrivePedestrianSpatialIndex<TItem>(
  options: HomeDrivePedestrianSpatialIndexBuildOptions<TItem>,
): HomeDrivePedestrianSpatialIndex<TItem> {
  const cellSizeMeters = Math.max(1, options.cellSizeMeters ?? DEFAULT_AGENT_CELL_SIZE_METERS);
  const mutableCells = new Map<
    HomeDrivePedestrianSpatialIndexCellKey,
    HomeDrivePedestrianSpatialIndexEntry<TItem>[]
  >();

  options.items.forEach((item, index) => {
    const position = options.getPosition(item, index);
    const cellKey = getHomeDrivePedestrianSpatialCellKey(position, cellSizeMeters);
    const entry: HomeDrivePedestrianSpatialIndexEntry<TItem> = {
      item,
      id: options.getId(item, index),
      position,
      cellKey,
    };

    const cell = mutableCells.get(cellKey);

    if (cell) {
      cell.push(entry);
    } else {
      mutableCells.set(cellKey, [entry]);
    }
  });

  return {
    cellSizeMeters,
    cells: mutableCells,
    count: options.items.length,
  };
}

export function createHomeDrivePedestrianAgentSpatialIndex(
  agents: readonly HomeDrivePedestrianAgent[],
  cellSizeMeters = DEFAULT_AGENT_CELL_SIZE_METERS,
): HomeDrivePedestrianAgentSpatialIndex {
  return createHomeDrivePedestrianSpatialIndex({
    items: agents,
    cellSizeMeters,
    getId: (agent) => agent.id,
    getPosition: (agent) => agent.position,
  });
}

export function createHomeDrivePedestrianZoneSpatialIndex(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  cellSizeMeters = DEFAULT_ZONE_CELL_SIZE_METERS,
): HomeDrivePedestrianZoneSpatialIndex {
  return createHomeDrivePedestrianSpatialIndex({
    items: zones,
    cellSizeMeters,
    getId: (zone) => zone.id,
    getPosition: (zone) => zone.center,
  });
}

export function queryHomeDrivePedestrianSpatialIndex<TItem>(
  index: HomeDrivePedestrianSpatialIndex<TItem>,
  options: HomeDrivePedestrianSpatialQueryOptions,
): HomeDrivePedestrianSpatialQueryResult<TItem> {
  const radiusMeters = clampRadius(options.radiusMeters);
  const radiusSquared = radiusMeters * radiusMeters;
  const centerCellKey = getHomeDrivePedestrianSpatialCellKey(
    options.center,
    index.cellSizeMeters,
  );
  const visitedCellKeys = options.includeCenterCellOnly
    ? [centerCellKey]
    : getHomeDrivePedestrianSpatialNeighborCellKeys(
        options.center,
        radiusMeters,
        index.cellSizeMeters,
      );
  const entries: HomeDrivePedestrianSpatialIndexEntry<TItem>[] = [];

  visitedCellKeys.forEach((cellKey) => {
    const cellEntries = index.cells.get(cellKey) ?? [];

    cellEntries.forEach((entry) => {
      if (
        getHomeDrivePedestrianSpatialDistanceSquared(
          entry.position,
          options.center,
        ) <= radiusSquared
      ) {
        entries.push(entry);
      }
    });
  });

  return {
    items: entries.map((entry) => entry.item),
    entries,
    visitedCellKeys,
  };
}

export function countHomeDrivePedestrianSpatialItemsNear<TItem>(
  index: HomeDrivePedestrianSpatialIndex<TItem>,
  center: HomeDriveVector2,
  radiusMeters: number,
): number {
  return queryHomeDrivePedestrianSpatialIndex(index, {
    center,
    radiusMeters,
  }).entries.length;
}

export function hasHomeDrivePedestrianSpatialItemNear<TItem>(
  index: HomeDrivePedestrianSpatialIndex<TItem>,
  center: HomeDriveVector2,
  radiusMeters: number,
): boolean {
  const safeRadiusMeters = clampRadius(radiusMeters);
  const radiusSquared = safeRadiusMeters * safeRadiusMeters;
  const cellKeys = getHomeDrivePedestrianSpatialNeighborCellKeys(
    center,
    safeRadiusMeters,
    index.cellSizeMeters,
  );

  for (const cellKey of cellKeys) {
    const entries = index.cells.get(cellKey) ?? [];

    for (const entry of entries) {
      if (
        getHomeDrivePedestrianSpatialDistanceSquared(entry.position, center) <=
        radiusSquared
      ) {
        return true;
      }
    }
  }

  return false;
}

export function findNearestHomeDrivePedestrianSpatialItem<TItem>(
  index: HomeDrivePedestrianSpatialIndex<TItem>,
  center: HomeDriveVector2,
  radiusMeters: number,
): HomeDrivePedestrianNearestQueryResult<TItem> {
  const radiusSquared = clampRadius(radiusMeters) ** 2;
  const cellKeys = getHomeDrivePedestrianSpatialNeighborCellKeys(
    center,
    radiusMeters,
    index.cellSizeMeters,
  );

  let nearest: HomeDrivePedestrianNearestQueryResult<TItem> = null;

  for (const cellKey of cellKeys) {
    const entries = index.cells.get(cellKey) ?? [];

    for (const entry of entries) {
      const distanceSquared = getHomeDrivePedestrianSpatialDistanceSquared(
        entry.position,
        center,
      );

      if (distanceSquared > radiusSquared) {
        continue;
      }

      if (!nearest || distanceSquared < nearest.distanceSquared) {
        nearest = {
          item: entry.item,
          entry,
          distanceSquared,
        };
      }
    }
  }

  return nearest;
}

export function getHomeDrivePedestrianSpatialIndexCellPopulation(
  index: HomeDrivePedestrianSpatialIndex<unknown>,
): Readonly<Record<HomeDrivePedestrianSpatialIndexCellKey, number>> {
  const result: Record<HomeDrivePedestrianSpatialIndexCellKey, number> = {};

  index.cells.forEach((entries, cellKey) => {
    result[cellKey] = entries.length;
  });

  return result;
}

export function getHomeDrivePedestrianSpatialIndexDebugSummary(
  index: HomeDrivePedestrianSpatialIndex<unknown>,
): Readonly<{
  cellSizeMeters: number;
  cellCount: number;
  itemCount: number;
  busiestCellKey: string | null;
  busiestCellCount: number;
}> {
  let busiestCellKey: string | null = null;
  let busiestCellCount = 0;

  index.cells.forEach((entries, cellKey) => {
    if (entries.length > busiestCellCount) {
      busiestCellKey = cellKey;
      busiestCellCount = entries.length;
    }
  });

  return {
    cellSizeMeters: index.cellSizeMeters,
    cellCount: index.cells.size,
    itemCount: index.count,
    busiestCellKey,
    busiestCellCount,
  };
}

export function expandHomeDrivePedestrianSpatialCellKeys(
  cellKeys: readonly HomeDrivePedestrianSpatialIndexCellKey[],
  rings = 1,
): readonly HomeDrivePedestrianSpatialIndexCellKey[] {
  const safeRings = Math.max(0, Math.floor(rings));
  const expanded = new Set<HomeDrivePedestrianSpatialIndexCellKey>(cellKeys);

  cellKeys.forEach((cellKey) => {
    const parsed = parseCellKey(cellKey);

    if (!parsed) {
      return;
    }

    for (let dz = -safeRings; dz <= safeRings; dz += 1) {
      for (let dx = -safeRings; dx <= safeRings; dx += 1) {
        expanded.add(`${parsed.x + dx}:${parsed.z + dz}`);
      }
    }
  });

  return Array.from(expanded).sort((first, second) => first.localeCompare(second));
}
