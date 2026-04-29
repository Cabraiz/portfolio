// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadMouths.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import {
  getHomeDriveThreeRoadMouthPolicy,
  shouldCreateHomeDriveThreeRoadMouthForEndpoint,
} from "./homeDriveThree.roadRenderPolicy";
import type {
  HomeDriveThreeRoadEndpointRef,
  HomeDriveThreeRoadJunction,
  HomeDriveThreeRoadThroughRef,
  HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology";
import type {
  HomeDriveThreeRoadBand,
  HomeDriveThreeVector3Tuple,
} from "./homeDriveThree.types";

type HomeDriveRoadMouthPoint = Readonly<{
  x: number;
  z: number;
}>;

type HomeDriveRoadVector = Readonly<{
  x: number;
  z: number;
}>;

type HomeDriveRoadMouthAnchor = Readonly<{
  nearCenter: HomeDriveWorldPosition;
  throughRoad: HomeDriveThreeRoadThroughRef | null;
}>;

const MIN_ROAD_MOUTH_POINT_DISTANCE_METERS = 1.2;

/*
  A boca precisa invadir um pouco a through-road para evitar fresta verde,
  mas não pode nascer no eixo da avenida. Ela deve começar na borda visual.
*/
const THROUGH_ROAD_EDGE_OVERLAP_METERS = 0.42;

/*
  A boca também precisa passar levemente para dentro do corpo da rua lateral.
  Isso evita gap entre a roadMouth e o asphaltBand normal da rua.
*/
const SIDE_ROAD_BODY_OVERLAP_METERS = 1.8;

const MAX_EFFECTIVE_ROAD_MOUTH_LENGTH_METERS = 15.5;

const NEAR_WIDTH_EXTRA_METERS = 0.46;
const FAR_WIDTH_EXTRA_METERS = 0.22;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPointDistance(
  first: HomeDriveRoadMouthPoint,
  second: HomeDriveRoadMouthPoint,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function getDot(first: HomeDriveRoadVector, second: HomeDriveRoadVector): number {
  return first.x * second.x + first.z * second.z;
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

function getVectorBetweenPoints(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveRoadVector {
  return {
    x: to.x - from.x,
    z: to.z - from.z,
  };
}

function getDistanceAlongDirection(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
  direction: HomeDriveRoadVector,
): number {
  return getDot(getVectorBetweenPoints(from, to), direction);
}

function getRoadHalfWidth(road: HomeDriveGeneratedRoadSegment): number {
  return Math.max(1.5, road.width / 2);
}

function isSameRoadIdentity(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): boolean {
  return first.id === second.id || first.roadId === second.roadId;
}

function getSafeRoadNormal(
  road: HomeDriveGeneratedRoadSegment,
): HomeDriveRoadVector {
  const normal = normalizeVector(road.normal);

  if (Math.hypot(normal.x, normal.z) <= 0.000001) {
    return {
      x: -road.direction.z,
      z: road.direction.x,
    };
  }

  return normal;
}

function movePoint(
  point: HomeDriveWorldPosition,
  direction: HomeDriveRoadVector,
  distanceMeters: number,
): HomeDriveWorldPosition {
  return {
    x: point.x + direction.x * distanceMeters,
    z: point.z + direction.z * distanceMeters,
  };
}

function offsetPoint(
  point: HomeDriveWorldPosition,
  normal: HomeDriveRoadVector,
  offsetMeters: number,
  y: number,
): HomeDriveThreeVector3Tuple {
  return [
    point.x + normal.x * offsetMeters,
    y,
    point.z + normal.z * offsetMeters,
  ];
}

function getEndpointDirectionAwayFromJunction(
  endpoint: HomeDriveThreeRoadEndpointRef,
): HomeDriveRoadVector {
  return normalizeVector(endpoint.directionAwayFromJunction);
}

function getRoadMouthId(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): string {
  return `road-mouth::${junction.key}::${endpoint.road.id}::${endpoint.side}`;
}

function getPreferredThroughRoadForEndpoint(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadThroughRef | null {
  const throughRoads = junction.throughRoads.filter(
    (throughRoad) => !isSameRoadIdentity(throughRoad.road, endpoint.road),
  );

  if (throughRoads.length === 0) {
    return null;
  }

  const dominantRoad = junction.dominantRoad;

  if (dominantRoad) {
    const dominantThroughRoad = throughRoads.find((throughRoad) =>
      isSameRoadIdentity(throughRoad.road, dominantRoad),
    );

    if (dominantThroughRoad) {
      return dominantThroughRoad;
    }
  }

  return throughRoads[0] ?? null;
}

function isEndpointPartOfThroughRoad(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return junction.throughRoads.some((throughRoad) =>
    isSameRoadIdentity(throughRoad.road, endpoint.road),
  );
}

function getEdgeDirectionSign(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveThreeRoadThroughRef,
  directionAwayFromJunction: HomeDriveRoadVector,
): 1 | -1 {
  const projectedCenter = throughRoad.nearestPoint;
  const endpointVector = getVectorBetweenPoints(projectedCenter, endpoint.position);
  const signedEndpointDistance = getDot(endpointVector, directionAwayFromJunction);

  return signedEndpointDistance >= 0 ? 1 : -1;
}

function getThroughRoadEdgeCenter(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveThreeRoadThroughRef,
  directionAwayFromJunction: HomeDriveRoadVector,
): HomeDriveWorldPosition {
  const projectedCenter = throughRoad.nearestPoint;
  const edgeDirectionSign = getEdgeDirectionSign(
    endpoint,
    throughRoad,
    directionAwayFromJunction,
  );

  const edgeDirection =
    edgeDirectionSign === 1
      ? directionAwayFromJunction
      : {
          x: -directionAwayFromJunction.x,
          z: -directionAwayFromJunction.z,
        };

  const edgeDistance = Math.max(
    0,
    getRoadHalfWidth(throughRoad.road) - THROUGH_ROAD_EDGE_OVERLAP_METERS,
  );

  return movePoint(projectedCenter, edgeDirection, edgeDistance);
}

function getRoadMouthAnchor(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
  directionAwayFromJunction: HomeDriveRoadVector,
): HomeDriveRoadMouthAnchor {
  const throughRoad = getPreferredThroughRoadForEndpoint(endpoint, junction);

  if (!throughRoad || junction.type !== "t-junction") {
    return {
      nearCenter: junction.position,
      throughRoad: null,
    };
  }

  return {
    nearCenter: getThroughRoadEdgeCenter(
      endpoint,
      throughRoad,
      directionAwayFromJunction,
    ),
    throughRoad,
  };
}

function getEffectiveRoadMouthLengthMeters(
  endpoint: HomeDriveThreeRoadEndpointRef,
  nearCenter: HomeDriveWorldPosition,
  directionAwayFromJunction: HomeDriveRoadVector,
  policyLengthMeters: number,
): number {
  const distanceFromNearToEndpoint = getDistanceAlongDirection(
    nearCenter,
    endpoint.position,
    directionAwayFromJunction,
  );

  const requiredReachMeters =
    Math.max(0, distanceFromNearToEndpoint) + SIDE_ROAD_BODY_OVERLAP_METERS;

  return clamp(
    Math.max(policyLengthMeters, requiredReachMeters),
    MIN_ROAD_MOUTH_POINT_DISTANCE_METERS + 0.2,
    MAX_EFFECTIVE_ROAD_MOUTH_LENGTH_METERS,
  );
}

function getNearHalfWidthMeters(
  endpoint: HomeDriveThreeRoadEndpointRef,
  policyNearHalfWidthMeters: number,
): number {
  const roadHalfWidth = getRoadHalfWidth(endpoint.road);

  return clamp(
    Math.max(policyNearHalfWidthMeters, roadHalfWidth * 0.94),
    1.6,
    roadHalfWidth + NEAR_WIDTH_EXTRA_METERS,
  );
}

function getFarHalfWidthMeters(
  endpoint: HomeDriveThreeRoadEndpointRef,
  nearHalfWidthMeters: number,
  policyFarHalfWidthMeters: number,
): number {
  const roadHalfWidth = getRoadHalfWidth(endpoint.road);

  return clamp(
    Math.max(policyFarHalfWidthMeters, roadHalfWidth * 0.76),
    1.35,
    Math.min(nearHalfWidthMeters, roadHalfWidth + FAR_WIDTH_EXTRA_METERS),
  );
}

function createRoadMouthBand(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadBand | null {
  if (!shouldCreateHomeDriveThreeRoadMouthForEndpoint(endpoint, junction)) {
    return null;
  }

  if (junction.type === "t-junction" && isEndpointPartOfThroughRoad(endpoint, junction)) {
    return null;
  }

  const policy = getHomeDriveThreeRoadMouthPolicy(endpoint, junction);

  if (!policy.enabled || policy.lengthMeters <= 0) {
    return null;
  }

  const directionAwayFromJunction =
    getEndpointDirectionAwayFromJunction(endpoint);

  const anchor = getRoadMouthAnchor(endpoint, junction, directionAwayFromJunction);
  const nearCenter = anchor.nearCenter;

  const effectiveLengthMeters = getEffectiveRoadMouthLengthMeters(
    endpoint,
    nearCenter,
    directionAwayFromJunction,
    policy.lengthMeters,
  );

  const farCenter = movePoint(
    nearCenter,
    directionAwayFromJunction,
    effectiveLengthMeters,
  );

  if (
    getPointDistance(nearCenter, farCenter) <=
    MIN_ROAD_MOUTH_POINT_DISTANCE_METERS
  ) {
    return null;
  }

  const normal = getSafeRoadNormal(endpoint.road);
  const nearHalfWidthMeters = getNearHalfWidthMeters(
    endpoint,
    policy.nearHalfWidthMeters,
  );

  const farHalfWidthMeters = getFarHalfWidthMeters(
    endpoint,
    nearHalfWidthMeters,
    policy.farHalfWidthMeters,
  );

  return {
    id: getRoadMouthId(endpoint, junction),
    kind: "asphalt",
    roadId: endpoint.road.roadId,
    segmentIndex: endpoint.road.segmentIndex,
    material: HOME_DRIVE_THREE_MATERIALS.asphalt as HomeDriveThreeRoadBand["material"],
    renderOrder: policy.renderOrder,
    points: [
      offsetPoint(nearCenter, normal, -nearHalfWidthMeters, policy.y),
      offsetPoint(nearCenter, normal, nearHalfWidthMeters, policy.y),
      offsetPoint(farCenter, normal, farHalfWidthMeters, policy.y),
      offsetPoint(farCenter, normal, -farHalfWidthMeters, policy.y),
    ],
  };
}

function sortRoadMouthBands(
  first: HomeDriveThreeRoadBand,
  second: HomeDriveThreeRoadBand,
): number {
  if (first.roadId !== second.roadId) {
    return first.roadId.localeCompare(second.roadId);
  }

  if (first.segmentIndex !== second.segmentIndex) {
    return first.segmentIndex - second.segmentIndex;
  }

  return first.id.localeCompare(second.id);
}

export function createHomeDriveThreeRoadMouthBandsForJunction(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  if (junction.type === "terminal" || junction.type === "continuation") {
    return [];
  }

  const bands: HomeDriveThreeRoadBand[] = [];

  for (const endpoint of junction.endpoints) {
    const band = createRoadMouthBand(endpoint, junction);

    if (band) {
      bands.push(band);
    }
  }

  bands.sort(sortRoadMouthBands);

  return bands;
}

export function createHomeDriveThreeRoadMouthBands(
  topology: HomeDriveThreeRoadTopology,
): readonly HomeDriveThreeRoadBand[] {
  const bands: HomeDriveThreeRoadBand[] = [];

  for (const junction of topology.junctionsByKey.values()) {
    bands.push(...createHomeDriveThreeRoadMouthBandsForJunction(junction));
  }

  bands.sort(sortRoadMouthBands);

  return bands;
}
