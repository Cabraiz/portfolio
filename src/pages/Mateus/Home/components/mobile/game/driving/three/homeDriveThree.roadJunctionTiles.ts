// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctionTiles.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import {
  compareHomeDriveThreeRoadJunctionTileRoadPriority,
  getHomeDriveThreeRoadJunctionTileDominantRoad,
  getHomeDriveThreeRoadJunctionTileKind,
  isHomeDriveThreeRoadJunctionTileSideRoad,
  isHomeDriveThreeRoadJunctionTileThroughRoad,
  isSameHomeDriveThreeRoadJunctionTileRoad,
  shouldCreateHomeDriveThreeRoadJunctionTile,
  shouldUseOneWayHomeDriveThreeRoadJunctionTileArm,
  type HomeDriveThreeRoadJunctionTileKind,
} from "./homeDriveThree.roadJunctionTilePolicy";
import type {
  HomeDriveThreeRoadEndpointRef,
  HomeDriveThreeRoadJunction,
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

const AXIS_GROUP_DOT_THRESHOLD = 0.92;
const MAX_CROSS_TILE_AXES = 2;
const MAX_COMPLEX_TILE_AXES = 3;

function clamp(value: number, min: number, max: number): number {
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

function getDot(first: HomeDriveRoadVector, second: HomeDriveRoadVector): number {
  return first.x * second.x + first.z * second.z;
}

function getAbsDot(first: HomeDriveRoadVector, second: HomeDriveRoadVector): number {
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

function createFullArmTileBand(
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

function getEndpointDirectionAwayFromJunction(
  endpoint: HomeDriveThreeRoadEndpointRef,
): HomeDriveRoadVector {
  return normalizeVector(endpoint.directionAwayFromJunction);
}

function createOneWayArmTileBand(
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

function getUniqueRoadsForJunction(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveGeneratedRoadSegment[] {
  const roadsById = new Map<string, HomeDriveGeneratedRoadSegment>();

  for (const road of junction.roads) {
    roadsById.set(road.id, road);
  }

  const roads = Array.from(roadsById.values());
  roads.sort(compareHomeDriveThreeRoadJunctionTileRoadPriority);

  return roads;
}

function pushUniqueAxisRoad(
  axes: HomeDriveGeneratedRoadSegment[],
  candidate: HomeDriveGeneratedRoadSegment,
): void {
  const candidateAxis = normalizeVector(candidate.direction);

  const existingAxis = axes.find((road) => {
    const roadAxis = normalizeVector(road.direction);

    return getAbsDot(candidateAxis, roadAxis) >= AXIS_GROUP_DOT_THRESHOLD;
  });

  if (!existingAxis) {
    axes.push(candidate);
    return;
  }

  const priority = compareHomeDriveThreeRoadJunctionTileRoadPriority(
    candidate,
    existingAxis,
  );

  if (priority < 0) {
    const index = axes.indexOf(existingAxis);

    if (index >= 0) {
      axes[index] = candidate;
    }
  }
}

function getUniqueAxisRoadsForJunction(
  junction: HomeDriveThreeRoadJunction,
  maxAxes: number,
): HomeDriveGeneratedRoadSegment[] {
  const axes: HomeDriveGeneratedRoadSegment[] = [];
  const roads = getUniqueRoadsForJunction(junction);

  for (const road of roads) {
    pushUniqueAxisRoad(axes, road);
  }

  axes.sort(compareHomeDriveThreeRoadJunctionTileRoadPriority);

  return axes.slice(0, maxAxes);
}

function getTJunctionThroughRoad(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveGeneratedRoadSegment | null {
  const dominantRoad = getHomeDriveThreeRoadJunctionTileDominantRoad(junction);

  if (dominantRoad) {
    return dominantRoad;
  }

  const throughRoad = junction.roads.find((road) =>
    isHomeDriveThreeRoadJunctionTileThroughRoad(road, junction),
  );

  return throughRoad ?? null;
}

function getSideEndpointsForTJunction(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadEndpointRef[] {
  const endpoints: HomeDriveThreeRoadEndpointRef[] = [];
  const seen = new Set<string>();

  for (const endpoint of junction.endpoints) {
    if (!shouldUseOneWayHomeDriveThreeRoadJunctionTileArm(endpoint, junction)) {
      continue;
    }

    if (!isHomeDriveThreeRoadJunctionTileSideRoad(endpoint.road, junction)) {
      continue;
    }

    const direction = getEndpointDirectionAwayFromJunction(endpoint);
    const directionKey = `${Math.round(direction.x * 100)}:${Math.round(
      direction.z * 100,
    )}`;
    const key = `${endpoint.road.id}::${endpoint.side}::${directionKey}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    endpoints.push(endpoint);
  }

  endpoints.sort((first, second) =>
    compareHomeDriveThreeRoadJunctionTileRoadPriority(first.road, second.road),
  );

  return endpoints;
}

function createTJunctionTileBands(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  const bands: HomeDriveThreeRoadBand[] = [];
  const throughRoad = getTJunctionThroughRoad(junction);

  if (throughRoad) {
    bands.push(createFullArmTileBand(junction, throughRoad, 0, "t-junction"));
  }

  const sideEndpoints = getSideEndpointsForTJunction(junction);

  sideEndpoints.forEach((endpoint, index) => {
    bands.push(createOneWayArmTileBand(junction, endpoint, index));
  });

  /*
    Fallback: se a topologia não expôs endpoints laterais, ainda assim cria
    pelo menos dois eixos para cobrir verde no nó.
  */
  if (bands.length <= 1) {
    const fallbackAxes = getUniqueAxisRoadsForJunction(
      junction,
      MAX_CROSS_TILE_AXES,
    );

    fallbackAxes.forEach((road, index) => {
      const alreadyRendered =
        throughRoad &&
        isSameHomeDriveThreeRoadJunctionTileRoad(road, throughRoad);

      if (!alreadyRendered) {
        bands.push(createFullArmTileBand(junction, road, index + 1, "t-junction"));
      }
    });
  }

  return bands;
}

function createCrossJunctionTileBands(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  const axisRoads = getUniqueAxisRoadsForJunction(
    junction,
    MAX_CROSS_TILE_AXES,
  );

  return axisRoads.map((road, index) =>
    createFullArmTileBand(junction, road, index, "cross-junction"),
  );
}

function createComplexJunctionTileBands(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  const axisRoads = getUniqueAxisRoadsForJunction(
    junction,
    MAX_COMPLEX_TILE_AXES,
  );

  return axisRoads.map((road, index) =>
    createFullArmTileBand(junction, road, index, "complex-junction"),
  );
}

function sortJunctionTileBands(
  first: HomeDriveThreeRoadBand,
  second: HomeDriveThreeRoadBand,
): number {
  if (first.renderOrder !== second.renderOrder) {
    return first.renderOrder - second.renderOrder;
  }

  if (first.roadId !== second.roadId) {
    return first.roadId.localeCompare(second.roadId);
  }

  if (first.segmentIndex !== second.segmentIndex) {
    return first.segmentIndex - second.segmentIndex;
  }

  return first.id.localeCompare(second.id);
}

export function createHomeDriveThreeRoadJunctionTileBandsForJunction(
  junction: HomeDriveThreeRoadJunction,
): readonly HomeDriveThreeRoadBand[] {
  if (!shouldCreateHomeDriveThreeRoadJunctionTile(junction)) {
    return [];
  }

  const kind = getHomeDriveThreeRoadJunctionTileKind(junction);

  let bands: readonly HomeDriveThreeRoadBand[] = [];

  switch (kind) {
    case "t-junction":
      bands = createTJunctionTileBands(junction);
      break;

    case "cross-junction":
      bands = createCrossJunctionTileBands(junction);
      break;

    case "complex-junction":
      bands = createComplexJunctionTileBands(junction);
      break;

    case "none":
    default:
      bands = [];
      break;
  }

  return [...bands].sort(sortJunctionTileBands);
}

export function createHomeDriveThreeRoadJunctionTileBands(
  topology: HomeDriveThreeRoadTopology,
): readonly HomeDriveThreeRoadBand[] {
  const bands: HomeDriveThreeRoadBand[] = [];

  for (const junction of topology.junctionsByKey.values()) {
    bands.push(...createHomeDriveThreeRoadJunctionTileBandsForJunction(junction));
  }

  bands.sort(sortJunctionTileBands);

  return bands;
}
