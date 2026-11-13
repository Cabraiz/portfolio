// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.ts

import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveRoadTopology,
  HomeDriveRoadEndpointRef,
  HomeDriveRoadJunction,
  HomeDriveRoadTopologyConnection,
  HomeDriveRoadThroughRef,
  HomeDriveRoadEndpointSide,
} from "./homeDrive.roadTopology.types";
import {
  createHomeDriveRoadEndpointRef,
  getHomeDriveRoadEndpointCutKey,
} from "./homeDrive.roadTopology.priority";
import {
  findThroughRoadsAtEndpoint,
  createJunction,
} from "./homeDrive.roadTopology.junctions";
import {
  appendToMapArray,
  buildConnectionsForJunction,
} from "./homeDrive.roadTopology.connections";

export type {
  HomeDriveRoadEndpointSide,
  HomeDriveRoadPriority,
  HomeDriveRoadEndpointRef,
  HomeDriveRoadThroughRef,
  HomeDriveRoadJunctionType,
  HomeDriveRoadJunction,
  HomeDriveRoadTopologyConnectionKind,
  HomeDriveRoadTopologyConnection,
  HomeDriveRoadTopology,
} from "./homeDrive.roadTopology.types";
export {
  getHomeDriveRoadPriority,
  compareHomeDriveRoadPriority,
  getHomeDriveRoadPointKey,
  getHomeDriveRoadEndpointCutKey,
  getHomeDriveRoadEndpointPosition,
  getHomeDriveRoadEndpointDirectionAway,
  createHomeDriveRoadEndpointRef,
} from "./homeDrive.roadTopology.priority";

export function buildHomeDriveRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveRoadTopology {
  const segmentsById = new Map<string, HomeDriveGeneratedRoadSegment>();
  const endpointsByKey = new Map<string, HomeDriveRoadEndpointRef[]>();

  for (const road of roads) {
    segmentsById.set(road.id, road);

    const fromEndpoint = createHomeDriveRoadEndpointRef(road, "from");
    const toEndpoint = createHomeDriveRoadEndpointRef(road, "to");

    appendToMapArray(endpointsByKey, fromEndpoint.key, fromEndpoint);
    appendToMapArray(endpointsByKey, toEndpoint.key, toEndpoint);
  }

  const junctionsByKey = new Map<string, HomeDriveRoadJunction>();
  const endpointJunctionsByCutKey = new Map<string, HomeDriveRoadJunction>();

  const connectionsByEndpointCutKey = new Map<
    string,
    HomeDriveRoadTopologyConnection[]
  >();

  const connectionsBySegmentId = new Map<
    string,
    HomeDriveRoadTopologyConnection[]
  >();

  for (const [key, endpoints] of endpointsByKey.entries()) {
    const throughRoads = endpoints.flatMap((endpoint) =>
      findThroughRoadsAtEndpoint(endpoint, roads),
    );

    const uniqueThroughRoads = Array.from(
      new Map<string, HomeDriveRoadThroughRef>(
        throughRoads.map((throughRoad) => [
          throughRoad.road.id,
          throughRoad,
        ]),
      ).values(),
    );

    const junction = createJunction(key, endpoints, uniqueThroughRoads);

    if (junction.type === "terminal") {
      continue;
    }

    junctionsByKey.set(key, junction);

    for (const endpoint of endpoints) {
      endpointJunctionsByCutKey.set(endpoint.cutKey, junction);
    }

    const connections = buildConnectionsForJunction(junction);

    for (const connection of connections) {
      appendToMapArray(
        connectionsByEndpointCutKey,
        connection.fromEndpointCutKey,
        connection,
      );

      appendToMapArray(
        connectionsBySegmentId,
        connection.fromSegmentId,
        connection,
      );
    }
  }

  return {
    segmentsById,
    endpointsByKey,
    junctionsByKey,
    endpointJunctionsByCutKey,
    connectionsByEndpointCutKey,
    connectionsBySegmentId,
  };
}

export function getHomeDriveRoadTopologyConnectionsFromEndpoint(
  topology: HomeDriveRoadTopology,
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveRoadEndpointSide,
): readonly HomeDriveRoadTopologyConnection[] {
  return (
    topology.connectionsByEndpointCutKey.get(
      getHomeDriveRoadEndpointCutKey(road, side),
    ) ?? []
  );
}
