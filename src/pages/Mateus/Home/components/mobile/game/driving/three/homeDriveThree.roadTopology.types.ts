// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadTopology.types.ts

import type {
	HomeDriveGeneratedRoadSegment,
	HomeDriveWorldPosition,
} from "../domain/homeDrive.worldMap.types";

export type HomeDriveThreeRoadEndpointSide = "from" | "to";

export type HomeDriveThreeRoadPriority = Readonly<{
  score: number;
  kindScore: number;
  widthScore: number;
  tagScore: number;
}>;

export type HomeDriveThreeRoadEndpointRef = Readonly<{
  key: string;
  side: HomeDriveThreeRoadEndpointSide;
  road: HomeDriveGeneratedRoadSegment;
  position: HomeDriveWorldPosition;
  directionAwayFromJunction: Readonly<{
    x: number;
    z: number;
  }>;
  priority: HomeDriveThreeRoadPriority;
}>;

export type HomeDriveThreeRoadThroughRef = Readonly<{
  key: string;
  road: HomeDriveGeneratedRoadSegment;
  nearestPoint: HomeDriveWorldPosition;
  distanceMeters: number;
  priority: HomeDriveThreeRoadPriority;
}>;

export type HomeDriveThreeRoadJunctionType =
  | "terminal"
  | "continuation"
  | "t-junction"
  | "cross-junction"
  | "complex";

export type HomeDriveThreeRoadJunction = Readonly<{
  key: string;
  position: HomeDriveWorldPosition;
  endpoints: readonly HomeDriveThreeRoadEndpointRef[];
  throughRoads: readonly HomeDriveThreeRoadThroughRef[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  type: HomeDriveThreeRoadJunctionType;
  dominantRoad: HomeDriveGeneratedRoadSegment | null;
  dominantPriority: HomeDriveThreeRoadPriority | null;
  maxRoadWidth: number;
  operationalHalfWidth: number;
}>;

export type HomeDriveThreeRoadTopology = Readonly<{
  junctionsByKey: ReadonlyMap<string, HomeDriveThreeRoadJunction>;
  endpointJunctionsByCutKey: ReadonlyMap<string, HomeDriveThreeRoadJunction>;
}>;
