// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficDirection.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import {
  getHomeDriveTrafficDirectionVector,
  isHomeDriveTrafficRoadBidirectional,
  normalizeHomeDriveTrafficDirectionSign,
  type HomeDriveTrafficDirectionSign,
} from "./homeDrive.trafficLanes";

export type HomeDriveTrafficRoadEndpointSide = "from" | "to";

export type HomeDriveTrafficRoadProgressState = Readonly<{
  progress: number;
  directionSign: HomeDriveTrafficDirectionSign;
  reachedEnd: boolean;
  reachedSide: HomeDriveTrafficRoadEndpointSide | null;
}>;

export type HomeDriveTrafficNextRoadDirection = Readonly<{
  directionSign: HomeDriveTrafficDirectionSign;
  entrySide: HomeDriveTrafficRoadEndpointSide;
  exitSide: HomeDriveTrafficRoadEndpointSide;
  startsAtProgress: number;
}>;

const ROAD_ENDPOINT_SNAP_EPSILON_METERS = 1.25;
const ROAD_START_PROGRESS_EPSILON = 0.002;
const ROAD_END_PROGRESS_EPSILON = 0.998;
const ROAD_ENTRY_PROGRESS_MARGIN = 0.012;
const U_TURN_DOT_THRESHOLD = -0.82;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDistance(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function getDot(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return first.x * second.x + first.z * second.z;
}

function normalizeVector(vector: Readonly<{ x: number; z: number }>): Readonly<{
  x: number;
  z: number;
}> {
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

export function getHomeDriveTrafficRoadEndpointPosition(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveTrafficRoadEndpointSide,
): HomeDriveWorldPosition {
  return side === "from" ? road.from : road.to;
}

export function getHomeDriveTrafficDirectionSignFromEntrySide(
  road: HomeDriveGeneratedRoadSegment,
  entrySide: HomeDriveTrafficRoadEndpointSide,
): HomeDriveTrafficDirectionSign {
  if (!isHomeDriveTrafficRoadBidirectional(road)) {
    return 1;
  }

  return entrySide === "from" ? 1 : -1;
}

export function getHomeDriveTrafficEntrySideForDirection(
  directionSign: HomeDriveTrafficDirectionSign,
): HomeDriveTrafficRoadEndpointSide {
  return normalizeHomeDriveTrafficDirectionSign(directionSign) === 1
    ? "from"
    : "to";
}

export function getHomeDriveTrafficExitSideForDirection(
  directionSign: HomeDriveTrafficDirectionSign,
): HomeDriveTrafficRoadEndpointSide {
  return normalizeHomeDriveTrafficDirectionSign(directionSign) === 1
    ? "to"
    : "from";
}

export function getHomeDriveTrafficStartProgressForDirection(
  directionSign: HomeDriveTrafficDirectionSign,
): number {
  return normalizeHomeDriveTrafficDirectionSign(directionSign) === 1
    ? ROAD_ENTRY_PROGRESS_MARGIN
    : 1 - ROAD_ENTRY_PROGRESS_MARGIN;
}

export function getHomeDriveTrafficExitProgressForDirection(
  directionSign: HomeDriveTrafficDirectionSign,
): number {
  return normalizeHomeDriveTrafficDirectionSign(directionSign) === 1 ? 1 : 0;
}

export function getHomeDriveTrafficNearestRoadEndpointSide(
  road: HomeDriveGeneratedRoadSegment,
  point: HomeDriveWorldPosition,
): HomeDriveTrafficRoadEndpointSide {
  const distanceToFrom = getDistance(point, road.from);
  const distanceToTo = getDistance(point, road.to);

  return distanceToFrom <= distanceToTo ? "from" : "to";
}

export function isHomeDriveTrafficPointNearRoadEndpoint(
  road: HomeDriveGeneratedRoadSegment,
  point: HomeDriveWorldPosition,
  side: HomeDriveTrafficRoadEndpointSide,
  toleranceMeters = ROAD_ENDPOINT_SNAP_EPSILON_METERS,
): boolean {
  return getDistance(point, getHomeDriveTrafficRoadEndpointPosition(road, side)) <=
    toleranceMeters;
}

export function resolveHomeDriveTrafficNextRoadDirection(
  nextRoad: HomeDriveGeneratedRoadSegment,
  connectionPoint: HomeDriveWorldPosition,
): HomeDriveTrafficNextRoadDirection {
  const entrySide = getHomeDriveTrafficNearestRoadEndpointSide(
    nextRoad,
    connectionPoint,
  );

  const directionSign = getHomeDriveTrafficDirectionSignFromEntrySide(
    nextRoad,
    entrySide,
  );

  return {
    directionSign,
    entrySide,
    exitSide: getHomeDriveTrafficExitSideForDirection(directionSign),
    startsAtProgress: getHomeDriveTrafficStartProgressForDirection(directionSign),
  };
}

export function advanceHomeDriveTrafficRoadProgress(
  road: HomeDriveGeneratedRoadSegment,
  progress: number,
  directionSign: HomeDriveTrafficDirectionSign,
  distanceMeters: number,
): HomeDriveTrafficRoadProgressState {
  const roadLength = Math.max(0.001, road.length);
  const normalizedDirectionSign =
    normalizeHomeDriveTrafficDirectionSign(directionSign);

  const nextProgress = clamp(
    progress + (distanceMeters / roadLength) * normalizedDirectionSign,
    0,
    1,
  );

  const reachedEnd =
    normalizedDirectionSign === 1
      ? nextProgress >= ROAD_END_PROGRESS_EPSILON
      : nextProgress <= ROAD_START_PROGRESS_EPSILON;

  return {
    progress: nextProgress,
    directionSign: normalizedDirectionSign,
    reachedEnd,
    reachedSide: reachedEnd
      ? getHomeDriveTrafficExitSideForDirection(normalizedDirectionSign)
      : null,
  };
}

export function getHomeDriveTrafficRoadProgressAfterEndpointTransition(
  directionSign: HomeDriveTrafficDirectionSign,
): number {
  return getHomeDriveTrafficStartProgressForDirection(directionSign);
}

export function getHomeDriveTrafficConnectionPointForExit(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): HomeDriveWorldPosition {
  return getHomeDriveTrafficRoadEndpointPosition(
    road,
    getHomeDriveTrafficExitSideForDirection(directionSign),
  );
}

export function isHomeDriveTrafficDirectionUTurn(
  currentRoad: HomeDriveGeneratedRoadSegment,
  currentDirectionSign: HomeDriveTrafficDirectionSign,
  nextRoad: HomeDriveGeneratedRoadSegment,
  nextDirectionSign: HomeDriveTrafficDirectionSign,
): boolean {
  const currentDirection = normalizeVector(
    getHomeDriveTrafficDirectionVector(currentRoad, currentDirectionSign),
  );

  const nextDirection = normalizeVector(
    getHomeDriveTrafficDirectionVector(nextRoad, nextDirectionSign),
  );

  return getDot(currentDirection, nextDirection) <= U_TURN_DOT_THRESHOLD;
}

export function canHomeDriveTrafficUseRoadDirection(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): boolean {
  const normalizedDirectionSign =
    normalizeHomeDriveTrafficDirectionSign(directionSign);

  if (normalizedDirectionSign === 1) {
    return true;
  }

  return isHomeDriveTrafficRoadBidirectional(road);
}

export function resolveHomeDriveTrafficDirectionForRoadAtPoint(
  road: HomeDriveGeneratedRoadSegment,
  point: HomeDriveWorldPosition,
): HomeDriveTrafficDirectionSign {
  const entrySide = getHomeDriveTrafficNearestRoadEndpointSide(road, point);

  return getHomeDriveTrafficDirectionSignFromEntrySide(road, entrySide);
}

export function resolveHomeDriveTrafficSafeDirectionSign(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): HomeDriveTrafficDirectionSign {
  const normalizedDirectionSign =
    normalizeHomeDriveTrafficDirectionSign(directionSign);

  if (canHomeDriveTrafficUseRoadDirection(road, normalizedDirectionSign)) {
    return normalizedDirectionSign;
  }

  return 1;
}

export function getHomeDriveTrafficOppositeDirectionSign(
  directionSign: HomeDriveTrafficDirectionSign,
): HomeDriveTrafficDirectionSign {
  return normalizeHomeDriveTrafficDirectionSign(directionSign) === 1 ? -1 : 1;
}
