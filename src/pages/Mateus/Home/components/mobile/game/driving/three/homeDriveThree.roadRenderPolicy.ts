// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadRenderPolicy.ts

import type { HomeDriveGeneratedRoadSegment } from "../domain/homeDrive.worldMap.types";
import type { HomeDriveThreeRoadBandKind } from "./homeDriveThree.types";
import {
  getHomeDriveThreeRoadNormalizedDot,
  getHomeDriveThreeRoadPriority,
  isHomeDriveThreeDominantRoadAtJunction,
  isHomeDriveThreeSubordinateRoadAtJunction,
  type HomeDriveThreeRoadEndpointRef,
  type HomeDriveThreeRoadEndpointSide,
  type HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";

export type HomeDriveThreeRoadRenderRole =
  | "terminal"
  | "dominant-road-continuation"
  | "dominant-road-edge"
  | "equivalent-junction"
  | "minor-junction";

export type HomeDriveThreeRoadMouthReason =
  | "disabled"
  | "continuation"
  | "dominant-road"
  | "subordinate-road-mouth"
  | "equivalent-road-mouth"
  | "minor-road-mouth"
  | "decorative-suppressed";

export type HomeDriveThreeRoadMouthPolicy = Readonly<{
  enabled: boolean;
  reason: HomeDriveThreeRoadMouthReason;
  lengthMeters: number;
  nearHalfWidthMeters: number;
  farHalfWidthMeters: number;
  y: number;
  renderOrder: number;
}>;

export type HomeDriveThreeEndpointVisualTrimPolicy = Readonly<{
  trimMeters: number;
  role: HomeDriveThreeRoadRenderRole;
}>;

const ROAD_MOUTH_Y = 0.125;
const ROAD_MOUTH_RENDER_ORDER = 4;

const MAX_EQUIVALENT_SCORE_DELTA = 180;
const DOMINANT_EDGE_ALIGNMENT_DOT = 0.9;

const DOMINANT_CORRIDOR_ALIGNMENT_DOT = 0.94;
const DOMINANT_CORRIDOR_PRIORITY_DELTA = 300;
const DOMINANT_CORRIDOR_MIN_WIDTH_RATIO = 0.66;

const MIN_ROAD_MOUTH_LENGTH_METERS = 5.4;
const MAX_ROAD_MOUTH_LENGTH_METERS = 12.2;
const MIN_ROAD_MOUTH_HALF_WIDTH_METERS = 2.1;
const MAX_ROAD_MOUTH_HALF_WIDTH_METERS = 6.8;

const TERMINAL_TRIM_BY_KIND: Readonly<Record<HomeDriveThreeRoadBandKind, number>> =
  {
    asphalt: 0,
    "sidewalk-left": 2.6,
    "sidewalk-right": 2.6,
    curb: 3.4,
    "lane-mark": 9.2,
  };

/*
  Com junction tiles, o asfalto não deve mais ser cortado.
  Quem resolve T/+ visualmente é o tile renderizado por cima.
*/
const ASPHALT_NO_TRIM_METERS = 0;

const DOMINANT_CONTINUATION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 9,
  "sidewalk-right": 9,
  curb: 8,
  "lane-mark": 14,
};

const EQUIVALENT_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 18,
  "sidewalk-right": 18,
  curb: 15,
  "lane-mark": 22,
};

const MINOR_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 11,
  "sidewalk-right": 11,
  curb: 9.5,
  "lane-mark": 15,
};

const SUBORDINATE_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 9,
  "sidewalk-right": 9,
  curb: 7.6,
  "lane-mark": 13.5,
};

function clamp(value: number, min: number, max: number): number {
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

function getRoadMouthLengthByKind(road: HomeDriveGeneratedRoadSegment): number {
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

function getRoadMouthRoleLengthMultiplier(
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

function getRoadMouthRoleWidthMultiplier(
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

function shouldKeepRoadContinuousAtJunction(
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

function getRoadRenderRoleAtJunction(
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

function getRoadMouthReasonForRole(
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

function getEndpointSideWidthBias(
  _side: HomeDriveThreeRoadEndpointSide,
): number {
  return 1;
}

export function shouldCreateHomeDriveThreeIntersectionPad(
  _junction: HomeDriveThreeRoadJunction,
): boolean {
  return false;
}

export function getHomeDriveThreeRoadRenderRole(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeRoadRenderRole {
  return getRoadRenderRoleAtJunction(road, junction);
}

/*
  RoadMouths ficam desativadas no novo modelo.
  O encontro visual passa a ser responsabilidade exclusiva dos junction tiles.
*/
export function shouldCreateHomeDriveThreeRoadMouthForEndpoint(
  _endpoint: HomeDriveThreeRoadEndpointRef,
  _junction: HomeDriveThreeRoadJunction,
): boolean {
  return false;
}

export function getHomeDriveThreeRoadMouthPolicy(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadMouthPolicy {
  if (junction.type === "terminal") {
    return {
      enabled: false,
      reason: "disabled",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  if (junction.type === "continuation") {
    return {
      enabled: false,
      reason: "continuation",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  if (shouldKeepRoadContinuousAtJunction(endpoint.road, junction)) {
    return {
      enabled: false,
      reason: "dominant-road",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  const role = getHomeDriveThreeRoadRenderRole(endpoint.road, junction);
  const reason = getRoadMouthReasonForRole(role);
  const widthBias = getEndpointSideWidthBias(endpoint.side);
  const roleLengthMultiplier = getRoadMouthRoleLengthMultiplier(role);
  const roleWidthMultiplier = getRoadMouthRoleWidthMultiplier(role);

  const baseLength = getRoadMouthLengthByKind(endpoint.road);
  const lengthMeters = clamp(
    baseLength * roleLengthMultiplier,
    MIN_ROAD_MOUTH_LENGTH_METERS,
    MAX_ROAD_MOUTH_LENGTH_METERS,
  );

  const roadHalfWidth = Math.max(1.5, endpoint.road.width / 2);
  const nearHalfWidthMeters = clamp(
    roadHalfWidth * roleWidthMultiplier * widthBias,
    MIN_ROAD_MOUTH_HALF_WIDTH_METERS,
    MAX_ROAD_MOUTH_HALF_WIDTH_METERS,
  );

  const farHalfWidthMeters = clamp(
    nearHalfWidthMeters * 0.68,
    MIN_ROAD_MOUTH_HALF_WIDTH_METERS * 0.72,
    MAX_ROAD_MOUTH_HALF_WIDTH_METERS * 0.78,
  );

  return {
    enabled: false,
    reason,
    lengthMeters,
    nearHalfWidthMeters,
    farHalfWidthMeters,
    y: ROAD_MOUTH_Y,
    renderOrder: ROAD_MOUTH_RENDER_ORDER,
  };
}

export function getHomeDriveThreeEndpointVisualTrimPolicy(
  road: HomeDriveGeneratedRoadSegment,
  _side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeEndpointVisualTrimPolicy {
  const role = getHomeDriveThreeRoadRenderRole(road, junction);

  if (!junction) {
    return {
      role,
      trimMeters: TERMINAL_TRIM_BY_KIND[kind],
    };
  }

  /*
    Regra mais importante:
    asfalto nunca corta em junction. Isso impede grama aparecer no encontro.
    O junction tile cobre T/+ por cima.
  */
  if (kind === "asphalt") {
    return {
      role,
      trimMeters: ASPHALT_NO_TRIM_METERS,
    };
  }

  if (shouldKeepRoadContinuousAtJunction(road, junction)) {
    return {
      role,
      trimMeters: 0,
    };
  }

  switch (role) {
    case "dominant-road-continuation":
      return {
        role,
        trimMeters: DOMINANT_CONTINUATION_TRIM_BY_KIND[kind],
      };

    case "dominant-road-edge":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.24 + SUBORDINATE_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "equivalent-junction":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.38 + EQUIVALENT_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "minor-junction":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.3 + MINOR_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "terminal":
    default:
      return {
        role,
        trimMeters: TERMINAL_TRIM_BY_KIND[kind],
      };
  }
}
