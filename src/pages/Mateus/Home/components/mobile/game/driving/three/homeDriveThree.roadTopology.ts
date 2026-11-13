// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.ts

import type {
	HomeDriveGeneratedRoadSegment,
} from "../domain/homeDrive.worldMap.types";
import type {
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadJunction,
	HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology.types";
import {
	getHomeDriveThreeRoadEndpointCutKey,
} from "./homeDriveThree.roadTopology.metrics";
import {
	createEndpointRef,
	findThroughRoadsAtEndpoint,
} from "./homeDriveThree.roadTopology.endpoints";
import {
	createJunction,
	appendEndpointToKey,
	getUniqueThroughRoads,
} from "./homeDriveThree.roadTopology.junctions";
export type {
	HomeDriveThreeRoadEndpointSide,
	HomeDriveThreeRoadPriority,
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadThroughRef,
	HomeDriveThreeRoadJunctionType,
	HomeDriveThreeRoadJunction,
	HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology.types";
export {
	getHomeDriveThreeRoadPriority,
	compareHomeDriveThreeRoadPriority,
	getHomeDriveThreeRoadPointKey,
	getHomeDriveThreeRoadEndpointCutKey,
	getHomeDriveThreeRoadDistance,
	getHomeDriveThreeRoadNormalizedDot,
} from "./homeDriveThree.roadTopology.metrics";
export {
	isHomeDriveThreeDominantRoadAtJunction,
	isHomeDriveThreeSubordinateRoadAtJunction,
} from "./homeDriveThree.roadTopology.junctions";

export function buildHomeDriveThreeRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveThreeRoadTopology {
  const endpointsByKey = new Map<string, HomeDriveThreeRoadEndpointRef[]>();

  for (const road of roads) {
    const fromEndpoint = createEndpointRef(road, "from");
    const toEndpoint = createEndpointRef(road, "to");

    appendEndpointToKey(endpointsByKey, fromEndpoint.key, fromEndpoint);
    appendEndpointToKey(endpointsByKey, toEndpoint.key, toEndpoint);
  }

  const junctionsByKey = new Map<string, HomeDriveThreeRoadJunction>();
  const endpointJunctionsByCutKey = new Map<
    string,
    HomeDriveThreeRoadJunction
  >();

  for (const [key, endpoints] of endpointsByKey.entries()) {
    const throughRoads = endpoints.flatMap((endpoint) =>
      findThroughRoadsAtEndpoint(endpoint, roads),
    );

    const uniqueThroughRoads = getUniqueThroughRoads(throughRoads);
    const junction = createJunction(key, endpoints, uniqueThroughRoads);

    if (junction.type === "terminal") {
      continue;
    }

    junctionsByKey.set(key, junction);

    for (const endpoint of endpoints) {
      endpointJunctionsByCutKey.set(
        getHomeDriveThreeRoadEndpointCutKey(endpoint.road, endpoint.side),
        junction,
      );
    }
  }

  return {
    junctionsByKey,
    endpointJunctionsByCutKey,
  };
}
