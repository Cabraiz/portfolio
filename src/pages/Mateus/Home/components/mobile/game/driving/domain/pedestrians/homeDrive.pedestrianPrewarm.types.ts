// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPrewarm.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import type { HomeDrivePedestrianWarmRingSnapshot } from "./homeDrive.pedestrianWarmRing.types";

export type HomeDrivePedestrianPrewarmOptions = Readonly<{
  enabled?: boolean;
  agents: readonly HomeDrivePedestrianAgent[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;

  populateRadiusMeters: number;
  localZoneSearchRadiusMeters: number;
  keepAliveRadiusMeters: number;
  maxSpawnPerRefresh: number;
  minPedestriansNearPlayer: number;

  prewarmFrames?: number;
  leadSeconds?: number;
  frontMeters?: number;
  minReadyPedestrians?: number;
  spawnBudgetMultiplier?: number;
  warmRingSnapshot?: HomeDrivePedestrianWarmRingSnapshot;
}>;

export type HomeDrivePedestrianPrewarmPlan = Readonly<{
  enabled: boolean;
  readyPedestrianCount: number;
  minReadyPedestrians: number;
  shouldForceRepopulate: boolean;
  effectivePopulateRadiusMeters: number;
  effectiveLocalZoneSearchRadiusMeters: number;
  effectiveKeepAliveRadiusMeters: number;
  effectiveMaxSpawnPerRefresh: number;
  effectiveMinPedestriansNearPlayer: number;
  effectiveFrontLookaheadMeters: number;
}>;
