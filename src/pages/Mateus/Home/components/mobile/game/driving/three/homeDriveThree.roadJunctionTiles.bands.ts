// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctionTiles.bands.ts

import type {
	HomeDriveGeneratedRoadSegment,
	HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import type {
	HomeDriveThreeRoadJunctionTileKind,
} from "./homeDriveThree.roadJunctionTilePolicy";
import type {
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";
import type {
	HomeDriveThreeRoadBand,
	HomeDriveThreeVector3Tuple,
} from "./homeDriveThree.types";

type HomeDriveRoadVector = Readonly<{
  x: number;
  z: number;
}>;

type HomeDriveRoadTileAxis = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  direction: HomeDriveRoadVector;
  normal: HomeDriveRoadVector;
}>;

const JUNCTION_TILE_Y = 0.152;
const JUNCTION_TILE_RENDER_ORDER = 6.35;

const TILE_WIDTH_OVERLAP_METERS = 1.35;
const TILE_SIDE_WIDTH_OVERLAP_METERS = 1.05;

const MIN_FULL_ARM_HALF_LENGTH_METERS = 11;
const MAX_FULL_ARM_HALF_LENGTH_METERS = 34;

const MIN_SIDE_ARM_LENGTH_METERS = 12;
const MAX_SIDE_ARM_LENGTH_METERS = 36;

const SIDE_ARM_CENTER_BACKFILL_METERS = 2.2;

export const AXIS_GROUP_DOT_THRESHOLD = 0.92;
export const MAX_CROSS_TILE_AXES = 2;
export const MAX_COMPLEX_TILE_AXES = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeVector(vector: HomeDriveRoadVector): HomeDriveRoadVector {
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

function getDot(first: HomeDriveRoadVector, second: HomeDriveRoadVector): number {
  return first.x * second.x + first.z * second.z;
}

export function getAbsDot(first: HomeDriveRoadVector, second: HomeDriveRoadVector): number {
  return Math.abs(getDot(normalizeVector(first), normalizeVector(second)));
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

function getRoadHalfWidth(road: HomeDriveGeneratedRoadSegment): number {
  return Math.max(1.5, road.width / 2);
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
): HomeDriveThreeVector3Tuple {
  return [
    point.x + normal.x * offsetMeters,
    JUNCTION_TILE_Y,
    point.z + normal.z * offsetMeters,
  ];
}

function getTileRoadBandMaterial(): HomeDriveThreeRoadBand["material"] {
  return HOME_DRIVE_THREE_MATERIALS.asphalt as HomeDriveThreeRoadBand["material"];
}

function getRoadTileAxis(road: HomeDriveGeneratedRoadSegment): HomeDriveRoadTileAxis {
  return {
    road,
    direction: normalizeVector(road.direction),
    normal: getSafeRoadNormal(road),
  };
}

function getFullArmHalfLengthMeters(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
  kind: HomeDriveThreeRoadJunctionTileKind,
): number {
  const baseByJunction = junction.maxRoadWidth * 0.64 + road.width * 0.5 + 6;

  const kindBoost =
    kind === "cross-junction"
      ? 3.2
      : kind === "complex-junction"
        ? 4.4
        : 1.8;

  return clamp(
    baseByJunction + kindBoost,
    MIN_FULL_ARM_HALF_LENGTH_METERS,
    MAX_FULL_ARM_HALF_LENGTH_METERS,
  );
}

function getSideArmLengthMeters(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): number {
  return clamp(
    junction.maxRoadWidth * 0.72 + road.width * 0.86 + 7,
    MIN_SIDE_ARM_LENGTH_METERS,
    MAX_SIDE_ARM_LENGTH_METERS,
  );
}

function getFullArmHalfWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return getRoadHalfWidth(road) + TILE_WIDTH_OVERLAP_METERS;
}

function getSideArmHalfWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return getRoadHalfWidth(road) + TILE_SIDE_WIDTH_OVERLAP_METERS;
}

function createTileBandFromAxis(
  id: string,
  road: HomeDriveGeneratedRoadSegment,
  start: HomeDriveWorldPosition,
  end: HomeDriveWorldPosition,
  normal: HomeDriveRoadVector,
  halfWidthMeters: number,
): HomeDriveThreeRoadBand {
  return {
    id,
    kind: "asphalt",
    roadId: road.roadId,
    segmentIndex: road.segmentIndex,
    material: getTileRoadBandMaterial(),
    renderOrder: JUNCTION_TILE_RENDER_ORDER,
    points: [
      offsetPoint(start, normal, -halfWidthMeters),
      offsetPoint(start, normal, halfWidthMeters),
      offsetPoint(end, normal, halfWidthMeters),
      offsetPoint(end, normal, -halfWidthMeters),
    ],
  };
}

export function createFullArmTileBand(
  junction: HomeDriveThreeRoadJunction,
  road: HomeDriveGeneratedRoadSegment,
  index: number,
  kind: HomeDriveThreeRoadJunctionTileKind,
): HomeDriveThreeRoadBand {
  const axis = getRoadTileAxis(road);
  const halfLengthMeters = getFullArmHalfLengthMeters(road, junction, kind);
  const halfWidthMeters = getFullArmHalfWidthMeters(road);

  const start = movePoint(junction.position, axis.direction, -halfLengthMeters);
  const end = movePoint(junction.position, axis.direction, halfLengthMeters);

  return createTileBandFromAxis(
    `road-junction-tile::${kind}::full::${junction.key}::${road.id}::${index}`,
    road,
    start,
    end,
    axis.normal,
    halfWidthMeters,
  );
}

export function getEndpointDirectionAwayFromJunction(
  endpoint: HomeDriveThreeRoadEndpointRef,
): HomeDriveRoadVector {
  return normalizeVector(endpoint.directionAwayFromJunction);
}

export function createOneWayArmTileBand(
  junction: HomeDriveThreeRoadJunction,
  endpoint: HomeDriveThreeRoadEndpointRef,
  index: number,
): HomeDriveThreeRoadBand {
  const directionAway = getEndpointDirectionAwayFromJunction(endpoint);
  const normal = getSafeRoadNormal(endpoint.road);
  const start = movePoint(
    junction.position,
    directionAway,
    -SIDE_ARM_CENTER_BACKFILL_METERS,
  );
  const end = movePoint(
    junction.position,
    directionAway,
    getSideArmLengthMeters(endpoint.road, junction),
  );

  return createTileBandFromAxis(
    `road-junction-tile::t-junction::side::${junction.key}::${endpoint.road.id}::${endpoint.side}::${index}`,
    endpoint.road,
    start,
    end,
    normal,
    getSideArmHalfWidthMeters(endpoint.road),
  );
}
