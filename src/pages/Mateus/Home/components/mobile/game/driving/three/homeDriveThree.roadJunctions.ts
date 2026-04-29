// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctions.ts

import type { HomeDriveGeneratedRoadSegment } from "../domain/homeDrive.worldMap.types";
import type { HomeDriveThreeRoadBandKind } from "./homeDriveThree.types";
import {
  getHomeDriveThreeEndpointVisualTrimPolicy,
  type HomeDriveThreeRoadRenderRole,
} from "./homeDriveThree.roadRenderPolicy";
import {
  getHomeDriveThreeRoadEndpointCutKey,
  type HomeDriveThreeRoadEndpointSide,
  type HomeDriveThreeRoadJunction,
  type HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology";

export type HomeDriveThreeEndpointCutReason = HomeDriveThreeRoadRenderRole;

export type HomeDriveThreeEndpointCut = Readonly<{
  roadId: string;
  segmentId: string;
  side: HomeDriveThreeRoadEndpointSide;
  trimMeters: number;
  reason: HomeDriveThreeEndpointCutReason;
  junction: HomeDriveThreeRoadJunction | null;
}>;

export type HomeDriveThreeRoadCutIndex = ReadonlyMap<
  string,
  HomeDriveThreeEndpointCut
>;

function getEndpointCutForKind(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeEndpointCut {
  const policy = getHomeDriveThreeEndpointVisualTrimPolicy(
    road,
    side,
    kind,
    junction,
  );

  return {
    roadId: road.roadId,
    segmentId: road.id,
    side,
    trimMeters: policy.trimMeters,
    reason: policy.role,
    junction,
  };
}

export function createHomeDriveThreeRoadEndpointCut(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  topology: HomeDriveThreeRoadTopology,
): HomeDriveThreeEndpointCut {
  const junction =
    topology.endpointJunctionsByCutKey.get(
      getHomeDriveThreeRoadEndpointCutKey(road, side),
    ) ?? null;

  return getEndpointCutForKind(road, side, kind, junction);
}

export function createHomeDriveThreeRoadEndpointCutIndex(
  roads: readonly HomeDriveGeneratedRoadSegment[],
  kind: HomeDriveThreeRoadBandKind,
  topology: HomeDriveThreeRoadTopology,
): HomeDriveThreeRoadCutIndex {
  const cuts = new Map<string, HomeDriveThreeEndpointCut>();

  for (const road of roads) {
    const fromCut = createHomeDriveThreeRoadEndpointCut(
      road,
      "from",
      kind,
      topology,
    );

    const toCut = createHomeDriveThreeRoadEndpointCut(
      road,
      "to",
      kind,
      topology,
    );

    cuts.set(getHomeDriveThreeRoadEndpointCutKey(road, "from"), fromCut);
    cuts.set(getHomeDriveThreeRoadEndpointCutKey(road, "to"), toCut);
  }

  return cuts;
}

export function getHomeDriveThreeRoadEndpointCutFromIndex(
  cutIndex: HomeDriveThreeRoadCutIndex,
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): HomeDriveThreeEndpointCut | null {
  return cutIndex.get(getHomeDriveThreeRoadEndpointCutKey(road, side)) ?? null;
}
