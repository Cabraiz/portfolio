// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.types.ts

import type { Material, Vector3Tuple } from "three";

import type {
  HomeDriveTerrainObject,
  HomeDriveVector2,
} from "../domain/homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../domain/homeDrive.worldMap.types";

export type HomeDriveThreeVector3Tuple = Vector3Tuple;

export type HomeDriveThreeRoadBandKind =
  | "asphalt"
  | "sidewalk-left"
  | "sidewalk-right"
  | "lane-mark"
  | "curb";

export type HomeDriveThreeRoadBand = Readonly<{
  id: string;
  kind: HomeDriveThreeRoadBandKind;
  roadId: string;
  segmentIndex: number;
  points: readonly [
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
    HomeDriveThreeVector3Tuple,
  ];
  material: Material;
  renderOrder: number;
}>;

export type HomeDriveThreeRoadNetworkMesh = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  asphalt: HomeDriveThreeRoadBand;
  sidewalks: readonly HomeDriveThreeRoadBand[];
  curbs: readonly HomeDriveThreeRoadBand[];
  laneMarks: readonly HomeDriveThreeRoadBand[];
}>;

export type HomeDriveThreeGroundBounds = Readonly<{
  center: HomeDriveVector2;
  width: number;
  depth: number;
}>;

export type HomeDriveThreeWorldObjectProps = Readonly<{
  object: HomeDriveTerrainObject;
}>;

export type HomeDriveThreeCameraConfig = Readonly<{
  heightMeters: number;
  lookAheadMeters: number;
  pitchOffsetMeters: number;
  fov: number;
  near: number;
  far: number;
}>;
