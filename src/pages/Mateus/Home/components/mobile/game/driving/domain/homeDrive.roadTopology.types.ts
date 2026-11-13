// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.types.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadVector,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";

export type HomeDriveRoadEndpointSide = "from" | "to";

export type HomeDriveRoadPriority = Readonly<{
  score: number;
  kindScore: number;
  widthScore: number;
  tagScore: number;
}>;

export type HomeDriveRoadEndpointRef = Readonly<{
  key: string;
  cutKey: string;
  side: HomeDriveRoadEndpointSide;
  road: HomeDriveGeneratedRoadSegment;
  position: HomeDriveWorldPosition;
  directionAwayFromJunction: HomeDriveRoadVector;
  priority: HomeDriveRoadPriority;
}>;

export type HomeDriveRoadThroughRef = Readonly<{
  key: string;
  road: HomeDriveGeneratedRoadSegment;
  nearestPoint: HomeDriveWorldPosition;
  t: number;
  distanceMeters: number;
  priority: HomeDriveRoadPriority;
}>;

export type HomeDriveRoadJunctionType =
  | "terminal"
  | "continuation"
  | "t-junction"
  | "cross-junction"
  | "complex";

export type HomeDriveRoadJunction = Readonly<{
  key: string;
  position: HomeDriveWorldPosition;
  endpoints: readonly HomeDriveRoadEndpointRef[];
  throughRoads: readonly HomeDriveRoadThroughRef[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  type: HomeDriveRoadJunctionType;
  dominantRoad: HomeDriveGeneratedRoadSegment | null;
  dominantPriority: HomeDriveRoadPriority | null;
  maxRoadWidth: number;
  operationalHalfWidth: number;
}>;

export type HomeDriveRoadTopologyConnectionKind =
  | "endpoint"
  | "through"
  | "continuation"
  | "turn";

export type HomeDriveRoadTopologyConnection = Readonly<{
  id: string;
  junctionKey: string;

  fromSegmentId: string;
  fromRoadId: string;
  fromEndpointSide: HomeDriveRoadEndpointSide;
  fromEndpointCutKey: string;

  toSegmentId: string;
  toRoadId: string;
  toRoad: HomeDriveGeneratedRoadSegment;
  toEndpointSide: HomeDriveRoadEndpointSide | null;
  toT: number;
  toDirectionSign: 1 | -1;

  turnDot: number;
  score: number;
  kind: HomeDriveRoadTopologyConnectionKind;
}>;

export type HomeDriveRoadTopology = Readonly<{
  segmentsById: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>;
  endpointsByKey: ReadonlyMap<string, readonly HomeDriveRoadEndpointRef[]>;
  junctionsByKey: ReadonlyMap<string, HomeDriveRoadJunction>;
  endpointJunctionsByCutKey: ReadonlyMap<string, HomeDriveRoadJunction>;
  connectionsByEndpointCutKey: ReadonlyMap<
    string,
    readonly HomeDriveRoadTopologyConnection[]
  >;
  connectionsBySegmentId: ReadonlyMap<
    string,
    readonly HomeDriveRoadTopologyConnection[]
  >;
}>;
