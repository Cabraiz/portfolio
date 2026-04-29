// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctionTilePolicy.ts

import type { HomeDriveGeneratedRoadSegment } from "../domain/homeDrive.worldMap.types";
import {
  getHomeDriveThreeRoadNormalizedDot,
  type HomeDriveThreeRoadEndpointRef,
  type HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";

export type HomeDriveThreeRoadJunctionTileKind =
  | "none"
  | "t-junction"
  | "cross-junction"
  | "complex-junction";

export type HomeDriveThreeRoadJunctionTileRoadRole =
  | "through-road"
  | "side-road"
  | "suppressed-road";

const DOMINANT_CORRIDOR_ALIGNMENT_DOT = 0.94;
const DOMINANT_CORRIDOR_PRIORITY_DELTA = 320;
const DOMINANT_CORRIDOR_MIN_WIDTH_RATIO = 0.66;

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

export function hasHomeDriveThreeRoadJunctionTileTag(
  road: HomeDriveGeneratedRoadSegment,
  tag: string,
): boolean {
  return getRoadTags(road).includes(tag);
}

export function isHomeDriveThreeRoadJunctionTileSuppressedRoad(
  road: HomeDriveGeneratedRoadSegment,
): boolean {
  /*
    Essas ruas normalmente são artifícios de acesso/portão/anel.
    Não devem criar um tile grande.
  */
  return (
    hasHomeDriveThreeRoadJunctionTileTag(road, "safe-endcap") ||
    hasHomeDriveThreeRoadJunctionTileTag(road, "approach")
  );
}

export function isHomeDriveThreeRoadJunctionTileAttachmentRoad(
  road: HomeDriveGeneratedRoadSegment,
): boolean {
  /*
    Ponto importante:
    local-no-cross e short NÃO devem sumir sem cobrir o encontro.
    Eles devem virar side-road de tile, senão sobra verde.
  */
  if (isHomeDriveThreeRoadJunctionTileSuppressedRoad(road)) {
    return false;
  }

  return (
    hasHomeDriveThreeRoadJunctionTileTag(road, "local-no-cross") ||
    hasHomeDriveThreeRoadJunctionTileTag(road, "short") ||
    road.kind === "service"
  );
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
  let score = 0;

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "main")) {
    score += 220;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "fast")) {
    score += 160;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "wide")) {
    score += 120;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "connector")) {
    score += 80;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "local-no-cross")) {
    score -= 80;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "service")) {
    score -= 180;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "short")) {
    score -= 120;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "approach")) {
    score -= 140;
  }

  if (hasHomeDriveThreeRoadJunctionTileTag(road, "safe-endcap")) {
    score -= 260;
  }

  return score;
}

export function getHomeDriveThreeRoadJunctionTileRoadPriorityScore(
  road: HomeDriveGeneratedRoadSegment,
): number {
  return getRoadKindScore(road) + road.width * 18 + getRoadTagScore(road);
}

export function compareHomeDriveThreeRoadJunctionTileRoadPriority(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): number {
  const scoreDelta =
    getHomeDriveThreeRoadJunctionTileRoadPriorityScore(second) -
    getHomeDriveThreeRoadJunctionTileRoadPriorityScore(first);

  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  if (first.width !== second.width) {
    return second.width - first.width;
  }

  return first.id.localeCompare(second.id);
}

export function isSameHomeDriveThreeRoadJunctionTileRoad(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): boolean {
  return first.id === second.id || first.roadId === second.roadId;
}

export function getHomeDriveThreeRoadJunctionTileDominantRoad(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveGeneratedRoadSegment | null {
  if (junction.dominantRoad) {
    return junction.dominantRoad;
  }

  const roads = junction.roads
    .filter((road) => !isHomeDriveThreeRoadJunctionTileSuppressedRoad(road))
    .slice();

  roads.sort(compareHomeDriveThreeRoadJunctionTileRoadPriority);

  return roads[0] ?? null;
}

export function isRoadAlignedWithHomeDriveThreeRoadJunctionTileDominantRoad(
  road: HomeDriveGeneratedRoadSegment,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  if (isSameHomeDriveThreeRoadJunctionTileRoad(road, dominantRoad)) {
    return true;
  }

  if (isHomeDriveThreeRoadJunctionTileAttachmentRoad(road)) {
    return false;
  }

  const absDot = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(road.direction, dominantRoad.direction),
  );

  if (absDot < DOMINANT_CORRIDOR_ALIGNMENT_DOT) {
    return false;
  }

  const priorityDelta = Math.abs(
    getHomeDriveThreeRoadJunctionTileRoadPriorityScore(road) -
      getHomeDriveThreeRoadJunctionTileRoadPriorityScore(dominantRoad),
  );

  if (priorityDelta > DOMINANT_CORRIDOR_PRIORITY_DELTA) {
    return false;
  }

  const minWidth = Math.min(road.width, dominantRoad.width);
  const maxWidth = Math.max(road.width, dominantRoad.width);

  return minWidth / Math.max(0.001, maxWidth) >= DOMINANT_CORRIDOR_MIN_WIDTH_RATIO;
}

export function hasHomeDriveThreeRoadJunctionTileAttachmentRoad(
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return junction.roads.some(isHomeDriveThreeRoadJunctionTileAttachmentRoad);
}

export function getHomeDriveThreeRoadJunctionTileKind(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadJunctionTileKind {
  if (junction.type === "terminal" || junction.type === "continuation") {
    return "none";
  }

  if (junction.roads.length < 2) {
    return "none";
  }

  /*
    Quando existe local-no-cross/short/service no nó, mesmo que a topologia
    geométrica pareça "+", visualmente tratamos como encaixe controlado.
    Isso evita a rua principal ser "comida" e evita verde no encontro.
  */
  if (hasHomeDriveThreeRoadJunctionTileAttachmentRoad(junction)) {
    return "t-junction";
  }

  if (junction.type === "cross-junction") {
    return "cross-junction";
  }

  if (junction.type === "t-junction") {
    return "t-junction";
  }

  return "complex-junction";
}

export function shouldCreateHomeDriveThreeRoadJunctionTile(
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return getHomeDriveThreeRoadJunctionTileKind(junction) !== "none";
}

export function getHomeDriveThreeRoadJunctionTileRoadRole(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadJunctionTileRoadRole {
  if (isHomeDriveThreeRoadJunctionTileSuppressedRoad(road)) {
    return "suppressed-road";
  }

  const dominantRoad = getHomeDriveThreeRoadJunctionTileDominantRoad(junction);

  if (
    dominantRoad &&
    isRoadAlignedWithHomeDriveThreeRoadJunctionTileDominantRoad(
      road,
      dominantRoad,
    )
  ) {
    return "through-road";
  }

  return "side-road";
}

export function isHomeDriveThreeRoadJunctionTileThroughRoad(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return getHomeDriveThreeRoadJunctionTileRoadRole(road, junction) === "through-road";
}

export function isHomeDriveThreeRoadJunctionTileSideRoad(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  return getHomeDriveThreeRoadJunctionTileRoadRole(road, junction) === "side-road";
}

export function shouldUseOneWayHomeDriveThreeRoadJunctionTileArm(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  const kind = getHomeDriveThreeRoadJunctionTileKind(junction);

  if (kind === "none" || kind === "cross-junction") {
    return false;
  }

  return isHomeDriveThreeRoadJunctionTileSideRoad(endpoint.road, junction);
}
