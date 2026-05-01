// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianWarmRing.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianWarmRingSectorKey =
  | "front"
  | "front-far"
  | "side"
  | "rear";

export type HomeDrivePedestrianWarmRingZone = Readonly<{
  zone: HomeDrivePedestrianSidewalkZone;
  zoneId: string;
  sectorKey: HomeDrivePedestrianWarmRingSectorKey;
  distanceMeters: number;
  forwardMeters: number;
  lateralMeters: number;
  score: number;
  visualPriority: number;
  prewarmWeight: number;
}>;

export type HomeDrivePedestrianWarmRingConfig = Readonly<{
  enabled?: boolean;
  activeCenter: HomeDriveVector2;
  activeHeadingRad?: number;
  activeSpeedMps?: number;
  elapsedSeconds?: number;

  baseRadiusMeters?: number;
  frontBiasMeters?: number;
  speedRadiusMultiplier?: number;
  sideRadiusMeters?: number;
  rearRadiusMeters?: number;
  maxZoneCount?: number;
  minZoneLengthMeters?: number;
}>;

export type HomeDrivePedestrianWarmRingSnapshot = Readonly<{
  id: string;
  enabled: boolean;
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;

  radiusMeters: number;
  frontRadiusMeters: number;
  sideRadiusMeters: number;
  rearRadiusMeters: number;

  warmZones: readonly HomeDrivePedestrianWarmRingZone[];
  warmZoneIds: readonly string[];
  sectorCounts: Readonly<Record<HomeDrivePedestrianWarmRingSectorKey, number>>;

  recommendedPopulateRadiusMeters: number;
  recommendedLocalZoneSearchRadiusMeters: number;
  recommendedKeepAliveRadiusMeters: number;
  recommendedSpawnBudgetBoost: number;
  recommendedVisualPrewarmRadiusMeters: number;
}>;
