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

export type HomeDriveWorldPedestrianRoadSettings = Readonly<{
  /**
   * false desativa calçada/pessoas nessa rua inteira.
   * Também pode ser controlado por tag: "no-pedestrians".
   */
  enabled?: boolean;

  /**
   * Multiplicador local de densidade.
   * 1 = normal. 0.3 = quase vazio. 1.5 = bem movimentado.
   */
  density?: number;

  /**
   * Espaço entre a borda da pista e o centro útil da calçada.
   */
  sidewalkGapMeters?: number;

  /**
   * Largura única aplicada nos dois lados quando os lados não forem especificados.
   */
  sidewalkWidthMeters?: number;

  /**
   * Largura específica da calçada esquerda no referencial do segmento.
   */
  sidewalkLeftWidthMeters?: number;

  /**
   * Largura específica da calçada direita no referencial do segmento.
   */
  sidewalkRightWidthMeters?: number;

  /**
   * Tom semântico opcional para render/debug futuro.
   */
  zoneTone?: string;
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

  /**
   * Metadados opcionais para sistemas urbanos que nascem da rua,
   * como pedestres nas calçadas. O mapa atual não precisa preencher isso;
   * os sistemas usam fallback por kind/tags.
   */
  pedestrians?: HomeDriveWorldPedestrianRoadSettings;
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

  /**
   * Campos opcionais derivados de sourceRoad.pedestrians/tags.
   * Mantidos no segmento para evitar que sistemas como pedestres precisem
   * reabrir o JSON cru do mapa.
   */
  pedestrianAllowed?: boolean;
  pedestrianDensity?: number;
  pedestrianZoneTone?: string;
  sidewalkGapMeters?: number;
  sidewalkWidthMeters?: number;
  sidewalkLeftWidthMeters?: number;
  sidewalkRightWidthMeters?: number;
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

export type HomeDrivePedestrianRoadSegmentQueryOptions = Readonly<{
  minLengthMeters?: number;
  maxSegments?: number;
  includeServiceRoads?: boolean;
}>;
