// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.worldMap.types.ts

export type HomeDriveWorldMapCoordinateSystem = Readonly<{
  x: string;
  y: string;
}>;

export type HomeDriveWorldBounds = Readonly<{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}>;

export type HomeDriveWorldPoint = Readonly<{
  x: number;
  y: number;
}>;

export type HomeDriveWorldPosition = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveWorldSpawn = Readonly<{
  roadId: string;
  position: HomeDriveWorldPoint;
  headingDeg: number;
  speedKmh: number;
}>;

export type HomeDriveWorldDistrict = Readonly<{
  id: string;
  label: string;
  center: HomeDriveWorldPoint;
  ambience: string;
}>;

export type HomeDriveWorldNode = Readonly<{
  id: string;
  x: number;
  y: number;
}>;

export type HomeDriveWorldRoad = Readonly<{
  id: string;
  label: string;
  districtId: string;
  kind: string;
  roadTone: string;
  laneCount: number;
  width: number;
  speedLimitKmh: number;
  bidirectional: boolean;
  surface: string;
  points: readonly HomeDriveWorldPoint[];
  tags: readonly string[];
}>;

export type HomeDriveWorldMap = Readonly<{
  id: string;
  label: string;
  version: number;
  units: string;
  coordinateSystem: HomeDriveWorldMapCoordinateSystem;
  worldBounds: HomeDriveWorldBounds;
  spawn: HomeDriveWorldSpawn;
  districts: readonly HomeDriveWorldDistrict[];
  nodes: readonly HomeDriveWorldNode[];
  roads: readonly HomeDriveWorldRoad[];
}>;

export type HomeDriveRoadVector = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveRoadBounds = Readonly<{
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}>;

export type HomeDriveGeneratedRoadSegment = Readonly<{
  id: string;
  roadId: string;
  segmentIndex: number;
  label: string;
  districtId: string;
  kind: string;
  roadTone: string;
  laneCount: number;
  width: number;
  speedLimitKmh: number;
  bidirectional: boolean;
  surface: string;
  tags: readonly string[];
  from: HomeDriveWorldPosition;
  to: HomeDriveWorldPosition;
  center: HomeDriveWorldPosition;
  direction: HomeDriveRoadVector;
  normal: HomeDriveRoadVector;
  length: number;
  angleRad: number;
  bounds: HomeDriveRoadBounds;
  sourceRoad: HomeDriveWorldRoad;
}>;

export type HomeDriveVisibleRoadSegment = HomeDriveGeneratedRoadSegment &
  Readonly<{
    distanceToCar: number;
    closestPointToCar: HomeDriveWorldPosition;
  }>;

export type HomeDriveCameraRoadPoint = Readonly<{
  world: HomeDriveWorldPosition;
  right: number;
  forward: number;
}>;

export type HomeDriveCameraRoadProjection = Readonly<{
  segment: HomeDriveVisibleRoadSegment;
  from: HomeDriveCameraRoadPoint;
  to: HomeDriveCameraRoadPoint;
  center: HomeDriveCameraRoadPoint;
  isBehindCamera: boolean;
  nearestForward: number;
}>;

export type HomeDriveRoadVisibilityOptions = Readonly<{
  radiusMeters?: number;
  maxSegments?: number;
  includeBehindCar?: boolean;
}>;
