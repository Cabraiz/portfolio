// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.junctions.ts

import type {
	HomeDriveGeneratedRoadSegment,
	HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import type {
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadThroughRef,
	HomeDriveThreeRoadJunctionType,
	HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology.types";
import {
	CONTINUATION_ABS_DOT_THRESHOLD,
	DOMINANT_CONTINUATION_ABS_DOT_THRESHOLD,
	DOMINANT_CONTINUATION_PRIORITY_DELTA,
	DOMINANT_CONTINUATION_MIN_WIDTH_RATIO,
	getHomeDriveThreeRoadPriority,
	compareHomeDriveThreeRoadPriority,
	getHomeDriveThreeRoadNormalizedDot,
} from "./homeDriveThree.roadTopology.metrics";
import {
	getUniqueRoads,
	getDominantRoad,
	getMaxRoadWidth,
} from "./homeDriveThree.roadTopology.endpoints";

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
    const firstEndpoint = endpoints[0];
    const secondEndpoint = endpoints[1];

    if (!firstEndpoint || !secondEndpoint) {
      return "complex";
    }

    const dot = getHomeDriveThreeRoadNormalizedDot(
      firstEndpoint.directionAwayFromJunction,
      secondEndpoint.directionAwayFromJunction,
    );

    return Math.abs(dot) >= CONTINUATION_ABS_DOT_THRESHOLD
      ? "continuation"
      : "t-junction";
  }

  return "complex";
}

function getAverageEndpointPosition(
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
): HomeDriveWorldPosition {
  if (endpoints.length === 0) {
    return {
      x: 0,
      z: 0,
    };
  }

  const total = endpoints.reduce(
    (acc, endpoint) => ({
      x: acc.x + endpoint.position.x,
      z: acc.z + endpoint.position.z,
    }),
    {
      x: 0,
      z: 0,
    },
  );

  return {
    x: total.x / endpoints.length,
    z: total.z / endpoints.length,
  };
}

function getJunctionPosition(
  endpoints: readonly HomeDriveThreeRoadEndpointRef[],
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): HomeDriveWorldPosition {
  const firstThroughRoad = throughRoads[0];

  if (firstThroughRoad) {
    return firstThroughRoad.nearestPoint;
  }

  return getAverageEndpointPosition(endpoints);
}

export function createJunction(
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

  return {
    key,
    position: getJunctionPosition(endpoints, throughRoads),
    endpoints,
    throughRoads,
    roads,
    type: classifyJunction(endpoints, throughRoads),
    dominantRoad,
    dominantPriority,
    maxRoadWidth,
    operationalHalfWidth: Math.max(6, maxRoadWidth / 2 + 1.5),
  };
}

function isSameLogicalRoad(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): boolean {
  return first.id === second.id || first.roadId === second.roadId;
}

function isDominantContinuationCandidate(
  road: HomeDriveGeneratedRoadSegment,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  if (isSameLogicalRoad(road, dominantRoad)) {
    return true;
  }

  const absDot = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(road.direction, dominantRoad.direction),
  );

  if (absDot < DOMINANT_CONTINUATION_ABS_DOT_THRESHOLD) {
    return false;
  }

  const roadPriority = getHomeDriveThreeRoadPriority(road);
  const dominantPriority = getHomeDriveThreeRoadPriority(dominantRoad);

  if (
    Math.abs(roadPriority.score - dominantPriority.score) >
    DOMINANT_CONTINUATION_PRIORITY_DELTA
  ) {
    return false;
  }

  const minWidth = Math.min(road.width, dominantRoad.width);
  const maxWidth = Math.max(road.width, dominantRoad.width);

  return minWidth / Math.max(0.001, maxWidth) >= DOMINANT_CONTINUATION_MIN_WIDTH_RATIO;
}

export function isHomeDriveThreeDominantRoadAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  if (!junction.dominantRoad) {
    return false;
  }

  return isDominantContinuationCandidate(road, junction.dominantRoad);
}

export function isHomeDriveThreeSubordinateRoadAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  if (!junction.dominantRoad) {
    return false;
  }

  if (isHomeDriveThreeDominantRoadAtJunction(road, junction)) {
    return false;
  }

  const roadPriority = getHomeDriveThreeRoadPriority(road);
  const dominantPriority = junction.dominantPriority;

  if (!dominantPriority) {
    return false;
  }

  return roadPriority.score < dominantPriority.score;
}

export function appendEndpointToKey(
  endpointsByKey: Map<string, HomeDriveThreeRoadEndpointRef[]>,
  key: string,
  endpoint: HomeDriveThreeRoadEndpointRef,
): void {
  const currentEndpoints = endpointsByKey.get(key);

  if (!currentEndpoints) {
    endpointsByKey.set(key, [endpoint]);
    return;
  }

  currentEndpoints.push(endpoint);
}

export function getUniqueThroughRoads(
  throughRoads: readonly HomeDriveThreeRoadThroughRef[],
): HomeDriveThreeRoadThroughRef[] {
  const throughRoadById = new Map<string, HomeDriveThreeRoadThroughRef>();

  for (const throughRoad of throughRoads) {
    const currentThroughRoad = throughRoadById.get(throughRoad.road.id);

    if (!currentThroughRoad) {
      throughRoadById.set(throughRoad.road.id, throughRoad);
      continue;
    }

    if (throughRoad.distanceMeters < currentThroughRoad.distanceMeters) {
      throughRoadById.set(throughRoad.road.id, throughRoad);
    }
  }

  const uniqueThroughRoads = Array.from(throughRoadById.values());

  uniqueThroughRoads.sort((first, second) => {
    if (first.distanceMeters !== second.distanceMeters) {
      return first.distanceMeters - second.distanceMeters;
    }

    return compareHomeDriveThreeRoadPriority(first.road, second.road);
  });

  return uniqueThroughRoads;
}
