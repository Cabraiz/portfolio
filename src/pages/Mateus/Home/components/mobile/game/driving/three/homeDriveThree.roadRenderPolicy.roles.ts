// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadRenderPolicy.roles.ts

import type {
	HomeDriveGeneratedRoadSegment,
} from "../domain/homeDrive.worldMap.types";
import {
	getHomeDriveThreeRoadNormalizedDot,
	getHomeDriveThreeRoadPriority,
	isHomeDriveThreeDominantRoadAtJunction,
	isHomeDriveThreeSubordinateRoadAtJunction,
	type HomeDriveThreeRoadEndpointSide,
	type HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";
import {
	type HomeDriveThreeRoadRenderRole,
	type HomeDriveThreeRoadMouthReason,
	MAX_EQUIVALENT_SCORE_DELTA,
	DOMINANT_EDGE_ALIGNMENT_DOT,
	DOMINANT_CORRIDOR_ALIGNMENT_DOT,
	DOMINANT_CORRIDOR_PRIORITY_DELTA,
	DOMINANT_CORRIDOR_MIN_WIDTH_RATIO,
} from "./homeDriveThree.roadRenderPolicy.config";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasRoadTag(
  road: HomeDriveGeneratedRoadSegment,
  tag: string,
): boolean {
  return Array.isArray(road.tags) && road.tags.includes(tag);
}

function isAttachmentStyleRoad(road: HomeDriveGeneratedRoadSegment): boolean {
  if (hasRoadTag(road, "safe-endcap") || hasRoadTag(road, "approach")) {
    return false;
  }

  return (
    hasRoadTag(road, "local-no-cross") ||
    hasRoadTag(road, "short") ||
    road.kind === "service"
  );
}

function hasAttachmentStyleRoadAtJunction(
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return junction.roads.some(isAttachmentStyleRoad);
}

export function getRoadMouthLengthByKind(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 12.2;

    case "boulevard":
      return 11.8;

    case "avenue":
      return 11.2;

    case "commercial":
      return 10.6;

    case "ring":
      return 9.8;

    case "street":
      return 9.1;

    case "service":
      return 7;

    default:
      if (road.roadTone === "urban-core") {
        return 9.6;
      }

      if (road.roadTone === "boulevard") {
        return 11.2;
      }

      return 8.8;
  }
}

export function getRoadMouthRoleLengthMultiplier(
  role: HomeDriveThreeRoadRenderRole,
): number {
  switch (role) {
    case "dominant-road-edge":
      return 0.8;

    case "equivalent-junction":
      return 0.72;

    case "minor-junction":
      return 0.62;

    case "dominant-road-continuation":
    case "terminal":
    default:
      return 0;
  }
}

export function getRoadMouthRoleWidthMultiplier(
  role: HomeDriveThreeRoadRenderRole,
): number {
  switch (role) {
    case "dominant-road-edge":
      return 0.84;

    case "equivalent-junction":
      return 0.76;

    case "minor-junction":
      return 0.66;

    case "dominant-road-continuation":
    case "terminal":
    default:
      return 0;
  }
}

function isRoadDirectionCloseToDominantRoad(
  road: HomeDriveGeneratedRoadSegment,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  const dot = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(road.direction, dominantRoad.direction),
  );

  return dot >= DOMINANT_EDGE_ALIGNMENT_DOT;
}

function getEquivalentScoreDelta(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): number {
  const dominantPriority = junction.dominantPriority;

  if (!dominantPriority) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(
    getHomeDriveThreeRoadPriority(road).score - dominantPriority.score,
  );
}

function isSameLogicalRoad(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): boolean {
  return first.id === second.id || first.roadId === second.roadId;
}

function isRoadAlignedWithDominantCorridor(
  road: HomeDriveGeneratedRoadSegment,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  if (isSameLogicalRoad(road, dominantRoad)) {
    return true;
  }

  const absDot = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(road.direction, dominantRoad.direction),
  );

  if (absDot < DOMINANT_CORRIDOR_ALIGNMENT_DOT) {
    return false;
  }

  const roadPriority = getHomeDriveThreeRoadPriority(road);
  const dominantPriority = getHomeDriveThreeRoadPriority(dominantRoad);

  if (
    Math.abs(roadPriority.score - dominantPriority.score) >
    DOMINANT_CORRIDOR_PRIORITY_DELTA
  ) {
    return false;
  }

  const minWidth = Math.min(road.width, dominantRoad.width);
  const maxWidth = Math.max(road.width, dominantRoad.width);

  return minWidth / Math.max(0.001, maxWidth) >= DOMINANT_CORRIDOR_MIN_WIDTH_RATIO;
}

export function shouldKeepRoadContinuousAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction | null,
): boolean {
  if (!junction || !junction.dominantRoad) {
    return false;
  }

  if (!isRoadAlignedWithDominantCorridor(road, junction.dominantRoad)) {
    return false;
  }

  if (junction.type === "t-junction") {
    return true;
  }

  return hasAttachmentStyleRoadAtJunction(junction);
}

export function getRoadRenderRoleAtJunction(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeRoadRenderRole {
  if (!junction) {
    return "terminal";
  }

  if (shouldKeepRoadContinuousAtJunction(road, junction)) {
    return "dominant-road-continuation";
  }

  if (isHomeDriveThreeDominantRoadAtJunction(road, junction)) {
    return "dominant-road-continuation";
  }

  if (isHomeDriveThreeSubordinateRoadAtJunction(road, junction)) {
    return "dominant-road-edge";
  }

  if (
    junction.dominantRoad &&
    isRoadDirectionCloseToDominantRoad(road, junction.dominantRoad) &&
    getEquivalentScoreDelta(road, junction) <= MAX_EQUIVALENT_SCORE_DELTA
  ) {
    return "equivalent-junction";
  }

  if (getEquivalentScoreDelta(road, junction) <= MAX_EQUIVALENT_SCORE_DELTA) {
    return "equivalent-junction";
  }

  return "minor-junction";
}

export function getRoadMouthReasonForRole(
  role: HomeDriveThreeRoadRenderRole,
): HomeDriveThreeRoadMouthReason {
  switch (role) {
    case "dominant-road-edge":
      return "subordinate-road-mouth";

    case "equivalent-junction":
      return "equivalent-road-mouth";

    case "minor-junction":
      return "minor-road-mouth";

    case "dominant-road-continuation":
      return "dominant-road";

    case "terminal":
    default:
      return "disabled";
  }
}

export function getEndpointSideWidthBias(
  _side: HomeDriveThreeRoadEndpointSide,
): number {
  return 1;
}
