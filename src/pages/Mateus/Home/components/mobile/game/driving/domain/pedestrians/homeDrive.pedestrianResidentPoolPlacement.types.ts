// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolPlacement.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianResidentPoolConfig,
  HomeDrivePedestrianResidentPoolSlot,
} from "./homeDrive.pedestrianResidentPool.types";

export type HomeDrivePedestrianResidentPoolPlacementOptions = Readonly<{
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  seed: number;
  config: HomeDrivePedestrianResidentPoolConfig;
}>;

export type HomeDrivePedestrianResidentPoolPlacementResult = Readonly<{
  id: string;
  slots: readonly HomeDrivePedestrianResidentPoolSlot[];
  frontSlotCount: number;
  farSlotCount: number;
  horizonSlotCount: number;
}>;
