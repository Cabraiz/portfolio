// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import { createHomeDriveLocalPedestrianAgents } from "./homeDrive.pedestrianLocalSpawner";
import { dedupeHomeDrivePedestrianAgentsById } from "./homeDrive.pedestrianIdentity";
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
const DEFAULT_REPOPULATE_DISTANCE_METERS = 52;
const DEFAULT_REPOPULATE_COOLDOWN_SECONDS = 0.58;
const DEFAULT_MIN_PEDESTRIANS_NEAR_PLAYER = 145;
const DEFAULT_MAX_ACTIVE_PEDESTRIANS = 1780;
const DEFAULT_MAX_SPAWN_PER_REFRESH = 165;
const DEFAULT_DENSITY = 5.6;
const DEFAULT_FRONT_LOOKAHEAD_METERS = 560;
const DEFAULT_FRONT_LOOKAHEAD_SPEED_MULTIPLIER = 13;
const DEFAULT_MIN_FRONT_PEDESTRIANS = 96;
const DEFAULT_MIN_FAR_FRONT_PEDESTRIANS = 54;
const DEFAULT_MIN_SIDE_SECTOR_PEDESTRIANS = 46;
const DEFAULT_MIN_REAR_BUFFER_PEDESTRIANS = 20;
const DEFAULT_MIN_CROSSWALK_PEDESTRIANS = 34;
const DEFAULT_MAX_SPAWN_PER_SECTOR_REFRESH = 54;
const DEFAULT_MAX_CROSSWALK_SPAWN_PER_REFRESH = 44;

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
  };
}

function countAgentsNearCenter(
  agents: readonly HomeDrivePedestrianAgent[],
  center: HomeDriveVector2,
  radiusMeters: number,
): number {
  const radiusSquared = radiusMeters * radiusMeters;

  return agents.reduce((total, agent) => {
    return getDistanceSquared(agent.position, center) <= radiusSquared
      ? total + 1
      : total;
  }, 0);
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

  if (secondsSinceLastPopulate < params.options.repopulateCooldownSeconds) {
    return false;
  }

  const distanceFromLastPopulate = getDistanceMeters(
    params.activeCenter,
    params.runtime.lastPopulateCenter,
  );
  const speedBoostedDistanceThreshold =
    params.activeSpeedMps >= 8
      ? params.options.repopulateDistanceMeters * 0.42
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

  const shouldRepopulate = shouldRepopulateHomeDrivePedestrians({
    agents: pruned.agents,
    runtime: currentRuntime,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    options,
    forceRepopulate: input.options?.forceRepopulate,
  });

  if (!shouldRepopulate) {
    return {
      agents: pruned.agents,
      populationRuntime: {
        ...currentRuntime,
        lastNearAgentCount: countAgentsNearCenter(
          pruned.agents,
          activeCenter,
          options.populateRadiusMeters,
        ),
        lastSpawnedAgentCount: 0,
        lastPrunedAgentCount: pruned.prunedCount,
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
    populateRadiusMeters: options.populateRadiusMeters,
    localZoneSearchRadiusMeters: options.localZoneSearchRadiusMeters,
    minPedestriansNearPlayer: options.minPedestriansNearPlayer,
    maxSpawnPerRefresh: options.maxSpawnPerRefresh,
    maxActivePedestrians: options.maxActivePedestrians,
    frontLookaheadMeters: options.frontLookaheadMeters,
    frontLookaheadSpeedMultiplier: options.frontLookaheadSpeedMultiplier,
    frontFarRadiusMeters: options.frontFarRadiusMeters,
    sideRadiusMeters: options.sideRadiusMeters,
    rearRadiusMeters: options.rearRadiusMeters,
    minFrontPedestrians: options.minFrontPedestrians,
    minFarFrontPedestrians: options.minFarFrontPedestrians,
    minSideSectorPedestrians: options.minSideSectorPedestrians,
    minRearBufferPedestrians: options.minRearBufferPedestrians,
    minCrosswalkPedestrians: options.minCrosswalkPedestrians,
    maxSpawnPerSectorRefresh: options.maxSpawnPerSectorRefresh,
    maxCrosswalkSpawnPerRefresh: options.maxCrosswalkSpawnPerRefresh,
    crosswalkSearchRadiusMeters: options.crosswalkSearchRadiusMeters,
  });

  const mergedAgentsBeforeDedupe = [...pruned.agents, ...spawned.agents];
  const mergedAgents = dedupeHomeDrivePedestrianAgentsById(
    mergedAgentsBeforeDedupe,
  );
  const dedupedMergedCount = mergedAgentsBeforeDedupe.length - mergedAgents.length;
  const limitedAfterSpawn = pruneHomeDrivePedestrianAgents({
    agents: mergedAgents,
    activeCenter,
    keepAliveRadiusMeters: options.keepAliveRadiusMeters,
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
