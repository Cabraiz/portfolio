// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.plan.ts
// Plano de ocupação do viewport a partir da config do pool.

import {
  createHomeDrivePedestrianViewportOccupancyPlan,
} from "./homeDrive.pedestrianViewportOccupancy";
import type {
  HomeDrivePedestrianResidentPoolViewportRuntimeOptions,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.types";

export function createResidentViewportOccupancyPlan(
  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,
) {

  return createHomeDrivePedestrianViewportOccupancyPlan({

    enabled: options.config.viewportOccupancyEnabled ?? true,

    forceAllAgentsIntoViewport: options.config.viewportForceAllAgentsIntoViewport ?? false,

    maxTeleportsPerTick: Math.max(

      1,

      options.config.viewportMaxTeleportsPerTick ?? options.config.maxTeleportsPerTick,

    ),

    nearMinMeters: options.config.viewportVisibleNearMinMeters ?? 80,

    nearMaxMeters: options.config.viewportVisibleNearMaxMeters ?? 170,

    nearCount: options.config.viewportVisibleNearCount ?? Math.ceil(options.config.size * 0.22),

    midMinMeters: options.config.viewportVisibleMidMinMeters ?? 170,

    midMaxMeters: options.config.viewportVisibleMidMaxMeters ?? 340,

    midCount: options.config.viewportVisibleMidCount ?? Math.ceil(options.config.size * 0.28),

    farMinMeters: options.config.viewportVisibleFarMinMeters ?? 340,

    farMaxMeters: options.config.viewportVisibleFarMaxMeters ?? 520,

    farCount: options.config.viewportVisibleFarCount ?? Math.ceil(options.config.size * 0.28),

    sideMinForwardMeters: options.config.viewportSideMinForwardMeters ?? 110,

    sideMaxForwardMeters: options.config.viewportSideMaxForwardMeters ?? 520,

    sideLateralMinMeters: options.config.viewportSideLateralMinMeters ?? 52,

    sideLateralMaxMeters: options.config.viewportSideLateralMaxMeters ?? 260,

    sideCount: options.config.viewportSideCount ?? Math.max(0, options.config.size - Math.ceil(options.config.size * 0.78)),

    minSpacingMeters: options.config.viewportMinSpacingMeters ?? 5.5,

    debug: options.config.debug,

  });

}
