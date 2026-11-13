// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.config.ts

import type {
  HomeDrivePedestrianResidentPoolConfig,
} from "./homeDrive.pedestrianResidentPool.types";
import type {
  HomeDrivePedestrianPopulationRuntimeOptions,
} from "./homeDrive.pedestrianPopulationRuntime.types";
import {
  DEFAULT_RESIDENT_POOL_TELEPORT_MIN_FORWARD_METERS,
  DEFAULT_RESIDENT_POOL_TELEPORT_MAX_FORWARD_METERS,
  DEFAULT_RESIDENT_POOL_TELEPORT_HORIZON_MAX_FORWARD_METERS,
  DEFAULT_RESIDENT_POOL_ENABLED,
  DEFAULT_RESIDENT_POOL_SIZE,
  DEFAULT_RESIDENT_POOL_MIN_FRONT_AGENTS,
  DEFAULT_RESIDENT_POOL_MIN_FAR_AGENTS,
  DEFAULT_RESIDENT_POOL_RECYCLE_BEHIND_METERS,
  DEFAULT_RESIDENT_POOL_RECYCLE_SIDE_METERS,
  DEFAULT_RESIDENT_POOL_MAX_TELEPORTS_PER_TICK,
  DEFAULT_RESIDENT_POOL_MAX_INITIAL_TELEPORTS,
  DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_METERS,
  DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_RADIANS,
  DEFAULT_RESIDENT_POOL_DEBUG,
  DEFAULT_VIEWPORT_OCCUPANCY_ENABLED,
  DEFAULT_FORCE_ALL_AGENTS_INTO_VIEWPORT,
  DEFAULT_VISIBLE_NEAR_MIN_METERS,
  DEFAULT_VISIBLE_NEAR_MAX_METERS,
  DEFAULT_VISIBLE_NEAR_COUNT,
  DEFAULT_VISIBLE_MID_MIN_METERS,
  DEFAULT_VISIBLE_MID_MAX_METERS,
  DEFAULT_VISIBLE_MID_COUNT,
  DEFAULT_VISIBLE_FAR_MIN_METERS,
  DEFAULT_VISIBLE_FAR_MAX_METERS,
  DEFAULT_VISIBLE_FAR_COUNT,
  DEFAULT_SIDE_MIN_FORWARD_METERS,
  DEFAULT_SIDE_MAX_FORWARD_METERS,
  DEFAULT_SIDE_LATERAL_MIN_METERS,
  DEFAULT_SIDE_LATERAL_MAX_METERS,
  DEFAULT_SIDE_COUNT,
  DEFAULT_MAX_VIEWPORT_TELEPORTS_PER_TICK,
  DEFAULT_VIEWPORT_MIN_SPACING_METERS,
  DEFAULT_RESIDENT_POOL_LOCK_AFTER_BOOT,
  DEFAULT_RESIDENT_POOL_ALLOW_RUNTIME_EXPANSION,
} from "./homeDrive.pedestrianPopulationRuntime.defaults";

function clamp(value: number, min: number, max: number): number {

  if (!Number.isFinite(value)) {

    return min;

  }



  return Math.max(min, Math.min(max, value));

}



function positiveInteger(value: number | undefined, fallback: number, min = 0): number {

  return Math.max(min, Math.floor(value ?? fallback));

}



export function resolveResidentPoolConfig(

  options: HomeDrivePedestrianPopulationRuntimeOptions = {},

): HomeDrivePedestrianResidentPoolConfig {

  const teleportMinForwardMeters = Math.max(

    64,

    options.pedestrianResidentPoolTeleportMinForwardMeters ??

      DEFAULT_RESIDENT_POOL_TELEPORT_MIN_FORWARD_METERS,

  );

  const teleportMaxForwardMeters = Math.max(

    teleportMinForwardMeters + 60,

    options.pedestrianResidentPoolTeleportMaxForwardMeters ??

      DEFAULT_RESIDENT_POOL_TELEPORT_MAX_FORWARD_METERS,

  );

  const teleportHorizonMaxForwardMeters = Math.max(

    teleportMaxForwardMeters + 80,

    options.pedestrianResidentPoolTeleportHorizonMaxForwardMeters ??

      DEFAULT_RESIDENT_POOL_TELEPORT_HORIZON_MAX_FORWARD_METERS,

  );



  return {

    enabled:

      (options.enabled ?? options.populationEnabled ?? true) &&

      (options.pedestrianResidentPoolEnabled ?? DEFAULT_RESIDENT_POOL_ENABLED),

    size: positiveInteger(

      options.pedestrianResidentPoolSize,

      DEFAULT_RESIDENT_POOL_SIZE,

      8,

    ),

    minFrontAgents: positiveInteger(

      options.pedestrianResidentPoolMinFrontAgents,

      DEFAULT_RESIDENT_POOL_MIN_FRONT_AGENTS,

    ),

    minFarAgents: positiveInteger(

      options.pedestrianResidentPoolMinFarAgents,

      DEFAULT_RESIDENT_POOL_MIN_FAR_AGENTS,

    ),

    teleportMinForwardMeters,

    teleportMaxForwardMeters,

    teleportHorizonMaxForwardMeters,

    recycleBehindMeters: Math.max(

      32,

      options.pedestrianResidentPoolRecycleBehindMeters ??

        DEFAULT_RESIDENT_POOL_RECYCLE_BEHIND_METERS,

    ),

    recycleSideMeters: Math.max(

      120,

      options.pedestrianResidentPoolRecycleSideMeters ??

        DEFAULT_RESIDENT_POOL_RECYCLE_SIDE_METERS,

    ),

    maxTeleportsPerTick: positiveInteger(

      options.pedestrianResidentPoolMaxTeleportsPerTick,

      DEFAULT_RESIDENT_POOL_MAX_TELEPORTS_PER_TICK,

      1,

    ),

    maxInitialTeleports: positiveInteger(

      options.pedestrianResidentPoolMaxInitialTeleports,

      DEFAULT_RESIDENT_POOL_MAX_INITIAL_TELEPORTS,

      1,

    ),

    protectVisibleConeMeters: Math.max(

      60,

      options.pedestrianResidentPoolProtectVisibleConeMeters ??

        DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_METERS,

    ),

    protectVisibleConeRadians: clamp(

      options.pedestrianResidentPoolProtectVisibleConeRadians ??

        DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_RADIANS,

      0.12,

      Math.PI * 0.92,

    ),

    debug: options.pedestrianResidentPoolDebug ?? DEFAULT_RESIDENT_POOL_DEBUG,

    viewportOccupancyEnabled:

      options.pedestrianResidentPoolViewportOccupancyEnabled ??

      DEFAULT_VIEWPORT_OCCUPANCY_ENABLED,

    viewportForceAllAgentsIntoViewport:

      options.pedestrianResidentPoolForceAllAgentsIntoViewport ??

      DEFAULT_FORCE_ALL_AGENTS_INTO_VIEWPORT,

    viewportVisibleNearMinMeters:

      options.pedestrianResidentPoolVisibleNearMinMeters ??

      DEFAULT_VISIBLE_NEAR_MIN_METERS,

    viewportVisibleNearMaxMeters:

      options.pedestrianResidentPoolVisibleNearMaxMeters ??

      DEFAULT_VISIBLE_NEAR_MAX_METERS,

    viewportVisibleNearCount: positiveInteger(

      options.pedestrianResidentPoolVisibleNearCount,

      DEFAULT_VISIBLE_NEAR_COUNT,

    ),

    viewportVisibleMidMinMeters:

      options.pedestrianResidentPoolVisibleMidMinMeters ??

      DEFAULT_VISIBLE_MID_MIN_METERS,

    viewportVisibleMidMaxMeters:

      options.pedestrianResidentPoolVisibleMidMaxMeters ??

      DEFAULT_VISIBLE_MID_MAX_METERS,

    viewportVisibleMidCount: positiveInteger(

      options.pedestrianResidentPoolVisibleMidCount,

      DEFAULT_VISIBLE_MID_COUNT,

    ),

    viewportVisibleFarMinMeters:

      options.pedestrianResidentPoolVisibleFarMinMeters ??

      DEFAULT_VISIBLE_FAR_MIN_METERS,

    viewportVisibleFarMaxMeters:

      options.pedestrianResidentPoolVisibleFarMaxMeters ??

      DEFAULT_VISIBLE_FAR_MAX_METERS,

    viewportVisibleFarCount: positiveInteger(

      options.pedestrianResidentPoolVisibleFarCount,

      DEFAULT_VISIBLE_FAR_COUNT,

    ),

    viewportSideMinForwardMeters:

      options.pedestrianResidentPoolSideMinForwardMeters ??

      DEFAULT_SIDE_MIN_FORWARD_METERS,

    viewportSideMaxForwardMeters:

      options.pedestrianResidentPoolSideMaxForwardMeters ??

      DEFAULT_SIDE_MAX_FORWARD_METERS,

    viewportSideLateralMinMeters:

      options.pedestrianResidentPoolSideLateralMinMeters ??

      DEFAULT_SIDE_LATERAL_MIN_METERS,

    viewportSideLateralMaxMeters:

      options.pedestrianResidentPoolSideLateralMaxMeters ??

      DEFAULT_SIDE_LATERAL_MAX_METERS,

    viewportSideCount: positiveInteger(

      options.pedestrianResidentPoolSideCount,

      DEFAULT_SIDE_COUNT,

    ),

    viewportMaxTeleportsPerTick: positiveInteger(

      options.pedestrianResidentPoolMaxViewportTeleportsPerTick,

      DEFAULT_MAX_VIEWPORT_TELEPORTS_PER_TICK,

      1,

    ),

    viewportMinSpacingMeters: Math.max(

      0,

      options.pedestrianResidentPoolViewportMinSpacingMeters ??

        DEFAULT_VIEWPORT_MIN_SPACING_METERS,

    ),

    lockAfterBoot:
      options.pedestrianResidentPoolLockAfterBoot ??
      DEFAULT_RESIDENT_POOL_LOCK_AFTER_BOOT,
    allowRuntimeExpansion:
      options.pedestrianResidentPoolAllowRuntimeExpansion ??
      DEFAULT_RESIDENT_POOL_ALLOW_RUNTIME_EXPANSION,

  };

}
