// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficRouter.types.ts
// Tipos do roteador de tráfego.

import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import type { HomeDriveRoadTopology } from "./homeDrive.roadTopology";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

export type HomeDriveTrafficRoutableVehicle = Pick<
  HomeDriveTrafficVehicle,
  | "id"
  | "segmentId"
  | "roadId"
  | "segmentIndex"
  | "t"
  | "directionSign"
  | "laneIndex"
  | "laneOffsetMeters"
> &
  Readonly<{
    speedMps?: number;
    previousSegmentId?: string | null;
    routeSeed?: number;
  }>;

export type HomeDriveTrafficRoadStepInput = Readonly<{
  roads: readonly HomeDriveGeneratedRoadSegment[];
  topology?: HomeDriveRoadTopology;
  vehicle: HomeDriveTrafficRoutableVehicle;
  currentRoad: HomeDriveGeneratedRoadSegment;
  nextT: number;
  routeSeed?: number;
}>;

export type HomeDriveTrafficRoadStep = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  roadId: string;
  segmentId: string;
  segmentIndex: number;
  previousSegmentId: string | null;
  t: number;
  directionSign: HomeDriveTrafficDirectionSign;
  laneIndex: number;
  laneOffsetMeters: number;
  routed: boolean;
}>;
