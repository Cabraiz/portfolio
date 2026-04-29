// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadAttachments.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
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

type HomeDriveRoadVector = Readonly<{
  x: number;
  z: number;
}>;

type HomeDriveResolvedThroughRoad = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  nearestPoint: HomeDriveWorldPosition;
}>;

type HomeDriveRoadAttachmentAnchor = Readonly<{
  throughRoad: HomeDriveResolvedThroughRoad;
  throughEdgeCenter: HomeDriveWorldPosition;
  sideEndpointCenter: HomeDriveWorldPosition;
  sideRoadAxis: HomeDriveRoadVector;
}>;

/*
  Cobre a borda da rua dominante sem transformar o T/local-no-cross
  em cruzamento cortante.
*/
const THROUGH_ROAD_EDGE_OVERLAP_METERS = 0.72;

/*
  Entra um pouco no corpo da rua lateral para cobrir o gap criado pelo trim.
*/
const SIDE_ROAD_BODY_OVERLAP_METERS = 2.75;

const ATTACHMENT_Y = 0.138;
const ATTACHMENT_RENDER_ORDER = 4.45;

const MIN_ATTACHMENT_LENGTH_METERS = 1.25;
const MAX_ATTACHMENT_LENGTH_METERS = 28;

const SIDE_ROAD_NEAR_WIDTH_MULTIPLIER = 1.1;
const SIDE_ROAD_FAR_WIDTH_MULTIPLIER = 1.04;

const MIN_ATTACHMENT_HALF_WIDTH_METERS = 1.65;
const MAX_ATTACHMENT_EXTRA_HALF_WIDTH_METERS = 0.95;

const DOMINANT_ALIGNMENT_DOT = 0.94;
const DOMINANT_MIN_WIDTH_RATIO = 0.66;
const DOMINANT_PRIORITY_DELTA = 300;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDistance(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
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

function invertVector(vector: HomeDriveRoadVector): HomeDriveRoadVector {
  return {
    x: -vector.x,
    z: -vector.z,
  };
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

function getVectorBetweenPoints(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveRoadVector {
  return {
    x: to.x - from.x,
    z: to.z - from.z,
  };
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function hasRoadTag(
  road: HomeDriveGeneratedRoadSegment,
  tag: string,
): boolean {
  return getRoadTags(road).includes(tag);
}

function getRoadHalfWidth(road: HomeDriveGeneratedRoadSegment): number {
  return Math.max(1.5, road.width / 2);
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

  if (hasRoadTag(road, "main")) {
    score += 220;
  }

  if (hasRoadTag(road, "fast")) {
    score += 160;
  }

  if (hasRoadTag(road, "wide")) {
    score += 120;
  }

  if (hasRoadTag(road, "connector")) {
    score += 80;
  }

  if (hasRoadTag(road, "local-no-cross")) {
    score -= 80;
  }

  if (hasRoadTag(road, "service")) {
    score -= 180;
  }

  if (hasRoadTag(road, "short")) {
    score -= 120;
  }

  if (hasRoadTag(road, "approach")) {
    score -= 140;
  }

  if (hasRoadTag(road, "safe-endcap")) {
    score -= 260;
  }

  return score;
}

function getRoadPriorityScore(road: HomeDriveGeneratedRoadSegment): number {
  return getRoadKindScore(road) + road.width * 18 + getRoadTagScore(road);
}

function getNormalizedDot(
  first: HomeDriveRoadVector,
  second: HomeDriveRoadVector,
): number {
  const firstLength = Math.hypot(first.x, first.z);
  const secondLength = Math.hypot(second.x, second.z);

  if (firstLength <= 0.000001 || secondLength <= 0.000001) {
    return 1;
  }

  return getDot(first, second) / (firstLength * secondLength);
}

function isSameRoadIdentity(
  first: HomeDriveGeneratedRoadSegment,
  second: HomeDriveGeneratedRoadSegment,
): boolean {
  return first.id === second.id || first.roadId === second.roadId;
}

function isRoadAlignedWithDominantRoad(
  road: HomeDriveGeneratedRoadSegment,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  if (isSameRoadIdentity(road, dominantRoad)) {
    return true;
  }

  const absDot = Math.abs(getNormalizedDot(road.direction, dominantRoad.direction));

  if (absDot < DOMINANT_ALIGNMENT_DOT) {
    return false;
  }

  const priorityDelta = Math.abs(
    getRoadPriorityScore(road) - getRoadPriorityScore(dominantRoad),
  );

  if (priorityDelta > DOMINANT_PRIORITY_DELTA) {
    return false;
  }

  const minWidth = Math.min(road.width, dominantRoad.width);
  const maxWidth = Math.max(road.width, dominantRoad.width);

  return minWidth / Math.max(0.001, maxWidth) >= DOMINANT_MIN_WIDTH_RATIO;
}

function isRoadEligibleForAttachment(
  road: HomeDriveGeneratedRoadSegment,
): boolean {
  /*
    local-no-cross e short NÃO são decorativos para attachment.
    Eles são justamente o caso que precisa de apron para não deixar verde.

    safe-endcap/approach continuam suprimidos porque normalmente são
    aproximações artificiais de portão/anel.
  */
  if (hasRoadTag(road, "safe-endcap") || hasRoadTag(road, "approach")) {
    return false;
  }

  return (
    hasRoadTag(road, "local-no-cross") ||
    hasRoadTag(road, "short") ||
    road.kind === "service"
  );
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

function getEndpointDirectionAwayFromJunction(
  endpoint: HomeDriveThreeRoadEndpointRef,
): HomeDriveRoadVector {
  return normalizeVector(endpoint.directionAwayFromJunction);
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

function getAttachmentId(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): string {
  return `road-attachment::${junction.key}::${endpoint.road.id}::${endpoint.side}`;
}

function isEndpointPartOfThroughRoad(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveGeneratedRoadSegment,
): boolean {
  return isRoadAlignedWithDominantRoad(endpoint.road, throughRoad);
}

function getDominantRoadForJunction(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveGeneratedRoadSegment | null {
  if (junction.dominantRoad) {
    return junction.dominantRoad;
  }

  const roads = [...junction.roads];

  roads.sort((first, second) => {
    const scoreDelta = getRoadPriorityScore(second) - getRoadPriorityScore(first);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    if (first.width !== second.width) {
      return second.width - first.width;
    }

    return first.id.localeCompare(second.id);
  });

  return roads[0] ?? null;
}

function getPreferredThroughRoadFromProjection(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveResolvedThroughRoad | null {
  const throughRoads = junction.throughRoads.filter(
    (throughRoad: HomeDriveThreeRoadThroughRef) =>
      !isSameRoadIdentity(throughRoad.road, endpoint.road),
  );

  if (throughRoads.length === 0) {
    return null;
  }

  const dominantRoad = getDominantRoadForJunction(junction);

  if (dominantRoad) {
    const dominantThroughRoad = throughRoads.find((throughRoad) =>
      isSameRoadIdentity(throughRoad.road, dominantRoad),
    );

    if (dominantThroughRoad) {
      return {
        road: dominantThroughRoad.road,
        nearestPoint: dominantThroughRoad.nearestPoint,
      };
    }
  }

  const firstThroughRoad = throughRoads[0];

  if (!firstThroughRoad) {
    return null;
  }

  return {
    road: firstThroughRoad.road,
    nearestPoint: firstThroughRoad.nearestPoint,
  };
}

function getPreferredThroughRoadFromDominantCorridor(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveResolvedThroughRoad | null {
  const dominantRoad = getDominantRoadForJunction(junction);

  if (!dominantRoad || isSameRoadIdentity(dominantRoad, endpoint.road)) {
    return null;
  }

  return {
    road: dominantRoad,
    nearestPoint: junction.position,
  };
}

function getPreferredThroughRoadForEndpoint(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveResolvedThroughRoad | null {
  return (
    getPreferredThroughRoadFromProjection(endpoint, junction) ??
    getPreferredThroughRoadFromDominantCorridor(endpoint, junction)
  );
}

function getSideRoadAxisFromThroughRoad(
  endpoint: HomeDriveThreeRoadEndpointRef,
  throughRoad: HomeDriveResolvedThroughRoad,
): HomeDriveRoadVector {
  const endpointDirectionAway = getEndpointDirectionAwayFromJunction(endpoint);
  const projectedToEndpoint = getVectorBetweenPoints(
    throughRoad.nearestPoint,
    endpoint.position,
  );

  const signedDistance = getDot(projectedToEndpoint, endpointDirectionAway);

  if (Math.abs(signedDistance) <= 0.001) {
    return endpointDirectionAway;
  }

  return signedDistance >= 0
    ? endpointDirectionAway
    : invertVector(endpointDirectionAway);
}

function getThroughRoadEdgeCenter(
  throughRoad: HomeDriveResolvedThroughRoad,
  sideRoadAxis: HomeDriveRoadVector,
): HomeDriveWorldPosition {
  const throughHalfWidth = getRoadHalfWidth(throughRoad.road);
  const distanceToEdge = Math.max(
    0,
    throughHalfWidth - THROUGH_ROAD_EDGE_OVERLAP_METERS,
  );

  return movePoint(throughRoad.nearestPoint, sideRoadAxis, distanceToEdge);
}

function getSideEndpointCenter(
  endpoint: HomeDriveThreeRoadEndpointRef,
  sideRoadAxis: HomeDriveRoadVector,
): HomeDriveWorldPosition {
  return movePoint(endpoint.position, sideRoadAxis, SIDE_ROAD_BODY_OVERLAP_METERS);
}

function getAttachmentAnchor(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveRoadAttachmentAnchor | null {
  const throughRoad = getPreferredThroughRoadForEndpoint(endpoint, junction);

  if (!throughRoad) {
    return null;
  }

  if (isEndpointPartOfThroughRoad(endpoint, throughRoad.road)) {
    return null;
  }

  const sideRoadAxis = getSideRoadAxisFromThroughRoad(endpoint, throughRoad);

  return {
    throughRoad,
    throughEdgeCenter: getThroughRoadEdgeCenter(throughRoad, sideRoadAxis),
    sideEndpointCenter: getSideEndpointCenter(endpoint, sideRoadAxis),
    sideRoadAxis,
  };
}

function getAttachmentNearHalfWidth(endpoint: HomeDriveThreeRoadEndpointRef): number {
  const sideHalfWidth = getRoadHalfWidth(endpoint.road);

  return clamp(
    sideHalfWidth * SIDE_ROAD_NEAR_WIDTH_MULTIPLIER,
    MIN_ATTACHMENT_HALF_WIDTH_METERS,
    sideHalfWidth + MAX_ATTACHMENT_EXTRA_HALF_WIDTH_METERS,
  );
}

function getAttachmentFarHalfWidth(endpoint: HomeDriveThreeRoadEndpointRef): number {
  const sideHalfWidth = getRoadHalfWidth(endpoint.road);

  return clamp(
    sideHalfWidth * SIDE_ROAD_FAR_WIDTH_MULTIPLIER,
    MIN_ATTACHMENT_HALF_WIDTH_METERS,
    sideHalfWidth + MAX_ATTACHMENT_EXTRA_HALF_WIDTH_METERS * 0.72,
  );
}

function shouldCreateAttachmentForEndpoint(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): boolean {
  if (junction.type === "terminal" || junction.type === "continuation") {
    return false;
  }

  if (!isRoadEligibleForAttachment(endpoint.road)) {
    return false;
  }

  const throughRoad = getPreferredThroughRoadForEndpoint(endpoint, junction);

  if (!throughRoad) {
    return false;
  }

  if (isEndpointPartOfThroughRoad(endpoint, throughRoad.road)) {
    return false;
  }

  return true;
}

function createRoadAttachmentBand(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadBand | null {
  if (!shouldCreateAttachmentForEndpoint(endpoint, junction)) {
    return null;
  }

  const anchor = getAttachmentAnchor(endpoint, junction);

  if (!anchor) {
    return null;
  }

  const attachmentLength = getDistance(
    anchor.throughEdgeCenter,
    anchor.sideEndpointCenter,
  );

  if (
    attachmentLength <= MIN_ATTACHMENT_LENGTH_METERS ||
    attachmentLength > MAX_ATTACHMENT_LENGTH_METERS
  ) {
    return null;
  }

  const normal = getSafeRoadNormal(endpoint.road);
  const nearHalfWidth = getAttachmentNearHalfWidth(endpoint);
  const farHalfWidth = getAttachmentFarHalfWidth(endpoint);

  return {
    id: getAttachmentId(endpoint, junction),
    kind: "asphalt",
    roadId: endpoint.road.roadId,
    segmentIndex: endpoint.road.segmentIndex,
    material: HOME_DRIVE_THREE_MATERIALS.asphalt as HomeDriveThreeRoadBand["material"],
    renderOrder: ATTACHMENT_RENDER_ORDER,
    points: [
      offsetPoint(anchor.throughEdgeCenter, normal, -nearHalfWidth, ATTACHMENT_Y),
      offsetPoint(anchor.throughEdgeCenter, normal, nearHalfWidth, ATTACHMENT_Y),
      offsetPoint(anchor.sideEndpointCenter, normal, farHalfWidth, ATTACHMENT_Y),
      offsetPoint(anchor.sideEndpointCenter, normal, -farHalfWidth, ATTACHMENT_Y),
    ],
  };
}

function sortRoadAttachmentBands(
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

export function createHomeDriveThreeRoadAttachmentBandsForJunction(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  if (junction.type === "terminal" || junction.type === "continuation") {
    return [];
  }

  const bands: HomeDriveThreeRoadBand[] = [];

  for (const endpoint of junction.endpoints) {
    const band = createRoadAttachmentBand(endpoint, junction);

    if (band) {
      bands.push(band);
    }
  }

  bands.sort(sortRoadAttachmentBands);

  return bands;
}

export function createHomeDriveThreeRoadAttachmentBands(
  topology: HomeDriveThreeRoadTopology,
): readonly HomeDriveThreeRoadBand[] {
  const bands: HomeDriveThreeRoadBand[] = [];

  for (const junction of topology.junctionsByKey.values()) {
    bands.push(...createHomeDriveThreeRoadAttachmentBandsForJunction(junction));
  }

  bands.sort(sortRoadAttachmentBands);

  return bands;
}
