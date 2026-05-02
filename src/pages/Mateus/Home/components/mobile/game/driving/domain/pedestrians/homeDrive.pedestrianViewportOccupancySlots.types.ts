// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportOccupancySlots.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianViewportOccupancyBandKey,
  HomeDrivePedestrianViewportOccupancyPlan,
} from "./homeDrive.pedestrianViewportOccupancy.types";
import type { HomeDrivePedestrianResidentPoolSlot } from "./homeDrive.pedestrianResidentPool.types";

export type HomeDrivePedestrianViewportOccupancySlot = HomeDrivePedestrianResidentPoolSlot & Readonly<{
  viewportBand: HomeDrivePedestrianViewportOccupancyBandKey;
}>;

export type HomeDrivePedestrianViewportOccupancySlotOptions = Readonly<{
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  seed: number;
  plan: HomeDrivePedestrianViewportOccupancyPlan;
}>;

export type HomeDrivePedestrianViewportOccupancySlotResult = Readonly<{
  id: string;
  slots: readonly HomeDrivePedestrianViewportOccupancySlot[];
  slotCount: number;
  slotCountByBand: Readonly<Record<HomeDrivePedestrianViewportOccupancyBandKey, number>>;
}>;
