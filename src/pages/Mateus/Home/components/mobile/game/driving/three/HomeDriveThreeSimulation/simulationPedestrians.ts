// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation/simulationPedestrians.ts
// Passo dos pedestres e quadro visual de impacto.

import {
  syncHomeDriveCrosswalkOccupanciesFromPedestrians,
  type HomeDriveCrosswalkRuntimeState,
} from "../../domain/crosswalks";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  tickHomeDrivePedestrianImpactAgents,
  tickHomeDrivePedestrians,
  type HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import type {
  HomeDrivePedestrianPerformanceProfile,
} from "../../domain/pedestrians/homeDrive.pedestrianPerformance";

import { FIXED_STEP_SECONDS, clampNumber } from "./simulationShared";
import type { HomeDriveMutableRef } from "./simulationShared";

export function tickPedestriansStep(

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

  crosswalksRef:

    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>

    | undefined,

  runtime: HomeDriveRuntimeState,

  deltaSeconds: number,

  tickIndex: number,

  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile,

): void {

  if (!pedestriansRef) {

    return;

  }


  pedestriansRef.current = tickHomeDrivePedestrians(

    pedestriansRef.current,

    deltaSeconds,

    {

      maxDeltaSeconds: deltaSeconds,

      simulationTimeSeconds: runtime.elapsedSeconds,

      crosswalks: crosswalksRef?.current,

      activeCenter: runtime.car.position,

      activeHeadingRad: runtime.car.headingRad,

      activeSpeedMps: runtime.car.speedMps,

      activeRadiusMeters: pedestrianPerformance?.activeSimulationRadiusMeters,

      warmRadiusMeters: pedestrianPerformance?.warmSimulationRadiusMeters,

      warmTickModulo: pedestrianPerformance?.warmTickModulo,

      coldTickModulo: pedestrianPerformance?.coldTickModulo,

      tickIndex,

      density: pedestrianPerformance?.density,

      seed: 7429,

      populateRadiusMeters: pedestrianPerformance?.populateRadiusMeters,

      pedestrianResidentPoolEnabled:

        pedestrianPerformance?.pedestrianResidentPoolEnabled,

      pedestrianResidentPoolSize:

        pedestrianPerformance?.pedestrianResidentPoolSize,

      pedestrianResidentPoolMinFrontAgents:

        pedestrianPerformance?.pedestrianResidentPoolMinFrontAgents,

      pedestrianResidentPoolMinFarAgents:

        pedestrianPerformance?.pedestrianResidentPoolMinFarAgents,

      pedestrianResidentPoolTeleportMinForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportMinForwardMeters,

      pedestrianResidentPoolTeleportMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportMaxForwardMeters,

      pedestrianResidentPoolTeleportHorizonMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportHorizonMaxForwardMeters,

      pedestrianResidentPoolRecycleBehindMeters:

        pedestrianPerformance?.pedestrianResidentPoolRecycleBehindMeters,

      pedestrianResidentPoolRecycleSideMeters:

        pedestrianPerformance?.pedestrianResidentPoolRecycleSideMeters,

      pedestrianResidentPoolMaxTeleportsPerTick:

        pedestrianPerformance?.pedestrianResidentPoolMaxTeleportsPerTick,

      pedestrianResidentPoolMaxInitialTeleports:

        pedestrianPerformance?.pedestrianResidentPoolMaxInitialTeleports,

      pedestrianResidentPoolProtectVisibleConeMeters:

        pedestrianPerformance?.pedestrianResidentPoolProtectVisibleConeMeters,

      pedestrianResidentPoolProtectVisibleConeRadians:

        pedestrianPerformance?.pedestrianResidentPoolProtectVisibleConeRadians,

      pedestrianResidentPoolDebug:

        pedestrianPerformance?.pedestrianResidentPoolDebug,

      pedestrianResidentPoolViewportOccupancyEnabled:

        pedestrianPerformance?.pedestrianResidentPoolViewportOccupancyEnabled,

      pedestrianResidentPoolForceAllAgentsIntoViewport:

        pedestrianPerformance?.pedestrianResidentPoolForceAllAgentsIntoViewport,

      pedestrianResidentPoolVisibleNearMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearMinMeters,

      pedestrianResidentPoolVisibleNearMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearMaxMeters,

      pedestrianResidentPoolVisibleNearCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearCount,

      pedestrianResidentPoolVisibleMidMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidMinMeters,

      pedestrianResidentPoolVisibleMidMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidMaxMeters,

      pedestrianResidentPoolVisibleMidCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidCount,

      pedestrianResidentPoolVisibleFarMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarMinMeters,

      pedestrianResidentPoolVisibleFarMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarMaxMeters,

      pedestrianResidentPoolVisibleFarCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarCount,

      pedestrianResidentPoolSideMinForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideMinForwardMeters,

      pedestrianResidentPoolSideMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideMaxForwardMeters,

      pedestrianResidentPoolSideLateralMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideLateralMinMeters,

      pedestrianResidentPoolSideLateralMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideLateralMaxMeters,

      pedestrianResidentPoolSideCount:

        pedestrianPerformance?.pedestrianResidentPoolSideCount,

      pedestrianResidentPoolMaxViewportTeleportsPerTick:

        pedestrianPerformance?.pedestrianResidentPoolMaxViewportTeleportsPerTick,

      pedestrianResidentPoolViewportMinSpacingMeters:

        pedestrianPerformance?.pedestrianResidentPoolViewportMinSpacingMeters,
      pedestrianResidentPoolLockAfterBoot:

        pedestrianPerformance?.pedestrianResidentPoolLockAfterBoot,
      pedestrianResidentPoolAllowRuntimeExpansion:

        pedestrianPerformance?.pedestrianResidentPoolAllowRuntimeExpansion,

      populationEnabled: true,

    },

  );


  if (crosswalksRef) {

    crosswalksRef.current = syncHomeDriveCrosswalkOccupanciesFromPedestrians(

      crosswalksRef.current,

      pedestriansRef.current.agents,

    );

  }

}


export function tickPedestrianImpactVisualFrame(

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

  runtime: HomeDriveRuntimeState,

  frameRemainderSeconds: number,

): void {

  if (!pedestriansRef || pedestriansRef.current.agents.length <= 0) {

    return;

  }

  const visualTimeSeconds =

    runtime.elapsedSeconds + clampNumber(frameRemainderSeconds, 0, FIXED_STEP_SECONDS);

  const nextAgents = tickHomeDrivePedestrianImpactAgents(

    pedestriansRef.current.agents,

    visualTimeSeconds,

  );

  pedestriansRef.current = {

    ...pedestriansRef.current,

    agents: nextAgents,

    elapsedSeconds: Math.max(

      pedestriansRef.current.elapsedSeconds,

      visualTimeSeconds,

    ),

  };

}
