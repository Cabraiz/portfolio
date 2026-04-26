// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";

export type HomeDriveThreeRoadEndpointSide = "from" | "to";

export type HomeDriveThreeRoadPriority = Readonly<{
  score: number;
  kindScore: number;
  widthScore: number;
  tagScore: number;
}>;

export type HomeDriveThreeRoadEndpointRef = Readonly<{
  key: string;
  side: HomeDriveThreeRoadEndpointSide;
  road: HomeDriveGeneratedRoadSegment;
  position: HomeDriveWorldPosition;
  directionAwayFromJunction: Readonly<{
    x: number;
    z: number;
  }>;
  priority: HomeDriveThreeRoadPriority;
}>;

export type HomeDriveThreeRoadThroughRef = Readonly<{
  key: string;
  road: HomeDriveGeneratedRoadSegment;
  nearestPoint: HomeDriveWorldPosition;
  distanceMeters: number;
  priority: HomeDriveThreeRoadPriority;
}>;

export type HomeDriveThreeRoadJunctionType =
  | "terminal"
  | "continuation"
  | "t-junction"
  | "cross-junction"
  | "complex";

export type HomeDriveThreeRoadJunction = Readonly<{
  key: string;
  position: HomeDriveWorldPosition;
  endpoints: readonly HomeDriveThreeRoadEndpointRef[];
  throughRoads: readonly HomeDriveThreeRoadThroughRef[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  type: HomeDriveThreeRoadJunctionType;
  dominantRoad: HomeDriveGeneratedRoadSegment | null;
  dominantPriority: HomeDriveThreeRoadPriority | null;
  maxRoadWidth: number;
  operationalHalfWidth: number;
}>;

export type HomeDriveThreeRoadTopology = Readonly<{
  junctionsByKey: ReadonlyMap<string, HomeDriveThreeRoadJunction>;
  endpointJunctionsByCutKey: ReadonlyMap<string, HomeDriveThreeRoadJunction>;
}>;

const POINT_KEY_PRECISION = 100;
const ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS = 2.6;
const CONTINUATION_ABS_DOT_THRESHOLD = 0.965;

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  const maybeRoadWithTags = road as HomeDriveGeneratedRoadSegment & {
    tags?: readonly string[];
  };

  return Array.isArray(maybeRoadWithTags.tags) ? maybeRoadWithTags.tags : [];
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

  return score;
}

export function getHomeDriveThreeRoadPriority(
  road: HomeDriveGeneratedRoadSegment,
): HomeDriveThreeRoadPriority {
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

export function compareHomeDriveThreeRoadPriority(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): number {
  const firstPriority = getHomeDriveThreeRoadPriority(first);
  const secondPriority = getHomeDriveThreeRoadPriority(second);

  if (firstPriority.score !== secondPriority.score) {
    return secondPriority.score - firstPriority.score;
  }

  if (first.width !== second.width) {
    return second.width - first.width;
  }

  return first.id.localeCompare(second.id);
}

export function getHomeDriveThreeRoadPointKey(
  point: HomeDriveWorldPosition,
): string {
  const x = Math.round(point.x * POINT_KEY_PRECISION) / POINT_KEY_PRECISION;
  const z = Math.round(point.z * POINT_KEY_PRECISION) / POINT_KEY_PRECISION;

  return `${x}:${z}`;
}

export function getHomeDriveThreeRoadEndpointCutKey(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): string {
  return `${road.id}::${side}`;
}

export function getHomeDriveThreeRoadDistance(
  first: HomeDriveWorldPosition,
  second: HomeDriveWorldPosition,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

export function getHomeDriveThreeRoadNormalizedDot(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const firstLength = Math.hypot(first.x, first.z);
  const secondLength = Math.hypot(second.x, second.z);

  if (firstLength <= 0.000001 || secondLength <= 0.000001) {
    return 1;
  }

  return (
    (first.x * second.x + first.z * second.z) / (firstLength * secondLength)
  );
}

function getEndpointDirectionAwayFromJunction(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): Readonly<{ x: number; z: number }> {
  if (side === "from") {
    return {
      x: road.direction.x,
      z: road.direction.z,
    };
  }

  return {
    x: -road.direction.x,
    z: -road.direction.z,
  };
}

function createEndpointRef(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): HomeDriveThreeRoadEndpointRef {
  const position = side === "from" ? road.from : road.to;
  const key = getHomeDriveThreeRoadPointKey(position);

  return {
    key,
    side,
    road,
    position,
    directionAwayFromJunction: getEndpointDirectionAwayFromJunction(road, side),
    priority: getHomeDriveThreeRoadPriority(road),
  };
}

function projectPointOnRoadSegment(
  point: HomeDriveWorldPosition,
  road: HomeDriveGeneratedRoadSegment,
): Readonly<{
  nearestPoint: HomeDriveWorldPosition;
  distanceMeters: number;
  t: number;
}> {
  const segmentX = road.to.x - road.from.x;
  const segmentZ = road.to.z - road.from.z;
  const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;

  if (segmentLengthSquared <= 0.000001) {
    return {
      nearestPoint: road.from,
      distanceMeters: getHomeDriveThreeRoadDistance(point, road.from),
      t: 0,
    };
  }

  const rawT =
    ((point.x - road.from.x) * segmentX + (point.z - road.from.z) * segmentZ) /
    segmentLengthSquared;

  const t = Math.max(0, Math.min(1, rawT));

  const nearestPoint = {
    x: road.from.x + segmentX * t,
    z: road.from.z + segmentZ * t,
  };

  return {
    nearestPoint,
    distanceMeters: getHomeDriveThreeRoadDistance(point, nearestPoint),
    t,
  };
}

function isInteriorProjection(t: number): boolean {
  return t > 0.035 && t < 0.965;
}

function findThroughRoadsAtEndpoint(
  endpoint: HomeDriveThreeRoadEndpointRef,
  roads: readonly HomeDriveGeneratedRoadSegment[],
): readonly HomeDriveThreeRoadThroughRef[] {
  const throughRoads: HomeDriveThreeRoadThroughRef[] = [];

  for (const road of roads) {
    if (road.id === endpoint.road.id) {
      continue;
    }

    const projection = projectPointOnRoadSegment(endpoint.position, road);

    if (
      projection.distanceMeters > ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS ||
      !isInteriorProjection(projection.t)
    ) {
      continue;
    }

    throughRoads.push({
      key: endpoint.key,
      road,
      nearestPoint: projection.nearestPoint,
      distanceMeters: projection.distanceMeters,
      priority: getHomeDriveThreeRoadPriority(road),
    });
  }

  return throughRoads.sort((first, second) =>
    compareHomeDriveThreeRoadPriority(first.road, second.road),
  );
}

function getUniqueRoads(
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): readonly HomeDriveGeneratedRoadSegment[] {
  const roadById = new Map<string, HomeDriveGeneratedRoadSegment>();

  endpoints.forEach((endpoint) => {
    roadById.set(endpoint.road.id, endpoint.road);
  });

  throughRoads.forEach((throughRoad) => {
    roadById.set(throughRoad.road.id, throughRoad.road);
  });

  return Array.from(roadById.values()).sort(compareHomeDriveThreeRoadPriority);
}

function getDominantRoad(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveGeneratedRoadSegment | null {
  return roads.length > 0 ? roads[0] : null;
}

function getMaxRoadWidth(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): number {
  if (roads.length === 0) {
    return 0;
  }

  return Math.max(...roads.map((road) => road.width));
}

function classifyJunction(
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): HomeDriveThreeRoadJunctionType {
  if (endpoints.length <= 1 && throughRoads.length === 0) {
    return "terminal";
  }

  if (throughRoads.length > 0 && endpoints.length >= 1) {
    return "t-junction";
  }

  if (endpoints.length >= 4) {
    return "cross-junction";
  }

  if (endpoints.length >= 3) {
    return "t-junction";
  }

  if (endpoints.length === 2) {
    const dot = getHomeDriveThreeRoadNormalizedDot(
      endpoints[0].directionAwayFromJunction,
      endpoints[1].directionAwayFromJunction,
    );

    return Math.abs(dot) >= CONTINUATION_ABS_DOT_THRESHOLD
      ? "continuation"
      : "t-junction";
  }

  return "complex";
}

function createJunction(
  key: string,
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): HomeDriveThreeRoadJunction {
  const roads = getUniqueRoads(endpoints, throughRoads);
  const dominantRoad = getDominantRoad(roads);
  const dominantPriority = dominantRoad
    ? getHomeDriveThreeRoadPriority(dominantRoad)
    : null;
  const maxRoadWidth = getMaxRoadWidth(roads);

  const position =
    endpoints[0]?.position ??
    throughRoads[0]?.nearestPoint ?? {
      x: 0,
      z: 0,
    };

  return {
    key,
    position,
    endpoints,
    throughRoads,
    roads,
    type: classifyJunction(endpoints, throughRoads),
    dominantRoad,
    dominantPriority,
    maxRoadWidth,
    operationalHalfWidth: Math.max(6, maxRoadWidth / 2),
  };
}

export function isHomeDriveThreeDominantRoadAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  if (!junction.dominantRoad) {
    return false;
  }

  return junction.dominantRoad.id === road.id;
}

export function isHomeDriveThreeSubordinateRoadAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  if (!junction.dominantRoad) {
    return false;
  }

  if (junction.dominantRoad.id === road.id) {
    return false;
  }

  const roadPriority = getHomeDriveThreeRoadPriority(road);
  const dominantPriority = junction.dominantPriority;

  if (!dominantPriority) {
    return false;
  }

  return roadPriority.score < dominantPriority.score;
}

export function buildHomeDriveThreeRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveThreeRoadTopology {
  const endpointsByKey = new Map<string, HomeDriveThreeRoadEndpointRef[]>();

  for (const road of roads) {
    const fromEndpoint = createEndpointRef(road, "from");
    const toEndpoint = createEndpointRef(road, "to");

    endpointsByKey.set(fromEndpoint.key, [
      ...(endpointsByKey.get(fromEndpoint.key) ?? []),
      fromEndpoint,
    ]);

    endpointsByKey.set(toEndpoint.key, [
      ...(endpointsByKey.get(toEndpoint.key) ?? []),
      toEndpoint,
    ]);
  }

  const junctionsByKey = new Map<string, HomeDriveThreeRoadJunction>();
  const endpointJunctionsByCutKey = new Map<
    string,
    HomeDriveThreeRoadJunction
  >();

  for (const [key, endpoints] of endpointsByKey.entries()) {
    const throughRoads = endpoints.flatMap((endpoint) =>
      findThroughRoadsAtEndpoint(endpoint, roads),
    );

    const uniqueThroughRoads = Array.from(
      new Map(throughRoads.map((throughRoad) => [throughRoad.road.id, throughRoad])).values(),
    );

    const junction = createJunction(key, endpoints, uniqueThroughRoads);

    if (junction.type === "terminal") {
      continue;
    }

    junctionsByKey.set(key, junction);

    endpoints.forEach((endpoint) => {
      endpointJunctionsByCutKey.set(
        getHomeDriveThreeRoadEndpointCutKey(endpoint.road, endpoint.side),
        junction,
      );
    });
  }

  return {
    junctionsByKey,
    endpointJunctionsByCutKey,
  };
}
