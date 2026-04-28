// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadVector,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";

export type HomeDriveRoadEndpointSide = "from" | "to";

export type HomeDriveRoadPriority = Readonly<{
  score: number;
  kindScore: number;
  widthScore: number;
  tagScore: number;
}>;

export type HomeDriveRoadEndpointRef = Readonly<{
  key: string;
  cutKey: string;
  side: HomeDriveRoadEndpointSide;
  road: HomeDriveGeneratedRoadSegment;
  position: HomeDriveWorldPosition;
  directionAwayFromJunction: HomeDriveRoadVector;
  priority: HomeDriveRoadPriority;
}>;

export type HomeDriveRoadThroughRef = Readonly<{
  key: string;
  road: HomeDriveGeneratedRoadSegment;
  nearestPoint: HomeDriveWorldPosition;
  t: number;
  distanceMeters: number;
  priority: HomeDriveRoadPriority;
}>;

export type HomeDriveRoadJunctionType =
  | "terminal"
  | "continuation"
  | "t-junction"
  | "cross-junction"
  | "complex";

export type HomeDriveRoadJunction = Readonly<{
  key: string;
  position: HomeDriveWorldPosition;
  endpoints: readonly HomeDriveRoadEndpointRef[];
  throughRoads: readonly HomeDriveRoadThroughRef[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  type: HomeDriveRoadJunctionType;
  dominantRoad: HomeDriveGeneratedRoadSegment | null;
  dominantPriority: HomeDriveRoadPriority | null;
  maxRoadWidth: number;
  operationalHalfWidth: number;
}>;

export type HomeDriveRoadTopologyConnectionKind =
  | "endpoint"
  | "through"
  | "continuation"
  | "turn";

export type HomeDriveRoadTopologyConnection = Readonly<{
  id: string;
  junctionKey: string;

  fromSegmentId: string;
  fromRoadId: string;
  fromEndpointSide: HomeDriveRoadEndpointSide;
  fromEndpointCutKey: string;

  toSegmentId: string;
  toRoadId: string;
  toRoad: HomeDriveGeneratedRoadSegment;
  toEndpointSide: HomeDriveRoadEndpointSide | null;
  toT: number;
  toDirectionSign: 1 | -1;

  turnDot: number;
  score: number;
  kind: HomeDriveRoadTopologyConnectionKind;
}>;

export type HomeDriveRoadTopology = Readonly<{
  segmentsById: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>;
  endpointsByKey: ReadonlyMap<string, readonly HomeDriveRoadEndpointRef[]>;
  junctionsByKey: ReadonlyMap<string, HomeDriveRoadJunction>;
  endpointJunctionsByCutKey: ReadonlyMap<string, HomeDriveRoadJunction>;
  connectionsByEndpointCutKey: ReadonlyMap<
    string,
    readonly HomeDriveRoadTopologyConnection[]
  >;
  connectionsBySegmentId: ReadonlyMap<
    string,
    readonly HomeDriveRoadTopologyConnection[]
  >;
}>;

const POINT_KEY_PRECISION = 100;
const ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS = 2.6;
const THROUGH_ROAD_MIN_T = 0.045;
const THROUGH_ROAD_MAX_T = 0.955;
const THROUGH_ENTRY_T_PADDING = 0.018;
const CONTINUATION_ABS_DOT_THRESHOLD = 0.965;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeVector(vector: HomeDriveRoadVector): HomeDriveRoadVector {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return {
      x: 0,
      z: 1,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function negateVector(vector: HomeDriveRoadVector): HomeDriveRoadVector {
  return {
    x: -vector.x,
    z: -vector.z,
  };
}

function multiplyVector(
  vector: HomeDriveRoadVector,
  scalar: number,
): HomeDriveRoadVector {
  return {
    x: vector.x * scalar,
    z: vector.z * scalar,
  };
}

function dotDirections(
  first: HomeDriveRoadVector,
  second: HomeDriveRoadVector,
): number {
  const normalizedFirst = normalizeVector(first);
  const normalizedSecond = normalizeVector(second);

  return (
    normalizedFirst.x * normalizedSecond.x +
    normalizedFirst.z * normalizedSecond.z
  );
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function getRoadKindScore(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 900;
    case "boulevard":
      return 860;
    case "avenue":
      return 820;
    case "commercial":
      return 620;
    case "ring":
      return 560;
    case "street":
      return 360;
    case "service":
      return 120;
    default:
      return 280;
  }
}

function getRoadTagScore(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);
  let score = 0;

  if (tags.includes("main")) {
    score += 220;
  }

  if (tags.includes("fast")) {
    score += 160;
  }

  if (tags.includes("wide")) {
    score += 120;
  }

  if (tags.includes("connector")) {
    score += 80;
  }

  if (tags.includes("local-no-cross")) {
    score -= 80;
  }

  if (tags.includes("service")) {
    score -= 180;
  }

  if (tags.includes("short")) {
    score -= 120;
  }

  if (tags.includes("approach")) {
    score -= 140;
  }

  if (tags.includes("safe-endcap")) {
    score -= 260;
  }

  return score;
}

export function getHomeDriveRoadPriority(
  road: HomeDriveGeneratedRoadSegment,
): HomeDriveRoadPriority {
  const kindScore = getRoadKindScore(road);
  const widthScore = road.width * 18;
  const tagScore = getRoadTagScore(road);

  return {
    kindScore,
    widthScore,
    tagScore,
    score: kindScore + widthScore + tagScore,
  };
}

export function compareHomeDriveRoadPriority(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): number {
  const firstPriority = getHomeDriveRoadPriority(first);
  const secondPriority = getHomeDriveRoadPriority(second);

  return secondPriority.score - firstPriority.score;
}

export function getHomeDriveRoadPointKey(
  position: HomeDriveWorldPosition,
): string {
  const x = Math.round(position.x * POINT_KEY_PRECISION);
  const z = Math.round(position.z * POINT_KEY_PRECISION);

  return `${x}:${z}`;
}

export function getHomeDriveRoadEndpointCutKey(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): string {
  return `${road.id}:${side}`;
}

export function getHomeDriveRoadEndpointPosition(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): HomeDriveWorldPosition {
  return side === "from" ? road.from : road.to;
}

export function getHomeDriveRoadEndpointDirectionAway(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): HomeDriveRoadVector {
  return side === "from" ? negateVector(road.direction) : road.direction;
}

export function createHomeDriveRoadEndpointRef(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): HomeDriveRoadEndpointRef {
  const position = getHomeDriveRoadEndpointPosition(road, side);

  return {
    key: getHomeDriveRoadPointKey(position),
    cutKey: getHomeDriveRoadEndpointCutKey(road, side),
    side,
    road,
    position,
    directionAwayFromJunction: getHomeDriveRoadEndpointDirectionAway(
      road,
      side,
    ),
    priority: getHomeDriveRoadPriority(road),
  };
}

function projectPointToRoadSegment(
  point: HomeDriveWorldPosition,
  road: HomeDriveGeneratedRoadSegment,
): Readonly<{
  t: number;
  nearestPoint: HomeDriveWorldPosition;
  distanceMeters: number;
}> {
  const segmentX = road.to.x - road.from.x;
  const segmentZ = road.to.z - road.from.z;
  const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;

  if (segmentLengthSquared <= 0.000001) {
    return {
      t: 0,
      nearestPoint: road.from,
      distanceMeters: Math.hypot(point.x - road.from.x, point.z - road.from.z),
    };
  }

  const rawT =
    ((point.x - road.from.x) * segmentX +
      (point.z - road.from.z) * segmentZ) /
    segmentLengthSquared;

  const t = clamp(rawT, 0, 1);

  const nearestPoint = {
    x: road.from.x + segmentX * t,
    z: road.from.z + segmentZ * t,
  };

  return {
    t,
    nearestPoint,
    distanceMeters: Math.hypot(
      point.x - nearestPoint.x,
      point.z - nearestPoint.z,
    ),
  };
}

function findThroughRoadsAtEndpoint(
  endpoint: HomeDriveRoadEndpointRef,
  roads: readonly HomeDriveGeneratedRoadSegment[],
): readonly HomeDriveRoadThroughRef[] {
  const snapDistanceMeters = Math.max(
    ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS,
    endpoint.road.width * 0.16,
  );

  return roads
    .filter((road) => road.id !== endpoint.road.id)
    .map((road): HomeDriveRoadThroughRef | null => {
      const projection = projectPointToRoadSegment(endpoint.position, road);

      if (projection.distanceMeters > snapDistanceMeters) {
        return null;
      }

      if (
        projection.t <= THROUGH_ROAD_MIN_T ||
        projection.t >= THROUGH_ROAD_MAX_T
      ) {
        return null;
      }

      return {
        key: `${getHomeDriveRoadPointKey(endpoint.position)}:through:${
          road.id
        }`,
        road,
        nearestPoint: projection.nearestPoint,
        t: projection.t,
        distanceMeters: projection.distanceMeters,
        priority: getHomeDriveRoadPriority(road),
      };
    })
    .filter((road): road is HomeDriveRoadThroughRef => road !== null)
    .sort((first, second) => {
      if (first.distanceMeters !== second.distanceMeters) {
        return first.distanceMeters - second.distanceMeters;
      }

      return second.priority.score - first.priority.score;
    });
}

function uniqueRoads(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveGeneratedRoadSegment[] {
  return Array.from(
    new Map<string, HomeDriveGeneratedRoadSegment>(
      roads.map((road) => [road.id, road]),
    ).values(),
  );
}

function getJunctionType(
  endpoints: readonly HomeDriveRoadEndpointRef[],
  throughRoads: readonly HomeDriveRoadThroughRef[],
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveRoadJunctionType {
  if (roads.length <= 1) {
    return "terminal";
  }

  if (
    roads.length === 2 &&
    throughRoads.length === 0 &&
    endpoints.length === 2
  ) {
    const [first, second] = endpoints;

    const absDot =
      first && second
        ? Math.abs(
            dotDirections(
              first.directionAwayFromJunction,
              second.directionAwayFromJunction,
            ),
          )
        : 0;

    return absDot >= CONTINUATION_ABS_DOT_THRESHOLD
      ? "continuation"
      : "t-junction";
  }

  if (roads.length === 3) {
    return "t-junction";
  }

  if (roads.length === 4) {
    return "cross-junction";
  }

  return "complex";
}

function createJunction(
  key: string,
  endpoints: readonly HomeDriveRoadEndpointRef[],
  throughRoads: readonly HomeDriveRoadThroughRef[],
): HomeDriveRoadJunction {
  const position =
    endpoints[0]?.position ??
    throughRoads[0]?.nearestPoint ?? {
      x: 0,
      z: 0,
    };

  const roads = uniqueRoads([
    ...endpoints.map((endpoint) => endpoint.road),
    ...throughRoads.map((throughRoad) => throughRoad.road),
  ]);

  roads.sort(compareHomeDriveRoadPriority);

  const dominantRoad = roads[0] ?? null;
  const dominantPriority = dominantRoad
    ? getHomeDriveRoadPriority(dominantRoad)
    : null;

  const maxRoadWidth = roads.reduce<number>(
    (maxWidth: number, road: HomeDriveGeneratedRoadSegment) =>
      Math.max(maxWidth, road.width),
    0,
  );

  return {
    key,
    position,
    endpoints,
    throughRoads,
    roads,
    type: getJunctionType(endpoints, throughRoads, roads),
    dominantRoad,
    dominantPriority,
    maxRoadWidth,
    operationalHalfWidth: Math.max(4.8, maxRoadWidth * 0.52),
  };
}

function getEndpointConnectionKind(
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadEndpointRef,
  turnDot: number,
): HomeDriveRoadTopologyConnectionKind {
  if (source.road.roadId === target.road.roadId) {
    return "continuation";
  }

  return turnDot >= 0.86 ? "continuation" : "turn";
}

function getConnectionScore(
  sourceIncomingDirection: HomeDriveRoadVector,
  targetOutgoingDirection: HomeDriveRoadVector,
  targetPriority: HomeDriveRoadPriority,
  targetRoad: HomeDriveGeneratedRoadSegment,
): Readonly<{
  turnDot: number;
  score: number;
}> {
  const turnDot = dotDirections(sourceIncomingDirection, targetOutgoingDirection);
  const tags = getRoadTags(targetRoad);

  let score = targetPriority.score * 0.22 + turnDot * 460;

  if (turnDot < -0.42) {
    score -= 360;
  }

  if (turnDot > 0.92) {
    score += 90;
  }

  if (tags.includes("connector")) {
    score += 42;
  }

  if (tags.includes("local-no-cross")) {
    score -= 120;
  }

  if (tags.includes("safe-endcap")) {
    score -= 260;
  }

  if (targetRoad.kind === "service") {
    score -= 90;
  }

  return {
    turnDot,
    score,
  };
}

function createEndpointToEndpointConnection(
  junction: HomeDriveRoadJunction,
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadEndpointRef,
): HomeDriveRoadTopologyConnection | null {
  if (source.road.id === target.road.id) {
    return null;
  }

  const toDirectionSign: 1 | -1 = target.side === "from" ? 1 : -1;

  if (!target.road.bidirectional && toDirectionSign === -1) {
    return null;
  }

  const sourceIncomingDirection = negateVector(source.directionAwayFromJunction);
  const targetOutgoingDirection = target.directionAwayFromJunction;

  const { turnDot, score } = getConnectionScore(
    sourceIncomingDirection,
    targetOutgoingDirection,
    target.priority,
    target.road,
  );

  return {
    id: `${source.cutKey}->${target.cutKey}`,
    junctionKey: junction.key,

    fromSegmentId: source.road.id,
    fromRoadId: source.road.roadId,
    fromEndpointSide: source.side,
    fromEndpointCutKey: source.cutKey,

    toSegmentId: target.road.id,
    toRoadId: target.road.roadId,
    toRoad: target.road,
    toEndpointSide: target.side,
    toT: target.side === "from" ? 0 : 1,
    toDirectionSign,

    turnDot,
    score,
    kind: getEndpointConnectionKind(source, target, turnDot),
  };
}

function createEndpointToThroughConnections(
  junction: HomeDriveRoadJunction,
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadThroughRef,
): readonly HomeDriveRoadTopologyConnection[] {
  if (source.road.id === target.road.id) {
    return [];
  }

  const sourceIncomingDirection = negateVector(source.directionAwayFromJunction);

  const allowedDirectionSigns: readonly (1 | -1)[] = target.road.bidirectional
    ? [1, -1]
    : [1];

  return allowedDirectionSigns.map((toDirectionSign) => {
    const targetOutgoingDirection = multiplyVector(
      target.road.direction,
      toDirectionSign,
    );

    const { turnDot, score } = getConnectionScore(
      sourceIncomingDirection,
      targetOutgoingDirection,
      target.priority,
      target.road,
    );

    const paddedT = clamp(
      target.t + THROUGH_ENTRY_T_PADDING * toDirectionSign,
      THROUGH_ROAD_MIN_T,
      THROUGH_ROAD_MAX_T,
    );

    return {
      id: `${source.cutKey}->${target.road.id}:through:${toDirectionSign}`,
      junctionKey: junction.key,

      fromSegmentId: source.road.id,
      fromRoadId: source.road.roadId,
      fromEndpointSide: source.side,
      fromEndpointCutKey: source.cutKey,

      toSegmentId: target.road.id,
      toRoadId: target.road.roadId,
      toRoad: target.road,
      toEndpointSide: null,
      toT: paddedT,
      toDirectionSign,

      turnDot,
      score,
      kind: "through",
    };
  });
}

function buildConnectionsForJunction(
  junction: HomeDriveRoadJunction,
): readonly HomeDriveRoadTopologyConnection[] {
  if (junction.type === "terminal") {
    return [];
  }

  return junction.endpoints.flatMap((source) => {
    const endpointConnections = junction.endpoints
      .map((target) =>
        createEndpointToEndpointConnection(junction, source, target),
      )
      .filter(
        (
          connection,
        ): connection is HomeDriveRoadTopologyConnection =>
          connection !== null,
      );

    const throughConnections = junction.throughRoads.flatMap((throughRoad) =>
      createEndpointToThroughConnections(junction, source, throughRoad),
    );

    return [...endpointConnections, ...throughConnections].sort(
      (first, second) => second.score - first.score,
    );
  });
}

function appendToMapArray<Key, Value>(
  map: Map<Key, Value[]>,
  key: Key,
  value: Value,
): void {
  const currentValues = map.get(key);

  if (!currentValues) {
    map.set(key, [value]);
    return;
  }

  currentValues.push(value);
}

export function buildHomeDriveRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveRoadTopology {
  const segmentsById = new Map<string, HomeDriveGeneratedRoadSegment>();
  const endpointsByKey = new Map<string, HomeDriveRoadEndpointRef[]>();

  for (const road of roads) {
    segmentsById.set(road.id, road);

    const fromEndpoint = createHomeDriveRoadEndpointRef(road, "from");
    const toEndpoint = createHomeDriveRoadEndpointRef(road, "to");

    appendToMapArray(endpointsByKey, fromEndpoint.key, fromEndpoint);
    appendToMapArray(endpointsByKey, toEndpoint.key, toEndpoint);
  }

  const junctionsByKey = new Map<string, HomeDriveRoadJunction>();
  const endpointJunctionsByCutKey = new Map<string, HomeDriveRoadJunction>();

  const connectionsByEndpointCutKey = new Map<
    string,
    HomeDriveRoadTopologyConnection[]
  >();

  const connectionsBySegmentId = new Map<
    string,
    HomeDriveRoadTopologyConnection[]
  >();

  for (const [key, endpoints] of endpointsByKey.entries()) {
    const throughRoads = endpoints.flatMap((endpoint) =>
      findThroughRoadsAtEndpoint(endpoint, roads),
    );

    const uniqueThroughRoads = Array.from(
      new Map<string, HomeDriveRoadThroughRef>(
        throughRoads.map((throughRoad) => [
          throughRoad.road.id,
          throughRoad,
        ]),
      ).values(),
    );

    const junction = createJunction(key, endpoints, uniqueThroughRoads);

    if (junction.type === "terminal") {
      continue;
    }

    junctionsByKey.set(key, junction);

    for (const endpoint of endpoints) {
      endpointJunctionsByCutKey.set(endpoint.cutKey, junction);
    }

    const connections = buildConnectionsForJunction(junction);

    for (const connection of connections) {
      appendToMapArray(
        connectionsByEndpointCutKey,
        connection.fromEndpointCutKey,
        connection,
      );

      appendToMapArray(
        connectionsBySegmentId,
        connection.fromSegmentId,
        connection,
      );
    }
  }

  return {
    segmentsById,
    endpointsByKey,
    junctionsByKey,
    endpointJunctionsByCutKey,
    connectionsByEndpointCutKey,
    connectionsBySegmentId,
  };
}

export function getHomeDriveRoadTopologyConnectionsFromEndpoint(
  topology: HomeDriveRoadTopology,
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): readonly HomeDriveRoadTopologyConnection[] {
  return (
    topology.connectionsByEndpointCutKey.get(
      getHomeDriveRoadEndpointCutKey(road, side),
    ) ?? []
  );
}
