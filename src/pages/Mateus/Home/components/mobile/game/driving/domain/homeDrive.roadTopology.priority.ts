// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.priority.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadVector,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import type {
  HomeDriveRoadPriority,
  HomeDriveRoadEndpointSide,
  HomeDriveRoadEndpointRef,
} from "./homeDrive.roadTopology.types";

const POINT_KEY_PRECISION = 100;
export const ENDPOINT_TO_SEGMENT_SNAP_DISTANCE_METERS = 2.6;
export const THROUGH_ROAD_MIN_T = 0.045;
export const THROUGH_ROAD_MAX_T = 0.955;
export const THROUGH_ENTRY_T_PADDING = 0.018;
export const CONTINUATION_ABS_DOT_THRESHOLD = 0.965;

export function clamp(value: number, min: number, max: number): number {
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

export function negateVector(vector: HomeDriveRoadVector): HomeDriveRoadVector {
  return {
    x: -vector.x,
    z: -vector.z,
  };
}

export function multiplyVector(
  vector: HomeDriveRoadVector,
  scalar: number,
): HomeDriveRoadVector {
  return {
    x: vector.x * scalar,
    z: vector.z * scalar,
  };
}

export function dotDirections(
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

export function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
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
