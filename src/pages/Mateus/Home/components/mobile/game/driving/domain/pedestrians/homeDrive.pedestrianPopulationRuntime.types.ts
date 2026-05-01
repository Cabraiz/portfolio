// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveCrosswalkRuntimeState } from "../crosswalks";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianSpawnReservoirSnapshot,
  HomeDrivePedestrianStreamingSectorCount,
} from "./homeDrive.pedestrianStreaming.types";

export type HomeDrivePedestrianPopulationRuntime = Readonly<{
  lastPopulateCenter: HomeDriveVector2 | null;
  lastPopulateAtSeconds: number;
  generationSerial: number;
  lastAgentSerial: number;
  activeZoneIds: readonly string[];
  spawnedAgentIds: readonly string[];
  lastNearAgentCount: number;
  lastSpawnedAgentCount: number;
  lastPrunedAgentCount: number;

  /** Último plano de streaming direcional executado. */
  lastPopulateHeadingRad: number | null;
  lastPopulateSpeedMps: number;
  lastStreamingPlanId: string | null;
  lastSectorCounts: readonly HomeDrivePedestrianStreamingSectorCount[];
  lastCrosswalkDemandCount: number;
  spawnReservoir?: HomeDrivePedestrianSpawnReservoirSnapshot;
}>;

export type HomeDrivePedestrianPopulationRuntimeOptions = Readonly<{
  activeCenter?: HomeDriveVector2;
  activeHeadingRad?: number;
  activeSpeedMps?: number;
  crosswalks?: HomeDriveCrosswalkRuntimeState;

  populateRadiusMeters?: number;
  repopulateDistanceMeters?: number;
  repopulateCooldownSeconds?: number;
  minPedestriansNearPlayer?: number;
  maxActivePedestrians?: number;
  maxSpawnPerRefresh?: number;
  keepAliveRadiusMeters?: number;
  localZoneSearchRadiusMeters?: number;

  frontLookaheadMeters?: number;
  frontLookaheadSpeedMultiplier?: number;
  frontFarRadiusMeters?: number;
  sideRadiusMeters?: number;
  rearRadiusMeters?: number;
  minFrontPedestrians?: number;
  minFarFrontPedestrians?: number;
  minSideSectorPedestrians?: number;
  minRearBufferPedestrians?: number;
  minCrosswalkPedestrians?: number;
  maxSpawnPerSectorRefresh?: number;
  maxCrosswalkSpawnPerRefresh?: number;
  crosswalkSearchRadiusMeters?: number;

  density?: number;
  seed?: number;
  forceRepopulate?: boolean;
  enabled?: boolean;
}>;

export type HomeDrivePedestrianPopulationRuntimeInput = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  populationRuntime?: HomeDrivePedestrianPopulationRuntime;
  elapsedSeconds: number;
  seed: number;
  options?: HomeDrivePedestrianPopulationRuntimeOptions;
}>;

export type HomeDrivePedestrianPopulationRuntimeResult = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  populationRuntime: HomeDrivePedestrianPopulationRuntime;
  didRepopulate: boolean;
  didPrune: boolean;
}>;

export type HomeDriveLocalPedestrianSpawnerOptions = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];

  activeCenter: HomeDriveVector2;
  activeHeadingRad?: number;
  activeSpeedMps?: number;
  crosswalks?: HomeDriveCrosswalkRuntimeState;

  elapsedSeconds: number;
  seed: number;
  generationSerial: number;
  lastAgentSerial: number;
  spawnReservoir?: HomeDrivePedestrianSpawnReservoirSnapshot;

  density: number;
  populateRadiusMeters: number;
  localZoneSearchRadiusMeters: number;
  minPedestriansNearPlayer: number;
  maxSpawnPerRefresh: number;
  maxActivePedestrians: number;

  frontLookaheadMeters?: number;
  frontLookaheadSpeedMultiplier?: number;
  frontFarRadiusMeters?: number;
  sideRadiusMeters?: number;
  rearRadiusMeters?: number;
  minFrontPedestrians?: number;
  minFarFrontPedestrians?: number;
  minSideSectorPedestrians?: number;
  minRearBufferPedestrians?: number;
  minCrosswalkPedestrians?: number;
  maxSpawnPerSectorRefresh?: number;
  maxCrosswalkSpawnPerRefresh?: number;
  crosswalkSearchRadiusMeters?: number;
}>;

export type HomeDriveLocalPedestrianSpawnerResult = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  activeZoneIds: readonly string[];
  nearAgentCount: number;
  spawnedAgentCount: number;
  nextAgentSerial: number;

  streamingPlanId: string | null;
  streamingSectorCounts: readonly HomeDrivePedestrianStreamingSectorCount[];
  crosswalkDemandCount: number;
  spawnReservoir?: HomeDrivePedestrianSpawnReservoirSnapshot;
}>;
