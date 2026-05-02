// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import { dedupeHomeDrivePedestrianAgentsById } from "./homeDrive.pedestrianIdentity";
import { orchestrateHomeDrivePedestrians } from "./homeDrive.pedestrianOrchestrator";
import type { HomeDrivePedestrianResidentPoolConfig } from "./homeDrive.pedestrianResidentPool.types";
import type {
  HomeDrivePedestrianPopulationRuntime,
  HomeDrivePedestrianPopulationRuntimeInput,
  HomeDrivePedestrianPopulationRuntimeOptions,
  HomeDrivePedestrianPopulationRuntimeResult,
} from "./homeDrive.pedestrianPopulationRuntime.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

const DEFAULT_POPULATE_RADIUS_METERS = 430;
const DEFAULT_RESIDENT_POOL_ENABLED = true;
const DEFAULT_RESIDENT_POOL_SIZE = 72;
const DEFAULT_RESIDENT_POOL_MIN_FRONT_AGENTS = 24;
const DEFAULT_RESIDENT_POOL_MIN_FAR_AGENTS = 32;
const DEFAULT_RESIDENT_POOL_TELEPORT_MIN_FORWARD_METERS = 240;
const DEFAULT_RESIDENT_POOL_TELEPORT_MAX_FORWARD_METERS = 680;
const DEFAULT_RESIDENT_POOL_TELEPORT_HORIZON_MAX_FORWARD_METERS = 920;
const DEFAULT_RESIDENT_POOL_RECYCLE_BEHIND_METERS = 110;
const DEFAULT_RESIDENT_POOL_RECYCLE_SIDE_METERS = 520;
const DEFAULT_RESIDENT_POOL_MAX_TELEPORTS_PER_TICK = 24;
const DEFAULT_RESIDENT_POOL_MAX_INITIAL_TELEPORTS = 72;
const DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_METERS = 220;
const DEFAULT_RESIDENT_POOL_PROTECT_VISIBLE_CONE_RADIANS = 0.72;
const DEFAULT_RESIDENT_POOL_DEBUG = false;
const DEFAULT_VIEWPORT_OCCUPANCY_ENABLED = true;
const DEFAULT_FORCE_ALL_AGENTS_INTO_VIEWPORT = true;
const DEFAULT_VISIBLE_NEAR_MIN_METERS = 42;
const DEFAULT_VISIBLE_NEAR_MAX_METERS = 120;
const DEFAULT_VISIBLE_NEAR_COUNT = 16;
const DEFAULT_VISIBLE_MID_MIN_METERS = 118;
const DEFAULT_VISIBLE_MID_MAX_METERS = 250;
const DEFAULT_VISIBLE_MID_COUNT = 20;
const DEFAULT_VISIBLE_FAR_MIN_METERS = 248;
const DEFAULT_VISIBLE_FAR_MAX_METERS = 430;
const DEFAULT_VISIBLE_FAR_COUNT = 22;
const DEFAULT_SIDE_MIN_FORWARD_METERS = 70;
const DEFAULT_SIDE_MAX_FORWARD_METERS = 380;
const DEFAULT_SIDE_LATERAL_MIN_METERS = 62;
const DEFAULT_SIDE_LATERAL_MAX_METERS = 210;
const DEFAULT_SIDE_COUNT = 14;
const DEFAULT_MAX_VIEWPORT_TELEPORTS_PER_TICK = 72;
const DEFAULT_VIEWPORT_MIN_SPACING_METERS = 5.2;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function positiveInteger(value: number | undefined, fallback: number, min = 0): number {
  return Math.max(min, Math.floor(value ?? fallback));
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function countAgentsNearCenter(
  agents: readonly HomeDrivePedestrianAgent[],
  center: HomeDriveVector2,
  radiusMeters: number,
): number {
  const radiusSquared = radiusMeters * radiusMeters;

  return agents.reduce((count, agent) => {
    return getDistanceSquared(agent.position, center) <= radiusSquared
      ? count + 1
      : count;
  }, 0);
}

function getSortedAgentIds(
  agents: readonly HomeDrivePedestrianAgent[],
): readonly string[] {
  return agents.map((agent) => agent.id).sort((first, second) => first.localeCompare(second));
}

function getSortedZoneIds(
  agents: readonly HomeDrivePedestrianAgent[],
): readonly string[] {
  return Array.from(new Set(agents.map((agent) => agent.zoneId))).sort(
    (first, second) => first.localeCompare(second),
  );
}

function resolveResidentPoolConfig(
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
    lastRelocatedAgentCount: 0,
    lastPopulateHeadingRad: null,
    lastPopulateSpeedMps: 0,
    residentPoolRuntime: undefined,
    residentPoolDiagnostics: undefined,
    orchestratorRuntime: undefined,
    orchestratorDiagnostics: undefined,
  };
}

export function repopulateHomeDrivePedestrianPopulationRuntime(
  input: HomeDrivePedestrianPopulationRuntimeInput,
): HomeDrivePedestrianPopulationRuntimeResult {
  const activeCenter = input.options?.activeCenter ?? null;
  const activeHeadingRad = input.options?.activeHeadingRad ?? 0;
  const activeSpeedMps = Math.max(0, input.options?.activeSpeedMps ?? 0);
  const populateRadiusMeters = Math.max(
    64,
    input.options?.populateRadiusMeters ?? DEFAULT_POPULATE_RADIUS_METERS,
  );
  const currentRuntime =
    input.populationRuntime ??
    createInitialHomeDrivePedestrianPopulationRuntime(
      activeCenter,
      input.elapsedSeconds,
    );
  const dedupedAgents = dedupeHomeDrivePedestrianAgentsById(input.agents);

  if (!activeCenter || input.options?.populationEnabled === false || input.options?.enabled === false) {
    return {
      agents: dedupedAgents,
      populationRuntime: {
        ...currentRuntime,
        lastNearAgentCount: activeCenter
          ? countAgentsNearCenter(dedupedAgents, activeCenter, populateRadiusMeters)
          : currentRuntime.lastNearAgentCount,
        lastSpawnedAgentCount: 0,
        lastPrunedAgentCount: 0,
        lastRelocatedAgentCount: 0,
      },
      didRepopulate: false,
      didPrune: false,
    };
  }

  const orchestratorResult = orchestrateHomeDrivePedestrians({
    agents: dedupedAgents,
    zones: input.zones,
    activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    seed: input.options?.seed ?? input.seed,
    runtime: currentRuntime.orchestratorRuntime,
    config: resolveResidentPoolConfig(input.options),
  });

  return {
    agents: orchestratorResult.agents,
    populationRuntime: {
      ...currentRuntime,
      lastPopulateCenter: activeCenter,
      lastPopulateAtSeconds: input.elapsedSeconds,
      generationSerial: currentRuntime.generationSerial + 1,
      lastAgentSerial: Math.max(
        currentRuntime.lastAgentSerial,
        orchestratorResult.agents.length,
      ),
      activeZoneIds: getSortedZoneIds(orchestratorResult.agents),
      spawnedAgentIds: getSortedAgentIds(orchestratorResult.agents),
      lastNearAgentCount: countAgentsNearCenter(
        orchestratorResult.agents,
        activeCenter,
        populateRadiusMeters,
      ),
      lastSpawnedAgentCount: orchestratorResult.createdAgentCount,
      lastPrunedAgentCount: 0,
      lastRelocatedAgentCount: orchestratorResult.teleportedAgentCount,
      lastPopulateHeadingRad: activeHeadingRad,
      lastPopulateSpeedMps: activeSpeedMps,
      residentPoolRuntime: orchestratorResult.runtime.residentPoolRuntime,
      residentPoolDiagnostics:
        orchestratorResult.diagnostics.residentPoolDiagnostics,
      orchestratorRuntime: orchestratorResult.runtime,
      orchestratorDiagnostics: orchestratorResult.diagnostics,
    },
    didRepopulate: orchestratorResult.didRepopulate,
    didPrune: false,
  };
}
