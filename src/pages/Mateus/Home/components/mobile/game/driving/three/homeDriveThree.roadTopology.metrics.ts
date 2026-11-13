// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.metrics.ts

import type {
	HomeDriveGeneratedRoadSegment,
	HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import type {
	HomeDriveThreeRoadEndpointSide,
	HomeDriveThreeRoadPriority,
} from "./homeDriveThree.roadTopology.types";

const POINT_KEY_PRECISION = 100;

export const ENDPOINT_TO_SEGMENT_BASE_SNAP_DISTANCE_METERS = 3;
export const ENDPOINT_TO_SEGMENT_EXTRA_MARGIN_METERS = 3.2;
export const ENDPOINT_TO_SEGMENT_MAX_SNAP_DISTANCE_METERS = 20;

export const ENDPOINT_TO_SEGMENT_PARALLEL_REJECTION_ABS_DOT = 0.992;
export const CONTINUATION_ABS_DOT_THRESHOLD = 0.965;

export const DOMINANT_CONTINUATION_ABS_DOT_THRESHOLD = 0.94;
export const DOMINANT_CONTINUATION_PRIORITY_DELTA = 260;
export const DOMINANT_CONTINUATION_MIN_WIDTH_RATIO = 0.68;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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

  if (tags.includes("safe-endcap")) {
    score -= 260;
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
