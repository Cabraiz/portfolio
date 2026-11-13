// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctionTiles.ts

import type {
	HomeDriveGeneratedRoadSegment,
} from "../domain/homeDrive.worldMap.types";
import {
	compareHomeDriveThreeRoadJunctionTileRoadPriority,
	getHomeDriveThreeRoadJunctionTileDominantRoad,
	getHomeDriveThreeRoadJunctionTileKind,
	isHomeDriveThreeRoadJunctionTileSideRoad,
	isHomeDriveThreeRoadJunctionTileThroughRoad,
	isSameHomeDriveThreeRoadJunctionTileRoad,
	shouldCreateHomeDriveThreeRoadJunctionTile,
	shouldUseOneWayHomeDriveThreeRoadJunctionTileArm,
} from "./homeDriveThree.roadJunctionTilePolicy";
import type {
  HomeDriveThreeRoadEndpointRef,
  HomeDriveThreeRoadJunction,
  HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology";
import type { HomeDriveThreeRoadBand } from "./homeDriveThree.types";
import {
	AXIS_GROUP_DOT_THRESHOLD,
	MAX_CROSS_TILE_AXES,
	MAX_COMPLEX_TILE_AXES,
	normalizeVector,
	getAbsDot,
	createFullArmTileBand,
	getEndpointDirectionAwayFromJunction,
	createOneWayArmTileBand,
} from "./homeDriveThree.roadJunctionTiles.bands";

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
