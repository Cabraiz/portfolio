// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import { createHomeDriveLocalPedestrianAgents } from "./homeDrive.pedestrianLocalSpawner";
import { createHomeDrivePedestrianPrewarmPlan } from "./homeDrive.pedestrianPrewarm";
import { createHomeDrivePedestrianWarmRingSnapshot } from "./homeDrive.pedestrianWarmRing";
import { dedupeHomeDrivePedestrianAgentsById } from "./homeDrive.pedestrianIdentity";
import {
  countHomeDrivePedestrianSpatialItemsNear,
  createHomeDrivePedestrianAgentSpatialIndex,
} from "./homeDrive.pedestrianSpatialIndex";
import type {
  HomeDrivePedestrianPopulationRuntime,
  HomeDrivePedestrianPopulationRuntimeInput,
  HomeDrivePedestrianPopulationRuntimeOptions,
  HomeDrivePedestrianPopulationRuntimeResult,
} from "./homeDrive.pedestrianPopulationRuntime.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";

const DEFAULT_POPULATE_RADIUS_METERS = 430;
const DEFAULT_REPOPULATE_DISTANCE_METERS = 24;
const DEFAULT_REPOPULATE_COOLDOWN_SECONDS = 0.095;
const DEFAULT_MIN_PEDESTRIANS_NEAR_PLAYER = 210;
const DEFAULT_MAX_ACTIVE_PEDESTRIANS = 1960;
const DEFAULT_MAX_SPAWN_PER_REFRESH = 220;
const DEFAULT_DENSITY = 6.2;
const DEFAULT_FRONT_LOOKAHEAD_METERS = 840;
const DEFAULT_FRONT_LOOKAHEAD_SPEED_MULTIPLIER = 36;
const DEFAULT_MIN_FRONT_PEDESTRIANS = 96;
const DEFAULT_MIN_FAR_FRONT_PEDESTRIANS = 132;
const DEFAULT_MIN_SIDE_SECTOR_PEDESTRIANS = 46;
const DEFAULT_MIN_REAR_BUFFER_PEDESTRIANS = 20;
const DEFAULT_MIN_CROSSWALK_PEDESTRIANS = 34;
const DEFAULT_MAX_SPAWN_PER_SECTOR_REFRESH = 86;
const DEFAULT_MAX_CROSSWALK_SPAWN_PER_REFRESH = 58;
const DEFAULT_ENABLE_PEDESTRIAN_WARM_RING = true;
const DEFAULT_WARM_RING_BASE_RADIUS_METERS = 680;
const DEFAULT_WARM_RING_FRONT_BIAS_METERS = 620;
const DEFAULT_WARM_RING_SPEED_RADIUS_MULTIPLIER = 34;
const DEFAULT_WARM_RING_SIDE_RADIUS_METERS = 480;
const DEFAULT_WARM_RING_REAR_RADIUS_METERS = 180;
const DEFAULT_WARM_RING_MAX_ZONE_COUNT = 132;
const DEFAULT_PEDESTRIAN_PREWARM_ENABLED = true;
const DEFAULT_PEDESTRIAN_PREWARM_FRAMES = 12;
const DEFAULT_PEDESTRIAN_PREWARM_LEAD_SECONDS = 10.5;
const DEFAULT_PEDESTRIAN_PREWARM_FRONT_METERS = 2200;
const DEFAULT_PEDESTRIAN_PREWARM_MIN_READY_PEDESTRIANS = 620;
const DEFAULT_PEDESTRIAN_PREWARM_SPAWN_BUDGET_MULTIPLIER = 3.15;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.sqrt(getDistanceSquared(first, second));
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getAngleDeltaRadians(first: number, second: number): number {
  const delta = Math.atan2(Math.sin(first - second), Math.cos(first - second));

  return Math.abs(delta);
}

function getHighSpeedPopulationIntensity(speedMps: number): number {
  return clamp((speedMps - 22) / 18, 0, 1);
}

function hasFrontSectorDeficit(
  runtime: HomeDrivePedestrianPopulationRuntime,
): boolean {
  return runtime.lastSectorCounts.some((item) => {
    return (
      (item.sectorKey === "front-near" || item.sectorKey === "front-far") &&
      item.deficitCount > 0
    );
  });
}

type ResolvedPopulationOptions = Required<
  Pick<
    HomeDrivePedestrianPopulationRuntimeOptions,
    | "populateRadiusMeters"
    | "repopulateDistanceMeters"
    | "repopulateCooldownSeconds"
    | "minPedestriansNearPlayer"
    | "maxActivePedestrians"
    | "maxSpawnPerRefresh"
    | "keepAliveRadiusMeters"
    | "localZoneSearchRadiusMeters"
    | "density"
    | "enabled"
    | "frontLookaheadMeters"
    | "frontLookaheadSpeedMultiplier"
    | "frontFarRadiusMeters"
    | "sideRadiusMeters"
    | "rearRadiusMeters"
    | "minFrontPedestrians"
    | "minFarFrontPedestrians"
    | "minSideSectorPedestrians"
    | "minRearBufferPedestrians"
    | "minCrosswalkPedestrians"
    | "maxSpawnPerSectorRefresh"
    | "maxCrosswalkSpawnPerRefresh"
    | "crosswalkSearchRadiusMeters"
    | "enablePedestrianWarmRing"
    | "pedestrianWarmRingBaseRadiusMeters"
    | "pedestrianWarmRingFrontBiasMeters"
    | "pedestrianWarmRingSpeedRadiusMultiplier"
    | "pedestrianWarmRingSideRadiusMeters"
    | "pedestrianWarmRingRearRadiusMeters"
    | "pedestrianWarmRingMaxZoneCount"
    | "pedestrianPrewarmEnabled"
    | "pedestrianPrewarmFrames"
    | "pedestrianPrewarmLeadSeconds"
    | "pedestrianPrewarmFrontMeters"
    | "pedestrianPrewarmMinReadyPedestrians"
    | "pedestrianPrewarmSpawnBudgetMultiplier"
  >
>;

function getResolvedOptions(
  options: HomeDrivePedestrianPopulationRuntimeOptions = {},
): ResolvedPopulationOptions {
  const populateRadiusMeters = Math.max(
    64,
    options.populateRadiusMeters ?? DEFAULT_POPULATE_RADIUS_METERS,
  );
  const frontLookaheadMeters = Math.max(
    populateRadiusMeters,
    options.frontLookaheadMeters ?? DEFAULT_FRONT_LOOKAHEAD_METERS,
  );

  return {
    populateRadiusMeters,
    repopulateDistanceMeters: Math.max(
      12,
      options.repopulateDistanceMeters ?? DEFAULT_REPOPULATE_DISTANCE_METERS,
    ),
    repopulateCooldownSeconds: Math.max(
      0,
      options.repopulateCooldownSeconds ?? DEFAULT_REPOPULATE_COOLDOWN_SECONDS,
    ),
    minPedestriansNearPlayer: Math.max(
      0,
      options.minPedestriansNearPlayer ?? DEFAULT_MIN_PEDESTRIANS_NEAR_PLAYER,
    ),
    maxActivePedestrians: Math.max(
      0,
      options.maxActivePedestrians ?? DEFAULT_MAX_ACTIVE_PEDESTRIANS,
    ),
    maxSpawnPerRefresh: Math.max(
      0,
      options.maxSpawnPerRefresh ?? DEFAULT_MAX_SPAWN_PER_REFRESH,
    ),
    keepAliveRadiusMeters: Math.max(
      populateRadiusMeters,
      options.keepAliveRadiusMeters ?? frontLookaheadMeters * 1.85,
    ),
    localZoneSearchRadiusMeters: Math.max(
      populateRadiusMeters,
      options.localZoneSearchRadiusMeters ?? frontLookaheadMeters * 1.16,
    ),
    density: clamp(options.density ?? DEFAULT_DENSITY, 0.1, 12),
    enabled: options.enabled ?? true,
    frontLookaheadMeters,
    frontLookaheadSpeedMultiplier: Math.max(
      0,
      options.frontLookaheadSpeedMultiplier ??
        DEFAULT_FRONT_LOOKAHEAD_SPEED_MULTIPLIER,
    ),
    frontFarRadiusMeters: Math.max(
      80,
      options.frontFarRadiusMeters ?? frontLookaheadMeters * 0.62,
    ),
    sideRadiusMeters: Math.max(
      80,
      options.sideRadiusMeters ?? populateRadiusMeters * 0.82,
    ),
    rearRadiusMeters: Math.max(
      40,
      options.rearRadiusMeters ?? populateRadiusMeters * 0.44,
    ),
    minFrontPedestrians: Math.max(
      0,
      options.minFrontPedestrians ?? DEFAULT_MIN_FRONT_PEDESTRIANS,
    ),
    minFarFrontPedestrians: Math.max(
      0,
      options.minFarFrontPedestrians ?? DEFAULT_MIN_FAR_FRONT_PEDESTRIANS,
    ),
    minSideSectorPedestrians: Math.max(
      0,
      options.minSideSectorPedestrians ?? DEFAULT_MIN_SIDE_SECTOR_PEDESTRIANS,
    ),
    minRearBufferPedestrians: Math.max(
      0,
      options.minRearBufferPedestrians ?? DEFAULT_MIN_REAR_BUFFER_PEDESTRIANS,
    ),
    minCrosswalkPedestrians: Math.max(
      0,
      options.minCrosswalkPedestrians ?? DEFAULT_MIN_CROSSWALK_PEDESTRIANS,
    ),
    maxSpawnPerSectorRefresh: Math.max(
      0,
      options.maxSpawnPerSectorRefresh ?? DEFAULT_MAX_SPAWN_PER_SECTOR_REFRESH,
    ),
    maxCrosswalkSpawnPerRefresh: Math.max(
      0,
      options.maxCrosswalkSpawnPerRefresh ??
        DEFAULT_MAX_CROSSWALK_SPAWN_PER_REFRESH,
    ),
    crosswalkSearchRadiusMeters: Math.max(
      80,
      options.crosswalkSearchRadiusMeters ?? populateRadiusMeters,
    ),
    enablePedestrianWarmRing:
      options.enablePedestrianWarmRing ?? DEFAULT_ENABLE_PEDESTRIAN_WARM_RING,
    pedestrianWarmRingBaseRadiusMeters: Math.max(
      populateRadiusMeters,
      options.pedestrianWarmRingBaseRadiusMeters ??
        DEFAULT_WARM_RING_BASE_RADIUS_METERS,
    ),
    pedestrianWarmRingFrontBiasMeters: Math.max(
      0,
      options.pedestrianWarmRingFrontBiasMeters ??
        DEFAULT_WARM_RING_FRONT_BIAS_METERS,
    ),
    pedestrianWarmRingSpeedRadiusMultiplier: Math.max(
      0,
      options.pedestrianWarmRingSpeedRadiusMultiplier ??
        DEFAULT_WARM_RING_SPEED_RADIUS_MULTIPLIER,
    ),
    pedestrianWarmRingSideRadiusMeters: Math.max(
      80,
      options.pedestrianWarmRingSideRadiusMeters ??
        DEFAULT_WARM_RING_SIDE_RADIUS_METERS,
    ),
    pedestrianWarmRingRearRadiusMeters: Math.max(
      40,
      options.pedestrianWarmRingRearRadiusMeters ??
        DEFAULT_WARM_RING_REAR_RADIUS_METERS,
    ),
    pedestrianWarmRingMaxZoneCount: Math.max(
      8,
      Math.floor(
        options.pedestrianWarmRingMaxZoneCount ??
          DEFAULT_WARM_RING_MAX_ZONE_COUNT,
      ),
    ),
    pedestrianPrewarmEnabled:
      options.pedestrianPrewarmEnabled ?? DEFAULT_PEDESTRIAN_PREWARM_ENABLED,
    pedestrianPrewarmFrames: Math.max(
      1,
      Math.floor(
        options.pedestrianPrewarmFrames ?? DEFAULT_PEDESTRIAN_PREWARM_FRAMES,
      ),
    ),
    pedestrianPrewarmLeadSeconds: Math.max(
      0.6,
      options.pedestrianPrewarmLeadSeconds ??
        DEFAULT_PEDESTRIAN_PREWARM_LEAD_SECONDS,
    ),
    pedestrianPrewarmFrontMeters: Math.max(
      populateRadiusMeters,
      options.pedestrianPrewarmFrontMeters ?? DEFAULT_PEDESTRIAN_PREWARM_FRONT_METERS,
    ),
    pedestrianPrewarmMinReadyPedestrians: Math.max(
      0,
      Math.floor(
        options.pedestrianPrewarmMinReadyPedestrians ??
          DEFAULT_PEDESTRIAN_PREWARM_MIN_READY_PEDESTRIANS,
      ),
    ),
    pedestrianPrewarmSpawnBudgetMultiplier: Math.max(
      1,
      options.pedestrianPrewarmSpawnBudgetMultiplier ??
        DEFAULT_PEDESTRIAN_PREWARM_SPAWN_BUDGET_MULTIPLIER,
    ),
  };
}

export function createInitialHomeDrivePedestrianPopulationRuntime(
  center: HomeDriveVector2 | null = null,
  elapsedSeconds = 0,
): HomeDrivePedestrianPopulationRuntime {
  return {
    lastPopulateCenter: center,
    lastPopulateAtSeconds: elapsedSeconds,
    generationSerial: 0,
    lastAgentSerial: 0,
    activeZoneIds: [],
    spawnedAgentIds: [],
    lastNearAgentCount: 0,
    lastSpawnedAgentCount: 0,
    lastPrunedAgentCount: 0,
    lastPopulateHeadingRad: null,
    lastPopulateSpeedMps: 0,
    lastStreamingPlanId: null,
    lastSectorCounts: [],
    lastCrosswalkDemandCount: 0,
    spawnReservoir: undefined,
    lastWarmRingPlanId: null,
    lastWarmRingZoneIds: [],
    lastWarmRingRadiusMeters: 0,
    warmRingSnapshot: undefined,
  };
}

function countAgentsNearCenter(
  agents: readonly HomeDrivePedestrianAgent[],
  center: HomeDriveVector2,
  radiusMeters: number,
): number {
  if (agents.length <= 0) {
    return 0;
  }

  return countHomeDrivePedestrianSpatialItemsNear(
    createHomeDrivePedestrianAgentSpatialIndex(agents, 22),
    center,
    radiusMeters,
  );
}

function shouldRepopulateHomeDrivePedestrians(params: Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  runtime: HomeDrivePedestrianPopulationRuntime;
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  options: ResolvedPopulationOptions;
  forceRepopulate?: boolean;
}>): boolean {
  if (!params.options.enabled || params.options.maxSpawnPerRefresh <= 0) {
    return false;
  }

  if (params.forceRepopulate) {
    return true;
  }

  const nearAgentCount = countAgentsNearCenter(
    params.agents,
    params.activeCenter,
    params.options.populateRadiusMeters,
  );

  if (nearAgentCount < params.options.minPedestriansNearPlayer) {
    return true;
  }

  if (!params.runtime.lastPopulateCenter) {
    return true;
  }

  const secondsSinceLastPopulate =
    params.elapsedSeconds - params.runtime.lastPopulateAtSeconds;

  const highSpeedIntensity = getHighSpeedPopulationIntensity(
    params.activeSpeedMps,
  );
  const highSpeedRepopulateCooldownSeconds =
    params.activeSpeedMps >= 32
      ? Math.min(params.options.repopulateCooldownSeconds, 0.035)
      : params.activeSpeedMps >= 22
        ? Math.min(params.options.repopulateCooldownSeconds, 0.045)
        : params.activeSpeedMps >= 9.5
          ? Math.min(params.options.repopulateCooldownSeconds, 0.055)
          : params.options.repopulateCooldownSeconds;

  if (secondsSinceLastPopulate < highSpeedRepopulateCooldownSeconds) {
    return false;
  }

  if (params.activeSpeedMps >= 32 && hasFrontSectorDeficit(params.runtime)) {
    return true;
  }

  const distanceFromLastPopulate = getDistanceMeters(
    params.activeCenter,
    params.runtime.lastPopulateCenter,
  );
  const speedBoostedDistanceThreshold =
    params.activeSpeedMps >= 32
      ? params.options.repopulateDistanceMeters * 0.1
      : params.activeSpeedMps >= 22
        ? params.options.repopulateDistanceMeters * (0.14 - highSpeedIntensity * 0.035)
        : params.activeSpeedMps >= 12
          ? params.options.repopulateDistanceMeters * 0.16
          : params.activeSpeedMps >= 8
            ? params.options.repopulateDistanceMeters * 0.26
            : params.options.repopulateDistanceMeters;

  if (distanceFromLastPopulate >= speedBoostedDistanceThreshold) {
    return true;
  }

  if (params.runtime.lastPopulateHeadingRad !== null) {
    const headingDelta = getAngleDeltaRadians(
      params.activeHeadingRad,
      params.runtime.lastPopulateHeadingRad,
    );

    if (headingDelta >= 0.38) {
      return true;
    }
  }

  return false;
}

function shouldKeepAgentAlive(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  activeCenter: HomeDriveVector2;
  keepAliveRadiusMeters: number;
}>): boolean {
  if (params.agent.crosswalkId) {
    return true;
  }

  return (
    getDistanceSquared(params.agent.position, params.activeCenter) <=
    params.keepAliveRadiusMeters * params.keepAliveRadiusMeters
  );
}

function pruneHomeDrivePedestrianAgents(params: Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  activeCenter: HomeDriveVector2;
  keepAliveRadiusMeters: number;
  maxActivePedestrians: number;
}>): Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  prunedCount: number;
}> {
  const keptByDistance = params.agents.filter((agent) => {
    return shouldKeepAgentAlive({
      agent,
      activeCenter: params.activeCenter,
      keepAliveRadiusMeters: params.keepAliveRadiusMeters,
    });
  });

  if (keptByDistance.length <= params.maxActivePedestrians) {
    return {
      agents: keptByDistance,
      prunedCount: params.agents.length - keptByDistance.length,
    };
  }

  const limited = [...keptByDistance]
    .sort((first, second) => {
      const firstDistance = getDistanceSquared(first.position, params.activeCenter);
      const secondDistance = getDistanceSquared(second.position, params.activeCenter);

      if (Math.abs(firstDistance - secondDistance) > 0.0001) {
        return firstDistance - secondDistance;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, params.maxActivePedestrians);

  return {
    agents: limited,
    prunedCount: params.agents.length - limited.length,
  };
}

function getSpawnedAgentIds(
  previousIds: readonly string[],
  spawnedAgents: readonly HomeDrivePedestrianAgent[],
): readonly string[] {
  const ids = new Set(previousIds);

  spawnedAgents.forEach((agent) => {
    ids.add(agent.id);
  });

  return Array.from(ids).sort((first, second) => first.localeCompare(second));
}

function mergeUniqueSortedIds(
  first: readonly string[],
  second: readonly string[],
): readonly string[] {
  return Array.from(new Set([...first, ...second])).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function repopulateHomeDrivePedestrianPopulationRuntime(
  input: HomeDrivePedestrianPopulationRuntimeInput,
): HomeDrivePedestrianPopulationRuntimeResult {
  const options = getResolvedOptions(input.options);
  const activeCenter = input.options?.activeCenter;
  const activeHeadingRad = input.options?.activeHeadingRad ?? 0;
  const activeSpeedMps = Math.max(0, input.options?.activeSpeedMps ?? 0);

  const currentRuntime =
    input.populationRuntime ??
    createInitialHomeDrivePedestrianPopulationRuntime(
      activeCenter ?? null,
      input.elapsedSeconds,
    );

  const dedupedInputAgents = dedupeHomeDrivePedestrianAgentsById(input.agents);

  if (!activeCenter || !options.enabled) {
    return {
      agents: dedupedInputAgents,
      populationRuntime: {
        ...currentRuntime,
        lastNearAgentCount: activeCenter
          ? countAgentsNearCenter(
              dedupedInputAgents,
              activeCenter,
              options.populateRadiusMeters,
            )
          : currentRuntime.lastNearAgentCount,
        lastSpawnedAgentCount: 0,
        lastPrunedAgentCount: 0,
      },
      didRepopulate: false,
      didPrune: false,
    };
  }

  const pruned = pruneHomeDrivePedestrianAgents({
    agents: dedupedInputAgents,
    activeCenter,
    keepAliveRadiusMeters: options.keepAliveRadiusMeters,
    maxActivePedestrians: options.maxActivePedestrians,
  });

  const warmRingSnapshot = createHomeDrivePedestrianWarmRingSnapshot(input.zones, {
    enabled: options.enablePedestrianWarmRing,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    baseRadiusMeters: options.pedestrianWarmRingBaseRadiusMeters,
    frontBiasMeters: options.pedestrianWarmRingFrontBiasMeters,
    speedRadiusMultiplier: options.pedestrianWarmRingSpeedRadiusMultiplier,
    sideRadiusMeters: options.pedestrianWarmRingSideRadiusMeters,
    rearRadiusMeters: options.pedestrianWarmRingRearRadiusMeters,
    maxZoneCount: options.pedestrianWarmRingMaxZoneCount,
  });
  const prewarmPlan = createHomeDrivePedestrianPrewarmPlan({
    enabled: options.pedestrianPrewarmEnabled,
    agents: pruned.agents,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    populateRadiusMeters: options.populateRadiusMeters,
    localZoneSearchRadiusMeters: options.localZoneSearchRadiusMeters,
    keepAliveRadiusMeters: options.keepAliveRadiusMeters,
    maxSpawnPerRefresh: options.maxSpawnPerRefresh,
    minPedestriansNearPlayer: options.minPedestriansNearPlayer,
    prewarmFrames: options.pedestrianPrewarmFrames,
    leadSeconds: options.pedestrianPrewarmLeadSeconds,
    frontMeters: options.pedestrianPrewarmFrontMeters,
    minReadyPedestrians: options.pedestrianPrewarmMinReadyPedestrians,
    spawnBudgetMultiplier: options.pedestrianPrewarmSpawnBudgetMultiplier,
    warmRingSnapshot,
  });
  const highSpeedIntensity = getHighSpeedPopulationIntensity(activeSpeedMps);
  const effectivePopulateRadiusMeters = prewarmPlan.effectivePopulateRadiusMeters;
  const effectiveLocalZoneSearchRadiusMeters = prewarmPlan.effectiveLocalZoneSearchRadiusMeters;
  const effectiveKeepAliveRadiusMeters = prewarmPlan.effectiveKeepAliveRadiusMeters;
  const effectiveMaxSpawnPerRefresh = Math.max(
    prewarmPlan.effectiveMaxSpawnPerRefresh,
    Math.ceil(options.maxSpawnPerRefresh * (1 + highSpeedIntensity * 0.42)),
  );
  const effectiveMinPedestriansNearPlayer = Math.max(
    prewarmPlan.effectiveMinPedestriansNearPlayer,
    Math.ceil(options.minPedestriansNearPlayer * (1 + highSpeedIntensity * 0.18)),
  );
  const effectiveFrontLookaheadMeters = Math.max(
    options.frontLookaheadMeters,
    prewarmPlan.effectiveFrontLookaheadMeters,
  );
  const effectiveFrontFarRadiusMeters = Math.max(
    options.frontFarRadiusMeters,
    highSpeedIntensity > 0
      ? effectiveFrontLookaheadMeters * (0.62 + highSpeedIntensity * 0.12)
      : options.frontFarRadiusMeters,
  );
  const effectiveMinFrontPedestrians = Math.max(
    options.minFrontPedestrians,
    Math.ceil(options.minFrontPedestrians * (1 + highSpeedIntensity * 0.2)),
  );
  const effectiveMinFarFrontPedestrians = Math.max(
    options.minFarFrontPedestrians,
    Math.ceil(options.minFarFrontPedestrians * (1 + highSpeedIntensity * 0.42)),
  );
  const effectiveMaxSpawnPerSectorRefresh = Math.max(
    options.maxSpawnPerSectorRefresh,
    Math.ceil(options.maxSpawnPerSectorRefresh * (1 + highSpeedIntensity * 0.34)),
  );

  const shouldRepopulate = shouldRepopulateHomeDrivePedestrians({
    agents: pruned.agents,
    runtime: currentRuntime,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    options: {
      ...options,
      populateRadiusMeters: effectivePopulateRadiusMeters,
      localZoneSearchRadiusMeters: effectiveLocalZoneSearchRadiusMeters,
      keepAliveRadiusMeters: effectiveKeepAliveRadiusMeters,
      maxSpawnPerRefresh: effectiveMaxSpawnPerRefresh,
      minPedestriansNearPlayer: effectiveMinPedestriansNearPlayer,
    },
    forceRepopulate:
      input.options?.forceRepopulate || prewarmPlan.shouldForceRepopulate,
  });

  if (!shouldRepopulate) {
    return {
      agents: pruned.agents,
      populationRuntime: {
        ...currentRuntime,
        lastNearAgentCount: countAgentsNearCenter(
          pruned.agents,
          activeCenter,
          effectivePopulateRadiusMeters,
        ),
        lastSpawnedAgentCount: 0,
        lastPrunedAgentCount: pruned.prunedCount,
        lastWarmRingPlanId: warmRingSnapshot.id,
        lastWarmRingZoneIds: warmRingSnapshot.warmZoneIds,
        lastWarmRingRadiusMeters: warmRingSnapshot.radiusMeters,
        warmRingSnapshot,
      },
      didRepopulate: false,
      didPrune: pruned.prunedCount > 0,
    };
  }

  const nextGenerationSerial = currentRuntime.generationSerial + 1;

  const spawned = createHomeDriveLocalPedestrianAgents({
    agents: pruned.agents,
    zones: input.zones,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    crosswalks: input.options?.crosswalks,
    elapsedSeconds: input.elapsedSeconds,
    seed: input.options?.seed ?? input.seed,
    generationSerial: nextGenerationSerial,
    lastAgentSerial: currentRuntime.lastAgentSerial,
    spawnReservoir: currentRuntime.spawnReservoir,
    density: options.density,
    populateRadiusMeters: effectivePopulateRadiusMeters,
    localZoneSearchRadiusMeters: effectiveLocalZoneSearchRadiusMeters,
    minPedestriansNearPlayer: effectiveMinPedestriansNearPlayer,
    maxSpawnPerRefresh: effectiveMaxSpawnPerRefresh,
    maxActivePedestrians: options.maxActivePedestrians,
    frontLookaheadMeters: effectiveFrontLookaheadMeters,
    frontLookaheadSpeedMultiplier: options.frontLookaheadSpeedMultiplier,
    frontFarRadiusMeters: effectiveFrontFarRadiusMeters,
    sideRadiusMeters: options.sideRadiusMeters,
    rearRadiusMeters: options.rearRadiusMeters,
    minFrontPedestrians: effectiveMinFrontPedestrians,
    minFarFrontPedestrians: effectiveMinFarFrontPedestrians,
    minSideSectorPedestrians: options.minSideSectorPedestrians,
    minRearBufferPedestrians: options.minRearBufferPedestrians,
    minCrosswalkPedestrians: options.minCrosswalkPedestrians,
    maxSpawnPerSectorRefresh: effectiveMaxSpawnPerSectorRefresh,
    maxCrosswalkSpawnPerRefresh: options.maxCrosswalkSpawnPerRefresh,
    crosswalkSearchRadiusMeters: options.crosswalkSearchRadiusMeters,
    warmRingSnapshot,
  });

  const mergedAgentsBeforeDedupe = [...pruned.agents, ...spawned.agents];
  const mergedAgents = dedupeHomeDrivePedestrianAgentsById(
    mergedAgentsBeforeDedupe,
  );
  const dedupedMergedCount = mergedAgentsBeforeDedupe.length - mergedAgents.length;
  const limitedAfterSpawn = pruneHomeDrivePedestrianAgents({
    agents: mergedAgents,
    activeCenter,
    keepAliveRadiusMeters: effectiveKeepAliveRadiusMeters,
    maxActivePedestrians: options.maxActivePedestrians,
  });

  const populationRuntime: HomeDrivePedestrianPopulationRuntime = {
    lastPopulateCenter: activeCenter,
    lastPopulateAtSeconds: input.elapsedSeconds,
    generationSerial: nextGenerationSerial,
    lastAgentSerial: spawned.nextAgentSerial,
    activeZoneIds: mergeUniqueSortedIds(
      currentRuntime.activeZoneIds,
      spawned.activeZoneIds,
    ),
    spawnedAgentIds: getSpawnedAgentIds(
      currentRuntime.spawnedAgentIds,
      spawned.agents,
    ),
    lastNearAgentCount: spawned.nearAgentCount,
    lastSpawnedAgentCount: spawned.spawnedAgentCount,
    lastPrunedAgentCount:
      pruned.prunedCount +
      dedupedMergedCount +
      (mergedAgents.length - limitedAfterSpawn.agents.length),
    lastPopulateHeadingRad: activeHeadingRad,
    lastPopulateSpeedMps: activeSpeedMps,
    lastStreamingPlanId: spawned.streamingPlanId,
    lastSectorCounts: spawned.streamingSectorCounts,
    lastCrosswalkDemandCount: spawned.crosswalkDemandCount,
    spawnReservoir: spawned.spawnReservoir,
    lastWarmRingPlanId: warmRingSnapshot.id,
    lastWarmRingZoneIds: warmRingSnapshot.warmZoneIds,
    lastWarmRingRadiusMeters: warmRingSnapshot.radiusMeters,
    warmRingSnapshot,
  };

  return {
    agents: limitedAfterSpawn.agents,
    populationRuntime,
    didRepopulate: spawned.spawnedAgentCount > 0,
    didPrune: populationRuntime.lastPrunedAgentCount > 0,
  };
}

export function getHomeDrivePedestrianPopulationActiveZoneIds(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  center: HomeDriveVector2,
  radiusMeters: number,
): readonly string[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return zones
    .filter((zone) => {
      return getDistanceSquared(zone.center, center) <= radiusSquared;
    })
    .map((zone) => zone.id)
    .sort((first, second) => first.localeCompare(second));
}
