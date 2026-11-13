// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.junctions.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import type {
  HomeDriveRoadEndpointRef,
  HomeDriveRoadThroughRef,
  HomeDriveRoadJunctionType,
  HomeDriveRoadJunction,
} from "./homeDrive.roadTopology.types";
import {
  clamp,
  ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS,
  THROUGH_ROAD_MIN_T,
  THROUGH_ROAD_MAX_T,
  getHomeDriveRoadPointKey,
  getHomeDriveRoadPriority,
  dotDirections,
  CONTINUATION_ABS_DOT_THRESHOLD,
  compareHomeDriveRoadPriority,
} from "./homeDrive.roadTopology.priority";

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

export function findThroughRoadsAtEndpoint(
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

export function createJunction(
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
