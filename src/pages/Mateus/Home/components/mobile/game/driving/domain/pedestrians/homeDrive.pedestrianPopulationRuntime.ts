// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPopulationRuntime.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

import { dedupeHomeDrivePedestrianAgentsById } from "./homeDrive.pedestrianIdentity";

import { orchestrateHomeDrivePedestrians } from "./homeDrive.pedestrianOrchestrator";

import type {
  HomeDrivePedestrianPopulationRuntime,
  HomeDrivePedestrianPopulationRuntimeInput,
  HomeDrivePedestrianPopulationRuntimeResult,
} from "./homeDrive.pedestrianPopulationRuntime.types";

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import {
  DEFAULT_POPULATE_RADIUS_METERS,
} from "./homeDrive.pedestrianPopulationRuntime.defaults";
import {
  resolveResidentPoolConfig,
} from "./homeDrive.pedestrianPopulationRuntime.config";

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
    bootPreloadDiagnostics: undefined,

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

