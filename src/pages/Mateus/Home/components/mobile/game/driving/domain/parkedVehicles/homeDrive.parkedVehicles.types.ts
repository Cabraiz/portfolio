// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveVehicleModelKey,
  HomeDriveVehiclePaintKey,
} from "../vehicles";

export type HomeDriveParkedVehicleSide = -1 | 1;

export type HomeDriveParkedVehicleMode =
  | "curb-parallel"
  | "half-sidewalk"
  | "sidewalk-invasive"
  | "driveway-front"
  | "delivery-stop";

export type HomeDriveParkedVehicle = Readonly<{
  id: string;
  roadId: string;
  segmentId: string;
  segmentIndex: number;
  districtId: string;
  roadKind: string;

  modelKey: HomeDriveVehicleModelKey;
  paintKey: HomeDriveVehiclePaintKey;
  mode: HomeDriveParkedVehicleMode;

  position: HomeDriveVector2;
  headingRad: number;
  side: HomeDriveParkedVehicleSide;

  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;

  t: number;
  seed: number;
}>;

export type HomeDriveParkedVehicleRuntimeState = Readonly<{
  vehicles: readonly HomeDriveParkedVehicle[];
  seed: number;
}>;

export type HomeDriveParkedVehicleGenerationOptions = Readonly<{
  enabled?: boolean;
  maxVehicles?: number;
  density?: number;
  minRoadLengthMeters?: number;
  maxRoads?: number;
  seed?: number;
}>;

export type HomeDriveParkedVehicleQueryResult = Readonly<{
  vehicle: HomeDriveParkedVehicle;
  distanceMeters: number;
}>;
