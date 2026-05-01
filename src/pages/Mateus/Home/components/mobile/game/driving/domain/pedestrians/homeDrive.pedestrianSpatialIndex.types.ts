// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSpatialIndex.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianSpatialIndexCellKey = string;

export type HomeDrivePedestrianSpatialIndexEntry<TItem> = Readonly<{
  item: TItem;
  id: string;
  position: HomeDriveVector2;
  cellKey: HomeDrivePedestrianSpatialIndexCellKey;
}>;

export type HomeDrivePedestrianSpatialIndex<TItem> = Readonly<{
  cellSizeMeters: number;
  cells: ReadonlyMap<
    HomeDrivePedestrianSpatialIndexCellKey,
    readonly HomeDrivePedestrianSpatialIndexEntry<TItem>[]
  >;
  count: number;
}>;

export type HomeDrivePedestrianSpatialQueryOptions = Readonly<{
  center: HomeDriveVector2;
  radiusMeters: number;
  includeCenterCellOnly?: boolean;
}>;

export type HomeDrivePedestrianSpatialIndexBuildOptions<TItem> = Readonly<{
  items: readonly TItem[];
  cellSizeMeters?: number;
  getId: (item: TItem, index: number) => string;
  getPosition: (item: TItem, index: number) => HomeDriveVector2;
}>;

export type HomeDrivePedestrianAgentSpatialIndex =
  HomeDrivePedestrianSpatialIndex<HomeDrivePedestrianAgent>;

export type HomeDrivePedestrianZoneSpatialIndex =
  HomeDrivePedestrianSpatialIndex<HomeDrivePedestrianSidewalkZone>;

export type HomeDrivePedestrianSpatialQueryResult<TItem> = Readonly<{
  items: readonly TItem[];
  entries: readonly HomeDrivePedestrianSpatialIndexEntry<TItem>[];
  visitedCellKeys: readonly HomeDrivePedestrianSpatialIndexCellKey[];
}>;

export type HomeDrivePedestrianNearestQueryResult<TItem> = Readonly<{
  item: TItem;
  entry: HomeDrivePedestrianSpatialIndexEntry<TItem>;
  distanceSquared: number;
}> | null;
