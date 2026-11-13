// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.endpoints.ts

import type {
	HomeDriveGeneratedRoadSegment,
	HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import type {
	HomeDriveThreeRoadEndpointSide,
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadThroughRef,
} from "./homeDriveThree.roadTopology.types";
import {
	ENDPOINT_TO_SEGMENT_BASE_SNAP_DISTANCE_METERS,
	ENDPOINT_TO_SEGMENT_EXTRA_MARGIN_METERS,
	ENDPOINT_TO_SEGMENT_MAX_SNAP_DISTANCE_METERS,
	ENDPOINT_TO_SEGMENT_PARALLEL_REJECTION_ABS_DOT,
	clamp,
	getHomeDriveThreeRoadPriority,
	compareHomeDriveThreeRoadPriority,
	getHomeDriveThreeRoadPointKey,
	getHomeDriveThreeRoadDistance,
	getHomeDriveThreeRoadNormalizedDot,
} from "./homeDriveThree.roadTopology.metrics";

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

export function createEndpointRef(
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
    ((point.x - road.from.x) * segmentX +
      (point.z - road.from.z) * segmentZ) /
    segmentLengthSquared;

  const t = clamp(rawT, 0, 1);

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
  return t > 0.02 && t < 0.98;
}

function getEndpointToSegmentSnapDistanceMeters(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveGeneratedRoadSegment,
): number {
  const endpointHalfWidth = Math.max(1.5, endpoint.road.width / 2);
  const throughHalfWidth = Math.max(1.5, throughRoad.width / 2);

  return clamp(
    endpointHalfWidth +
      throughHalfWidth +
      ENDPOINT_TO_SEGMENT_EXTRA_MARGIN_METERS,
    ENDPOINT_TO_SEGMENT_BASE_SNAP_DISTANCE_METERS,
    ENDPOINT_TO_SEGMENT_MAX_SNAP_DISTANCE_METERS,
  );
}

function isEndpointToSegmentDirectionPlausible(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  const absDot = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(
      endpoint.road.direction,
      throughRoad.direction,
    ),
  );

  return absDot < ENDPOINT_TO_SEGMENT_PARALLEL_REJECTION_ABS_DOT;
}

export function findThroughRoadsAtEndpoint(
  endpoint: HomeDriveThreeRoadEndpointRef,
  roads: readonly HomeDriveGeneratedRoadSegment[],
): readonly HomeDriveThreeRoadThroughRef[] {
  const throughRoads: HomeDriveThreeRoadThroughRef[] = [];

  for (const road of roads) {
    if (road.id === endpoint.road.id) {
      continue;
    }

    if (!isEndpointToSegmentDirectionPlausible(endpoint, road)) {
      continue;
    }

    const projection = projectPointOnRoadSegment(endpoint.position, road);

    if (!isInteriorProjection(projection.t)) {
      continue;
    }

    const snapDistance = getEndpointToSegmentSnapDistanceMeters(endpoint, road);

    if (projection.distanceMeters > snapDistance) {
      continue;
    }

    throughRoads.push({
      key: getHomeDriveThreeRoadPointKey(projection.nearestPoint),
      road,
      nearestPoint: projection.nearestPoint,
      distanceMeters: projection.distanceMeters,
      priority: getHomeDriveThreeRoadPriority(road),
    });
  }

  throughRoads.sort((first, second) => {
    if (first.distanceMeters !== second.distanceMeters) {
      return first.distanceMeters - second.distanceMeters;
    }

    return compareHomeDriveThreeRoadPriority(first.road, second.road);
  });

  return throughRoads;
}

export function getUniqueRoads(
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): HomeDriveGeneratedRoadSegment[] {
  const roadById = new Map<string, HomeDriveGeneratedRoadSegment>();

  for (const endpoint of endpoints) {
    roadById.set(endpoint.road.id, endpoint.road);
  }

  for (const throughRoad of throughRoads) {
    roadById.set(throughRoad.road.id, throughRoad.road);
  }

  const roads = Array.from(roadById.values());
  roads.sort(compareHomeDriveThreeRoadPriority);

  return roads;
}

export function getDominantRoad(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveGeneratedRoadSegment | null {
  return roads[0] ?? null;
}

export function getMaxRoadWidth(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): number {
  return roads.reduce<number>(
    (maxWidth, road) => Math.max(maxWidth, road.width),
    0,
  );
}
