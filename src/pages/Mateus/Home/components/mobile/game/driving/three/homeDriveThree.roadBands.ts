// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadBands.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import type {
  HomeDriveThreeRoadBand,
  HomeDriveThreeRoadBandKind,
  HomeDriveThreeVector3Tuple,
} from "./homeDriveThree.types";
import {
  buildHomeDriveThreeRoadTopology,
  type HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";
import {
  createHomeDriveThreeRoadEndpointCutIndex,
  getHomeDriveThreeRoadEndpointCutFromIndex,
  type HomeDriveThreeRoadCutIndex,
} from "./homeDriveThree.roadJunctions";

export type HomeDriveThreeRoadRenderModel = Readonly<{
  asphalt: readonly HomeDriveThreeRoadBand[];
  sidewalks: readonly HomeDriveThreeRoadBand[];
  curbs: readonly HomeDriveThreeRoadBand[];
  laneMarks: readonly HomeDriveThreeRoadBand[];
}>;

const ROAD_Y = 0.045;
const SIDEWALK_Y = 0.06;
const CURB_Y = 0.082;
const LANE_MARK_Y = 0.095;
const INTERSECTION_PAD_Y = 0.19;

const MIN_RENDERABLE_SEGMENT_LENGTH_METERS = 3.4;

function getBandMaterial(
  kind: HomeDriveThreeRoadBandKind,
): HomeDriveThreeRoadBand["material"] {
  switch (kind) {
    case "sidewalk-left":
    case "sidewalk-right":
      return HOME_DRIVE_THREE_MATERIALS.sidewalk as HomeDriveThreeRoadBand["material"];
    case "curb":
      return HOME_DRIVE_THREE_MATERIALS.curb as HomeDriveThreeRoadBand["material"];
    case "lane-mark":
      return HOME_DRIVE_THREE_MATERIALS.laneMark as HomeDriveThreeRoadBand["material"];
    case "asphalt":
    default:
      return HOME_DRIVE_THREE_MATERIALS.asphalt as HomeDriveThreeRoadBand["material"];
  }
}

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

function getRoadPointDistance(
  first: HomeDriveWorldPosition,
  second: HomeDriveWorldPosition,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function movePointAlongRoad(
  point: HomeDriveWorldPosition,
  road: HomeDriveGeneratedRoadSegment,
  distanceMeters: number,
): HomeDriveWorldPosition {
  return {
    x: point.x + road.direction.x * distanceMeters,
    z: point.z + road.direction.z * distanceMeters,
  };
}

function offsetPoint(
  point: HomeDriveWorldPosition,
  normal: Readonly<{ x: number; z: number }>,
  offsetMeters: number,
  y: number,
): HomeDriveThreeVector3Tuple {
  return [
    point.x + normal.x * offsetMeters,
    y,
    point.z + normal.z * offsetMeters,
  ];
}

function createRoadBandWithCuts(
  id: string,
  kind: HomeDriveThreeRoadBandKind,
  road: HomeDriveGeneratedRoadSegment,
  innerOffsetMeters: number,
  outerOffsetMeters: number,
  y: number,
  renderOrder: number,
  cutIndex: HomeDriveThreeRoadCutIndex,
): HomeDriveThreeRoadBand | null {
  const fromCut = getHomeDriveThreeRoadEndpointCutFromIndex(
    cutIndex,
    road,
    "from",
  );

  const toCut = getHomeDriveThreeRoadEndpointCutFromIndex(cutIndex, road, "to");

  const startTrim = Math.max(0, fromCut?.trimMeters ?? 0);
  const endTrim = Math.max(0, toCut?.trimMeters ?? 0);

  if (road.length - startTrim - endTrim <= MIN_RENDERABLE_SEGMENT_LENGTH_METERS) {
    return null;
  }

  const from =
    startTrim > 0 ? movePointAlongRoad(road.from, road, startTrim) : road.from;

  const to =
    endTrim > 0 ? movePointAlongRoad(road.to, road, -endTrim) : road.to;

  if (getRoadPointDistance(from, to) <= MIN_RENDERABLE_SEGMENT_LENGTH_METERS) {
    return null;
  }

  return {
    id,
    kind,
    roadId: road.roadId,
    segmentIndex: road.segmentIndex,
    material: getBandMaterial(kind),
    renderOrder,
    points: [
      offsetPoint(from, road.normal, innerOffsetMeters, y),
      offsetPoint(from, road.normal, outerOffsetMeters, y),
      offsetPoint(to, road.normal, outerOffsetMeters, y),
      offsetPoint(to, road.normal, innerOffsetMeters, y),
    ],
  };
}

function createLaneMarkBands(
  road: HomeDriveGeneratedRoadSegment,
  cutIndex: HomeDriveThreeRoadCutIndex,
): readonly HomeDriveThreeRoadBand[] {
  const laneCount = Math.max(1, road.laneCount);

  if (laneCount <= 1) {
    return [];
  }

  const laneWidth = road.width / laneCount;
  const roadHalfWidth = road.width / 2;
  const lineWidth = road.kind === "service" ? 0.14 : 0.2;
  const bands: HomeDriveThreeRoadBand[] = [];

  for (let laneIndex = 1; laneIndex < laneCount; laneIndex += 1) {
    const centerOffset = -roadHalfWidth + laneWidth * laneIndex;

    const band = createRoadBandWithCuts(
      `${road.id}::lane-${laneIndex}`,
      "lane-mark",
      road,
      centerOffset - lineWidth / 2,
      centerOffset + lineWidth / 2,
      LANE_MARK_Y,
      7,
      cutIndex,
    );

    if (band) {
      bands.push(band);
    }
  }

  return bands;
}

function shouldCreateIntersectionPad(junction: HomeDriveThreeRoadJunction): boolean {
  if (junction.type === "t-junction") {
    return false;
  }

  if (junction.type === "continuation") {
    return false;
  }

  return junction.roads.length >= 3;
}

function createIntersectionPadBand(
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadBand {
  const half = Math.max(24, junction.maxRoadWidth * 0.88 + 10);
  const { x, z } = junction.position;

  return {
    id: `junction-pad::${junction.key}`,
    kind: "asphalt",
    roadId: `junction-pad::${junction.key}`,
    segmentIndex: -1,
    material: HOME_DRIVE_THREE_MATERIALS.asphalt as HomeDriveThreeRoadBand["material"],
    renderOrder: 9,
    points: [
      [x - half, INTERSECTION_PAD_Y, z - half],
      [x + half, INTERSECTION_PAD_Y, z - half],
      [x + half, INTERSECTION_PAD_Y, z + half],
      [x - half, INTERSECTION_PAD_Y, z + half],
    ],
  };
}

export function createHomeDriveThreeRoadRenderModel(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveThreeRoadRenderModel {
  const topology = buildHomeDriveThreeRoadTopology(roads);

  const asphaltCutIndex = createHomeDriveThreeRoadEndpointCutIndex(
    roads,
    "asphalt",
    topology,
  );

  const sidewalkLeftCutIndex = createHomeDriveThreeRoadEndpointCutIndex(
    roads,
    "sidewalk-left",
    topology,
  );

  const sidewalkRightCutIndex = createHomeDriveThreeRoadEndpointCutIndex(
    roads,
    "sidewalk-right",
    topology,
  );

  const curbCutIndex = createHomeDriveThreeRoadEndpointCutIndex(
    roads,
    "curb",
    topology,
  );

  const laneMarkCutIndex = createHomeDriveThreeRoadEndpointCutIndex(
    roads,
    "lane-mark",
    topology,
  );

  const asphalt: HomeDriveThreeRoadBand[] = [];
  const sidewalks: HomeDriveThreeRoadBand[] = [];
  const curbs: HomeDriveThreeRoadBand[] = [];
  const laneMarks: HomeDriveThreeRoadBand[] = [];

  for (const road of roads) {
    const roadHalfWidth = Math.max(1.5, road.width / 2);
    const sidewalkWidth = getRoadSidewalkWidthMeters(road);
    const curbWidth = getRoadCurbWidthMeters(road);

    const asphaltBand = createRoadBandWithCuts(
      `${road.id}::asphalt`,
      "asphalt",
      road,
      -roadHalfWidth,
      roadHalfWidth,
      ROAD_Y,
      3,
      asphaltCutIndex,
    );

    if (asphaltBand) {
      asphalt.push(asphaltBand);
    }

    const sidewalkLeft = createRoadBandWithCuts(
      `${road.id}::sidewalk-left`,
      "sidewalk-left",
      road,
      roadHalfWidth + curbWidth,
      roadHalfWidth + curbWidth + sidewalkWidth,
      SIDEWALK_Y,
      2,
      sidewalkLeftCutIndex,
    );

    const sidewalkRight = createRoadBandWithCuts(
      `${road.id}::sidewalk-right`,
      "sidewalk-right",
      road,
      -roadHalfWidth - curbWidth - sidewalkWidth,
      -roadHalfWidth - curbWidth,
      SIDEWALK_Y,
      2,
      sidewalkRightCutIndex,
    );

    if (sidewalkLeft) {
      sidewalks.push(sidewalkLeft);
    }

    if (sidewalkRight) {
      sidewalks.push(sidewalkRight);
    }

    const curbLeft = createRoadBandWithCuts(
      `${road.id}::curb-left`,
      "curb",
      road,
      roadHalfWidth,
      roadHalfWidth + curbWidth,
      CURB_Y,
      5,
      curbCutIndex,
    );

    const curbRight = createRoadBandWithCuts(
      `${road.id}::curb-right`,
      "curb",
      road,
      -roadHalfWidth - curbWidth,
      -roadHalfWidth,
      CURB_Y,
      5,
      curbCutIndex,
    );

    if (curbLeft) {
      curbs.push(curbLeft);
    }

    if (curbRight) {
      curbs.push(curbRight);
    }

    laneMarks.push(...createLaneMarkBands(road, laneMarkCutIndex));
  }

  for (const junction of topology.junctionsByKey.values()) {
    if (shouldCreateIntersectionPad(junction)) {
      asphalt.push(createIntersectionPadBand(junction));
    }
  }

  return {
    asphalt,
    sidewalks,
    curbs,
    laneMarks,
  };
}
