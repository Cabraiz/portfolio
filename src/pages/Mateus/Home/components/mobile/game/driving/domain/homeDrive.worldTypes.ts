export type HomeDriveWorldPoint = Readonly<{
  x: number;
  y: number;
}>;

export type HomeDriveWorldBounds = Readonly<{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}>;

export type HomeDriveWorldCoordinateSystem = Readonly<{
  x: string;
  y: string;
}>;

export type HomeDriveWorldAmbience =
  | "coast"
  | "nightlife"
  | "residential"
  | "downtown"
  | "academic"
  | "stadium"
  | "park"
  | "urban"
  | "generic";

export type HomeDriveWorldDistrict = Readonly<{
  id: string;
  label: string;
  center: HomeDriveWorldPoint;
  ambience: HomeDriveWorldAmbience;
}>;

export type HomeDriveWorldRoadKind =
  | "avenue"
  | "street"
  | "coastal"
  | "service"
  | "commercial"
  | "ring"
  | "connector"
  | "highway"
  | "alley";

export type HomeDriveWorldRoadTone =
  | "boulevard"
  | "avenue"
  | "corridor"
  | "urban-core"
  | "service"
  | "coastal"
  | "generic";

export type HomeDriveWorldRoadSurface =
  | "asphalt"
  | "stone"
  | "concrete"
  | "sand"
  | "dirt";

export type HomeDriveWorldRoad = Readonly<{
  id: string;
  label: string;
  districtId: string;
  kind: HomeDriveWorldRoadKind;
  roadTone: HomeDriveWorldRoadTone;
  laneCount: number;
  width: number;
  speedLimitKmh: number;
  bidirectional: boolean;
  surface: HomeDriveWorldRoadSurface;
  points: readonly HomeDriveWorldPoint[];
  tags?: readonly string[];
}>;

export type HomeDriveWorldLandmarkKind =
  | "coast"
  | "culture"
  | "downtown"
  | "academic"
  | "park"
  | "stadium"
  | "generic";

export type HomeDriveWorldLandmark = Readonly<{
  id: string;
  label: string;
  districtId: string;
  position: HomeDriveWorldPoint;
  kind: HomeDriveWorldLandmarkKind;
  radius: number;
}>;

export type HomeDriveWorldSpawn = Readonly<{
  roadId: string;
  position: HomeDriveWorldPoint;
  headingDeg: number;
  speedKmh: number;
}>;

export type HomeDriveWorldTurningConfig = Readonly<{
  minTurnSpeedKmh: number;
  maxTurnRateDegPerSecond: number;
  steeringReturnRate: number;
}>;

export type HomeDriveWorldCameraConfig = Readonly<{
  visibleDistanceMeters: number;
  sideVisibilityMeters: number;
  projectionMode: "cockpit-2-5d" | "topdown" | "debug";
}>;

export type HomeDriveWorldGameplayConfig = Readonly<{
  snapToRoad: boolean;
  snapDistanceMeters: number;
  intersectionRadiusMeters: number;
  offRoadAllowed: boolean;
  defaultRoadGrip: number;
  turning: HomeDriveWorldTurningConfig;
  camera: HomeDriveWorldCameraConfig;
}>;

export type HomeDriveWorldMap = Readonly<{
  id: string;
  label: string;
  version: number;
  units: "virtual-meters";
  coordinateSystem: HomeDriveWorldCoordinateSystem;
  worldBounds: HomeDriveWorldBounds;
  spawn: HomeDriveWorldSpawn;
  districts: readonly HomeDriveWorldDistrict[];
  nodes?: readonly (HomeDriveWorldPoint & Readonly<{ id: string }>)[];
  roads: readonly HomeDriveWorldRoad[];
  landmarks: readonly HomeDriveWorldLandmark[];
  gameplay: HomeDriveWorldGameplayConfig;
}>;

export type HomeDriveWorldInputState = Readonly<{
  steer: number;
  throttle: boolean | number;
  brake: boolean | number;
}>;

export type HomeDriveWorldCarState = Readonly<{
  x: number;
  y: number;
  headingDeg: number;
  speedKmh: number;
  steering: number;
  currentRoadId?: string;
  currentDistrictId?: string;
  odometerMeters: number;
  offRoadMeters: number;
}>;

export type HomeDriveWorldSegmentProjection = Readonly<{
  road: HomeDriveWorldRoad;
  roadIndex: number;
  segmentIndex: number;
  segmentStart: HomeDriveWorldPoint;
  segmentEnd: HomeDriveWorldPoint;
  closestPoint: HomeDriveWorldPoint;
  distanceMeters: number;
  signedDistanceMeters: number;
  segmentProgress: number;
  roadProgress: number;
  segmentHeadingDeg: number;
  usableHeadingDeg: number;
  roadLengthMeters: number;
  isInsideRoad: boolean;
  side: "left" | "right" | "center";
}>;

export type HomeDriveNearestRoadResult = HomeDriveWorldSegmentProjection;

export type HomeDriveWorldRoadContext = Readonly<{
  nearestRoad?: HomeDriveNearestRoadResult;
  currentRoad?: HomeDriveWorldRoad;
  currentDistrict?: HomeDriveWorldDistrict;
  currentLandmark?: HomeDriveWorldLandmark;
  nearbyLandmarks: readonly HomeDriveWorldLandmark[];
  intersectionsAhead: readonly HomeDriveWorldIntersection[];
}>;

export type HomeDriveWorldIntersection = Readonly<{
  id: string;
  roadId: string;
  roadLabel: string;
  targetRoadId: string;
  targetRoadLabel: string;
  position: HomeDriveWorldPoint;
  distanceMeters: number;
  angleDeg: number;
  turnSide: "left" | "right" | "front" | "behind";
}>;

export type HomeDriveSnapRoadConfig = Readonly<{
  enabled: boolean;
  snapDistanceMeters: number;
  offRoadAllowed: boolean;
  headingSnapStrength: number;
  maxHeadingSnapDeg: number;
}>;

export type HomeDriveSnapRoadResult = Readonly<{
  car: HomeDriveWorldCarState;
  nearestRoad?: HomeDriveNearestRoadResult;
  snapped: boolean;
  distanceToRoadMeters: number;
}>;

export type HomeDriveWorldPhysicsConfig = Readonly<{
  maxSpeedKmh: number;
  reverseMaxSpeedKmh: number;
  accelerationKmhPerSecond: number;
  brakeKmhPerSecond: number;
  naturalDecelerationKmhPerSecond: number;
  dragPerSecond: number;
  maxSteeringInput: number;
  steeringResponsePerSecond: number;
  steeringReturnPerSecond: number;
  minTurnSpeedKmh: number;
  maxTurnRateDegPerSecond: number;
  lowSpeedTurnMultiplier: number;
  roadGrip: number;
  offRoadGrip: number;
  offRoadSpeedPenalty: number;
  snap: HomeDriveSnapRoadConfig;
}>;

export type HomeDriveWorldCameraState = Readonly<{
  roadDriftPx: number;
  cameraRollDeg: number;
  horizonShiftPx: number;
  parallaxPx: number;
  cameraYaw: number;
  cameraPitch: number;
  steeringIntensity: number;
  roadAlignmentDeg: number;
  speedIntensity: number;
}>;

export type HomeDriveWorldCameraInput = Readonly<{
  car: HomeDriveWorldCarState;
  nearestRoad?: HomeDriveNearestRoadResult;
  deltaSeconds?: number;
}>;

export type HomeDriveProjectedWorldRoadSide =
  | "front"
  | "left"
  | "right"
  | "behind";

export type HomeDriveProjectedWorldRoad = Readonly<{
  id: string;
  roadId: string;
  roadLabel: string;
  kind: HomeDriveWorldRoadKind;
  roadTone: HomeDriveWorldRoadTone;
  side: HomeDriveProjectedWorldRoadSide;
  distanceMeters: number;
  angleDeg: number;
  screenXPercent: number;
  bottomPercent: number;
  widthPercent: number;
  heightPercent: number;
  opacity: number;
  scale: number;
  blurPx: number;
  skewDeg: number;
  rotateDeg: number;
  zIndex: number;
  isIntersectionCandidate: boolean;
}>;

export type HomeDriveWorldProjectionConfig = Readonly<{
  visibleDistanceMeters: number;
  sideVisibilityMeters: number;
  behindVisibilityMeters: number;
  minBottomPercent: number;
  maxBottomPercent: number;
  minWidthPercent: number;
  maxWidthPercent: number;
  maxRoads: number;
}>;

export type HomeDriveWorldProjectionResult = Readonly<{
  projectedRoads: readonly HomeDriveProjectedWorldRoad[];
  nearestRoad?: HomeDriveNearestRoadResult;
  currentRoad?: HomeDriveWorldRoad;
  currentDistrict?: HomeDriveWorldDistrict;
  intersectionsAhead: readonly HomeDriveWorldIntersection[];
}>;
