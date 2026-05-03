// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.types.ts



import type { HomeDriveVector2 } from "../homeDrive.types";

import type { HomeDrivePedestrianOrchestratorDiagnostics, HomeDrivePedestrianOrchestratorRuntime } from "./homeDrive.pedestrianOrchestrator.types";

import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";

import type { HomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime.types";

import type { HomeDrivePedestrianBootPreloadDiagnostics } from "./homeDrive.pedestrianBootPreload.types";

import type {

  HomeDrivePedestrianAgent,

  HomeDrivePedestrianSidewalkZone,

} from "./homeDrive.pedestrians.types";



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

  lastRelocatedAgentCount: number;

  lastPopulateHeadingRad: number | null;

  lastPopulateSpeedMps: number;

  residentPoolRuntime?: HomeDrivePedestrianResidentPoolRuntime;

  residentPoolDiagnostics?: HomeDrivePedestrianResidentPoolDiagnostics;

  orchestratorRuntime?: HomeDrivePedestrianOrchestratorRuntime;

  orchestratorDiagnostics?: HomeDrivePedestrianOrchestratorDiagnostics;

  bootPreloadDiagnostics?: HomeDrivePedestrianBootPreloadDiagnostics;

}>;



export type HomeDrivePedestrianPopulationRuntimeOptions = Readonly<{

  enabled?: boolean;

  populationEnabled?: boolean;

  seed?: number;

  forceRepopulate?: boolean;



  activeCenter?: HomeDriveVector2;

  activeHeadingRad?: number;

  activeSpeedMps?: number;



  populateRadiusMeters?: number;

  density?: number;



  pedestrianResidentPoolEnabled?: boolean;

  pedestrianResidentPoolSize?: number;

  pedestrianResidentPoolMinFrontAgents?: number;

  pedestrianResidentPoolMinFarAgents?: number;

  pedestrianResidentPoolTeleportMinForwardMeters?: number;

  pedestrianResidentPoolTeleportMaxForwardMeters?: number;

  pedestrianResidentPoolTeleportHorizonMaxForwardMeters?: number;

  pedestrianResidentPoolRecycleBehindMeters?: number;

  pedestrianResidentPoolRecycleSideMeters?: number;

  pedestrianResidentPoolMaxTeleportsPerTick?: number;

  pedestrianResidentPoolMaxInitialTeleports?: number;

  pedestrianResidentPoolProtectVisibleConeMeters?: number;

  pedestrianResidentPoolProtectVisibleConeRadians?: number;

  pedestrianResidentPoolDebug?: boolean;



  pedestrianResidentPoolViewportOccupancyEnabled?: boolean;

  pedestrianResidentPoolForceAllAgentsIntoViewport?: boolean;

  pedestrianResidentPoolVisibleNearMinMeters?: number;

  pedestrianResidentPoolVisibleNearMaxMeters?: number;

  pedestrianResidentPoolVisibleNearCount?: number;

  pedestrianResidentPoolVisibleMidMinMeters?: number;

  pedestrianResidentPoolVisibleMidMaxMeters?: number;

  pedestrianResidentPoolVisibleMidCount?: number;

  pedestrianResidentPoolVisibleFarMinMeters?: number;

  pedestrianResidentPoolVisibleFarMaxMeters?: number;

  pedestrianResidentPoolVisibleFarCount?: number;

  pedestrianResidentPoolSideMinForwardMeters?: number;

  pedestrianResidentPoolSideMaxForwardMeters?: number;

  pedestrianResidentPoolSideLateralMinMeters?: number;

  pedestrianResidentPoolSideLateralMaxMeters?: number;

  pedestrianResidentPoolSideCount?: number;

  pedestrianResidentPoolMaxViewportTeleportsPerTick?: number;

  pedestrianResidentPoolViewportMinSpacingMeters?: number;

  pedestrianResidentPoolLockAfterBoot?: boolean;
  pedestrianResidentPoolAllowRuntimeExpansion?: boolean;

}>;



export type HomeDrivePedestrianPopulationRuntimeInput = Readonly<{

  agents: readonly HomeDrivePedestrianAgent[];

  zones: readonly HomeDrivePedestrianSidewalkZone[];

  seed: number;

  elapsedSeconds: number;

  populationRuntime?: HomeDrivePedestrianPopulationRuntime;

  options?: HomeDrivePedestrianPopulationRuntimeOptions;

}>;



export type HomeDrivePedestrianPopulationRuntimeResult = Readonly<{

  agents: readonly HomeDrivePedestrianAgent[];

  populationRuntime: HomeDrivePedestrianPopulationRuntime;

  didRepopulate: boolean;

  didPrune: boolean;

}>;



