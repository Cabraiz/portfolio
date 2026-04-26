// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadJunctions.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import type { HomeDriveThreeRoadBandKind } from "./homeDriveThree.types";
import {
  getHomeDriveThreeRoadEndpointCutKey,
  getHomeDriveThreeRoadNormalizedDot,
  getHomeDriveThreeRoadPriority,
  isHomeDriveThreeDominantRoadAtJunction,
  isHomeDriveThreeSubordinateRoadAtJunction,
  type HomeDriveThreeRoadEndpointSide,
  type HomeDriveThreeRoadJunction,
  type HomeDriveThreeRoadTopology,
} from "./homeDriveThree.roadTopology";

export type HomeDriveThreeEndpointCutReason =
  | "terminal"
  | "dominant-road-continuation"
  | "dominant-road-edge"
  | "equivalent-junction"
  | "minor-junction";

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

const TERMINAL_TRIM_BY_KIND: Readonly<Record<HomeDriveThreeRoadBandKind, number>> =
  {
    asphalt: 0,
    "sidewalk-left": 2.6,
    "sidewalk-right": 2.6,
    curb: 3.4,
    "lane-mark": 9.2,
  };

const EQUIVALENT_JUNCTION_EXTRA_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: 0,
  "sidewalk-left": 18,
  "sidewalk-right": 18,
  curb: 15,
  "lane-mark": 22,
};

const SUBORDINATE_EXTRA_BY_KIND: Readonly<Record<HomeDriveThreeRoadBandKind, number>> =
  {
    asphalt: 1.4,
    "sidewalk-left": 8.5,
    "sidewalk-right": 8.5,
    curb: 7.2,
    "lane-mark": 13,
  };

function getRoadSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 9.2;
    case "avenue":
      return 6.4;
    case "commercial":
      return 5.8;
    case "ring":
      return 5.2;
    case "service":
      return 2.8;
    case "street":
      return 3.6;
    default:
      if (road.roadTone === "boulevard") {
        return 7.4;
      }

      if (road.roadTone === "urban-core") {
        return 4.8;
      }

      return 4.4;
  }
}

function getRoadCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

function getDirectionIntoEndpoint(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): Readonly<{ x: number; z: number }> {
  if (side === "from") {
    return {
      x: -road.direction.x,
      z: -road.direction.z,
    };
  }

  return {
    x: road.direction.x,
    z: road.direction.z,
  };
}

function getProjectionDistanceToDominantEdge(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  dominantRoad: HomeDriveGeneratedRoadSegment,
): number {
  const approachDirection = getDirectionIntoEndpoint(road, side);
  const dominantNormalProjection = Math.abs(
    getHomeDriveThreeRoadNormalizedDot(approachDirection, dominantRoad.normal),
  );

  const safeProjection = Math.max(0.22, dominantNormalProjection);
  const dominantHalfWidth = dominantRoad.width / 2;
  const dominantCurb = getRoadCurbWidthMeters(dominantRoad);

  /*
    Distância medida no eixo da rua subordinada até a borda do asfalto
    da via dominante. Em ângulo oblíquo, precisa dividir pela projeção.
  */
  return (dominantHalfWidth + dominantCurb) / safeProjection;
}

function getSubordinateRoadTrimMeters(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction,
): number {
  if (!junction.dominantRoad) {
    return TERMINAL_TRIM_BY_KIND[kind];
  }

  const dominantEdgeDistance = getProjectionDistanceToDominantEdge(
    road,
    side,
    junction.dominantRoad,
  );

  return dominantEdgeDistance + SUBORDINATE_EXTRA_BY_KIND[kind];
}

function getEquivalentJunctionTrimMeters(
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction,
): number {
  if (kind === "asphalt") {
    return 0;
  }

  const base = Math.max(12, junction.maxRoadWidth * 0.58);

  return base + EQUIVALENT_JUNCTION_EXTRA_BY_KIND[kind];
}

function getMinorJunctionTrimMeters(
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction,
): number {
  if (kind === "asphalt") {
    return 0;
  }

  const base = Math.max(7, junction.maxRoadWidth * 0.36);

  return base + TERMINAL_TRIM_BY_KIND[kind];
}

function getEndpointCutForKind(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeEndpointCut {
  if (!junction) {
    return {
      roadId: road.roadId,
      segmentId: road.id,
      side,
      trimMeters: TERMINAL_TRIM_BY_KIND[kind],
      reason: "terminal",
      junction: null,
    };
  }

  if (isHomeDriveThreeSubordinateRoadAtJunction(road, junction)) {
    return {
      roadId: road.roadId,
      segmentId: road.id,
      side,
      trimMeters: getSubordinateRoadTrimMeters(road, side, kind, junction),
      reason: "dominant-road-edge",
      junction,
    };
  }

  if (isHomeDriveThreeDominantRoadAtJunction(road, junction)) {
    if (kind === "asphalt") {
      return {
        roadId: road.roadId,
        segmentId: road.id,
        side,
        trimMeters: 0,
        reason: "dominant-road-continuation",
        junction,
      };
    }

    return {
      roadId: road.roadId,
      segmentId: road.id,
      side,
      trimMeters: getMinorJunctionTrimMeters(kind, junction),
      reason: "minor-junction",
      junction,
    };
  }

  const roadPriority = getHomeDriveThreeRoadPriority(road);
  const dominantPriority = junction.dominantPriority;

  if (dominantPriority && Math.abs(roadPriority.score - dominantPriority.score) < 180) {
    return {
      roadId: road.roadId,
      segmentId: road.id,
      side,
      trimMeters: getEquivalentJunctionTrimMeters(kind, junction),
      reason: "equivalent-junction",
      junction,
    };
  }

  return {
    roadId: road.roadId,
    segmentId: road.id,
    side,
    trimMeters: getMinorJunctionTrimMeters(kind, junction),
    reason: "minor-junction",
    junction,
  };
}

function getRoadEndpointPosition(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
): HomeDriveWorldPosition {
  return side === "from" ? road.from : road.to;
}

export function createHomeDriveThreeRoadEndpointCut(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  topology: HomeDriveThreeRoadTopology,
): HomeDriveThreeEndpointCut {
  void getRoadEndpointPosition;

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
  return (
    cutIndex.get(getHomeDriveThreeRoadEndpointCutKey(road, side)) ?? null
  );
}
