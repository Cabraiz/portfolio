// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.geometry.ts

import {
  BufferGeometry,
  Float32BufferAttribute,
  type Material,
} from "three";

import {
  getHomeDriveWorldCenter,
  getHomeDriveWorldDepthMeters,
  getHomeDriveWorldWidthMeters,
} from "../domain/homeDrive.worldMap";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import type {
  HomeDriveThreeGroundBounds,
  HomeDriveThreeRoadBand,
  HomeDriveThreeRoadBandKind,
  HomeDriveThreeRoadNetworkMesh,
  HomeDriveThreeVector3Tuple,
} from "./homeDriveThree.types";

export {
  createHomeDriveThreeRoadRenderModel,
  type HomeDriveThreeRoadRenderModel,
} from "./homeDriveThree.roadBands";

const ROAD_Y = 0.045;
const SIDEWALK_Y = 0.06;
const CURB_Y = 0.082;
const LANE_MARK_Y = 0.095;

export function getHomeDriveThreeGroundBounds(): HomeDriveThreeGroundBounds {
  const center = getHomeDriveWorldCenter();

  return {
    center,
    width: getHomeDriveWorldWidthMeters(),
    depth: getHomeDriveWorldDepthMeters(),
  };
}

export function createQuadGeometry(
  points: readonly [
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
  ],
): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices = points.flat();

  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

export function createMergedQuadGeometry(
  bands: readonly HomeDriveThreeRoadBand[],
): BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (const band of bands) {
    const vertexOffset = vertices.length / 3;

    for (const point of band.points) {
      vertices.push(point[0], point[1], point[2]);
    }

    indices.push(
      vertexOffset,
      vertexOffset + 1,
      vertexOffset + 2,
      vertexOffset,
      vertexOffset + 2,
      vertexOffset + 3,
    );
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

function getBandMaterial(kind: HomeDriveThreeRoadBandKind): Material {
  switch (kind) {
    case "sidewalk-left":
    case "sidewalk-right":
      return HOME_DRIVE_THREE_MATERIALS.sidewalk;
    case "curb":
      return HOME_DRIVE_THREE_MATERIALS.curb;
    case "lane-mark":
      return HOME_DRIVE_THREE_MATERIALS.laneMark;
    case "asphalt":
    default:
      return HOME_DRIVE_THREE_MATERIALS.asphalt;
  }
}

function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
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

function getCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
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

function createRoadBand(
  id: string,
  kind: HomeDriveThreeRoadBandKind,
  road: HomeDriveGeneratedRoadSegment,
  innerOffsetMeters: number,
  outerOffsetMeters: number,
  y: number,
  renderOrder: number,
): HomeDriveThreeRoadBand {
  return {
    id,
    kind,
    roadId: road.roadId,
    segmentIndex: road.segmentIndex,
    material: getBandMaterial(kind),
    renderOrder,
    points: [
      offsetPoint(road.from, road.normal, innerOffsetMeters, y),
      offsetPoint(road.from, road.normal, outerOffsetMeters, y),
      offsetPoint(road.to, road.normal, outerOffsetMeters, y),
      offsetPoint(road.to, road.normal, innerOffsetMeters, y),
    ],
  };
}

function createLaneMarkBands(
  road: HomeDriveGeneratedRoadSegment,
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

    bands.push(
      createRoadBand(
        `${road.id}::lane-${laneIndex}`,
        "lane-mark",
        road,
        centerOffset - lineWidth / 2,
        centerOffset + lineWidth / 2,
        LANE_MARK_Y,
        7,
      ),
    );
  }

  return bands;
}

/**
 * Compatibilidade para imports antigos.
 *
 * A renderização nova do HomeDriveThreeRoadNetwork não usa mais esta função.
 * Ela continua aqui só para evitar quebra caso algum arquivo antigo ainda importe
 * createHomeDriveThreeRoadNetworkMesh.
 */
export function createHomeDriveThreeRoadNetworkMesh(
  road: HomeDriveGeneratedRoadSegment,
): HomeDriveThreeRoadNetworkMesh {
  const roadHalfWidth = Math.max(1.5, road.width / 2);
  const sidewalkWidth = getSidewalkWidthMeters(road);
  const curbWidth = getCurbWidthMeters(road);

  const asphalt = createRoadBand(
    `${road.id}::asphalt`,
    "asphalt",
    road,
    -roadHalfWidth,
    roadHalfWidth,
    ROAD_Y,
    3,
  );

  const sidewalkLeft = createRoadBand(
    `${road.id}::sidewalk-left`,
    "sidewalk-left",
    road,
    roadHalfWidth + curbWidth,
    roadHalfWidth + curbWidth + sidewalkWidth,
    SIDEWALK_Y,
    2,
  );

  const sidewalkRight = createRoadBand(
    `${road.id}::sidewalk-right`,
    "sidewalk-right",
    road,
    -roadHalfWidth - curbWidth - sidewalkWidth,
    -roadHalfWidth - curbWidth,
    SIDEWALK_Y,
    2,
  );

  const curbLeft = createRoadBand(
    `${road.id}::curb-left`,
    "curb",
    road,
    roadHalfWidth,
    roadHalfWidth + curbWidth,
    CURB_Y,
    5,
  );

  const curbRight = createRoadBand(
    `${road.id}::curb-right`,
    "curb",
    road,
    -roadHalfWidth - curbWidth,
    -roadHalfWidth,
    CURB_Y,
    5,
  );

  return {
    road,
    asphalt,
    sidewalks: [sidewalkLeft, sidewalkRight],
    curbs: [curbLeft, curbRight],
    laneMarks: createLaneMarkBands(road),
  };
}
