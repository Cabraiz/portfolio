// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPerformance.profiles.ts

import type {
  HomeDrivePedestrianPerformanceProfileKey,
  HomeDrivePedestrianPerformanceProfile,
} from "./homeDrive.pedestrianPerformance.types";

export const HOME_DRIVE_PEDESTRIAN_PERFORMANCE: Readonly<

  Record<HomeDrivePedestrianPerformanceProfileKey, HomeDrivePedestrianPerformanceProfile>

> = Object.freeze({

  portrait: Object.freeze({

    pedestrianDebugLogPopulationPipeline: false,

    pedestrianBootPreloadEnabled: true,
    pedestrianBootPreloadSteps: 10,
    pedestrianBootPreloadStepSeconds: 1 / 20,



    pedestrianResidentPoolEnabled: true,

    pedestrianResidentPoolSize: 72,

    pedestrianResidentPoolMinFrontAgents: 24,

    pedestrianResidentPoolMinFarAgents: 32,

    pedestrianResidentPoolTeleportMinForwardMeters: 240,

    pedestrianResidentPoolTeleportMaxForwardMeters: 680,

    pedestrianResidentPoolTeleportHorizonMaxForwardMeters: 920,

    pedestrianResidentPoolRecycleBehindMeters: 110,

    pedestrianResidentPoolRecycleSideMeters: 520,

    pedestrianResidentPoolMaxTeleportsPerTick: 24,

    pedestrianResidentPoolMaxInitialTeleports: 72,

    pedestrianResidentPoolProtectVisibleConeMeters: 220,

    pedestrianResidentPoolProtectVisibleConeRadians: 0.72,

    pedestrianResidentPoolDebug: false,
    pedestrianResidentPoolLockAfterBoot: true,
    pedestrianResidentPoolAllowRuntimeExpansion: false,



    pedestrianResidentPoolViewportOccupancyEnabled: true,

    pedestrianResidentPoolForceAllAgentsIntoViewport: true,

    pedestrianResidentPoolVisibleNearMinMeters: 42,

    pedestrianResidentPoolVisibleNearMaxMeters: 120,

    pedestrianResidentPoolVisibleNearCount: 16,

    pedestrianResidentPoolVisibleMidMinMeters: 118,

    pedestrianResidentPoolVisibleMidMaxMeters: 250,

    pedestrianResidentPoolVisibleMidCount: 20,

    pedestrianResidentPoolVisibleFarMinMeters: 248,

    pedestrianResidentPoolVisibleFarMaxMeters: 430,

    pedestrianResidentPoolVisibleFarCount: 22,

    pedestrianResidentPoolSideMinForwardMeters: 70,

    pedestrianResidentPoolSideMaxForwardMeters: 380,

    pedestrianResidentPoolSideLateralMinMeters: 62,

    pedestrianResidentPoolSideLateralMaxMeters: 210,

    pedestrianResidentPoolSideCount: 14,

    pedestrianResidentPoolMaxViewportTeleportsPerTick: 72,

    pedestrianResidentPoolViewportMinSpacingMeters: 5.2,



    density: 1.0,

    maxRoads: 260,

    minRoadLengthMeters: 18,



    visibleRadiusMeters: 460,

    maxVisiblePedestrians: 96,

    fullDetailRadiusMeters: 460,

    mediumDetailRadiusMeters: 460,

    snapshotHz: 10,



    enableInstancedRig: false,

    enableBakedAnimation: false,

    maxFullReactPedestrians: 96,

    maxMediumReactPedestrians: 0,

    maxInstancedPedestrians: 0,

    instancedAnimationHzNear: 1,

    instancedAnimationHzFar: 1,

    instancedMatrixUpdateStride: 1,

    instancedMaxUpdatesPerFrame: 0,



    enablePedestrianRenderSeparation: true,

    pedestrianRenderSeparationCellSizeMeters: 1.35,

    pedestrianRenderSeparationMinMeters: 0.84,

    pedestrianRenderSeparationMaxOffsetMeters: 0.72,



    simulationHz: 10,

    activeSimulationRadiusMeters: 180,

    warmSimulationRadiusMeters: 440,

    warmTickModulo: 2,

    coldTickModulo: 6,



    populateRadiusMeters: 430,

  }),



  landscape: Object.freeze({

    pedestrianDebugLogPopulationPipeline: false,

    pedestrianBootPreloadEnabled: true,
    pedestrianBootPreloadSteps: 12,
    pedestrianBootPreloadStepSeconds: 1 / 20,



    pedestrianResidentPoolEnabled: true,

    pedestrianResidentPoolSize: 92,

    pedestrianResidentPoolMinFrontAgents: 30,

    pedestrianResidentPoolMinFarAgents: 40,

    pedestrianResidentPoolTeleportMinForwardMeters: 260,

    pedestrianResidentPoolTeleportMaxForwardMeters: 760,

    pedestrianResidentPoolTeleportHorizonMaxForwardMeters: 1080,

    pedestrianResidentPoolRecycleBehindMeters: 130,

    pedestrianResidentPoolRecycleSideMeters: 620,

    pedestrianResidentPoolMaxTeleportsPerTick: 30,

    pedestrianResidentPoolMaxInitialTeleports: 92,

    pedestrianResidentPoolProtectVisibleConeMeters: 260,

    pedestrianResidentPoolProtectVisibleConeRadians: 0.78,

    pedestrianResidentPoolDebug: false,
    pedestrianResidentPoolLockAfterBoot: true,
    pedestrianResidentPoolAllowRuntimeExpansion: false,



    pedestrianResidentPoolViewportOccupancyEnabled: true,

    pedestrianResidentPoolForceAllAgentsIntoViewport: true,

    pedestrianResidentPoolVisibleNearMinMeters: 44,

    pedestrianResidentPoolVisibleNearMaxMeters: 130,

    pedestrianResidentPoolVisibleNearCount: 20,

    pedestrianResidentPoolVisibleMidMinMeters: 130,

    pedestrianResidentPoolVisibleMidMaxMeters: 300,

    pedestrianResidentPoolVisibleMidCount: 26,

    pedestrianResidentPoolVisibleFarMinMeters: 300,

    pedestrianResidentPoolVisibleFarMaxMeters: 520,

    pedestrianResidentPoolVisibleFarCount: 28,

    pedestrianResidentPoolSideMinForwardMeters: 80,

    pedestrianResidentPoolSideMaxForwardMeters: 440,

    pedestrianResidentPoolSideLateralMinMeters: 70,

    pedestrianResidentPoolSideLateralMaxMeters: 260,

    pedestrianResidentPoolSideCount: 18,

    pedestrianResidentPoolMaxViewportTeleportsPerTick: 92,

    pedestrianResidentPoolViewportMinSpacingMeters: 5.4,



    density: 1.0,

    maxRoads: 340,

    minRoadLengthMeters: 18,



    visibleRadiusMeters: 560,

    maxVisiblePedestrians: 128,

    fullDetailRadiusMeters: 560,

    mediumDetailRadiusMeters: 560,

    snapshotHz: 10,



    enableInstancedRig: false,

    enableBakedAnimation: false,

    maxFullReactPedestrians: 128,

    maxMediumReactPedestrians: 0,

    maxInstancedPedestrians: 0,

    instancedAnimationHzNear: 1,

    instancedAnimationHzFar: 1,

    instancedMatrixUpdateStride: 1,

    instancedMaxUpdatesPerFrame: 0,



    enablePedestrianRenderSeparation: true,

    pedestrianRenderSeparationCellSizeMeters: 1.35,

    pedestrianRenderSeparationMinMeters: 0.84,

    pedestrianRenderSeparationMaxOffsetMeters: 0.72,



    simulationHz: 10,

    activeSimulationRadiusMeters: 220,

    warmSimulationRadiusMeters: 540,

    warmTickModulo: 2,

    coldTickModulo: 6,



    populateRadiusMeters: 520,

  }),

});
