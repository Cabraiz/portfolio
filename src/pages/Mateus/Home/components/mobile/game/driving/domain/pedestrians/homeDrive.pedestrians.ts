// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.ts

import {
  createInitialHomeDrivePedestrianPopulationRuntime,
  repopulateHomeDrivePedestrianPopulationRuntime,
} from "./homeDrive.pedestrianPopulationRuntime";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianGenerationOptions,
  HomeDrivePedestrianRuntimeState,
  HomeDrivePedestrianTickOptions,
} from "./homeDrive.pedestrians.types";
import {
  shouldHomeDrivePedestrianMove,
} from "./homeDrive.pedestrianBehaviors";
import { dedupeHomeDrivePedestrianAgentsById } from "./homeDrive.pedestrianIdentity";
import { shouldTickHomeDrivePedestrianAgent } from "./homeDrive.pedestrianSimulationScheduler";
import { clamp } from "./homeDrive.pedestrianRandom";
import {
  buildHomeDrivePedestrianSidewalkZones,
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
  getHomeDrivePedestrianZoneById,
  resolveHomeDrivePedestrianSidewalkProgressAfterDistance,
} from "./homeDrive.pedestrianSidewalks";

const DEFAULT_SEED = 7429;
const DEFAULT_MAX_DELTA_SECONDS = 1 / 24;
const DEFAULT_MIN_ROAD_LENGTH_METERS = 28;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function tickSidewalkAgent(
  agent: HomeDrivePedestrianAgent,
  pedestrians: HomeDrivePedestrianRuntimeState,
  deltaSeconds: number,
): HomeDrivePedestrianAgent {
  const zone = getHomeDrivePedestrianZoneById(pedestrians.zones, agent.zoneId);

  if (!zone || !shouldHomeDrivePedestrianMove(agent.behavior)) {
    return {
      ...agent,
      behaviorElapsedSeconds:
        (agent.behaviorElapsedSeconds + deltaSeconds) %
        Math.max(0.01, agent.behaviorDurationSeconds),
      animationPhase:
        (agent.animationPhase + deltaSeconds * Math.max(0.2, agent.speedMps) * 5.4) %
        (Math.PI * 2),
    };
  }

  const speedMps = clamp(
    agent.speedMps + (agent.targetSpeedMps - agent.speedMps) * 0.08,
    0,
    3.2,
  );
  const moved = resolveHomeDrivePedestrianSidewalkProgressAfterDistance(
    zone,
    agent.progress,
    agent.directionSign,
    speedMps * deltaSeconds,
  );
  const position = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    moved.progress,
    agent.lateralOffsetMeters,
  );

  return {
    ...agent,
    progress: moved.progress,
    directionSign: moved.directionSign,
    position,
    headingRad: getHomeDrivePedestrianHeadingRadians(zone, moved.directionSign),
    speedMps,
    behaviorElapsedSeconds:
      (agent.behaviorElapsedSeconds + deltaSeconds) %
      Math.max(0.01, agent.behaviorDurationSeconds),
    animationPhase:
      (agent.animationPhase + deltaSeconds * Math.max(0.25, speedMps) * 5.4) %
      (Math.PI * 2),
  };
}

function tickAgentIfScheduled(
  agent: HomeDrivePedestrianAgent,
  pedestrians: HomeDrivePedestrianRuntimeState,
  deltaSeconds: number,
  options: HomeDrivePedestrianTickOptions,
): HomeDrivePedestrianAgent {
  if (
    !shouldTickHomeDrivePedestrianAgent({
      agent,
      activeCenter: options.activeCenter,
      activeRadiusMeters: options.activeRadiusMeters,
      warmRadiusMeters: options.warmRadiusMeters,
      warmTickModulo: options.warmTickModulo,
      coldTickModulo: options.coldTickModulo,
      tickIndex: options.tickIndex,
    })
  ) {
    return agent;
  }

  return tickSidewalkAgent(agent, pedestrians, deltaSeconds);
}

export function createInitialHomeDrivePedestrianState(
  options: HomeDrivePedestrianGenerationOptions = {},
): HomeDrivePedestrianRuntimeState {
  const seed = options.seed ?? DEFAULT_SEED;
  const zones = buildHomeDrivePedestrianSidewalkZones({
    minRoadLengthMeters:
      options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS,
    maxRoads: options.maxRoads,
    density: options.density,
  });

  return {
    agents: [],
    zones,
    elapsedSeconds: 0,
    seed,
    populationRuntime: createInitialHomeDrivePedestrianPopulationRuntime(
      options.initialFocusCenter ?? null,
      0,
    ),
  };
}

export function tickHomeDrivePedestrians(
  pedestrians: HomeDrivePedestrianRuntimeState,
  deltaSeconds: number,
  options: HomeDrivePedestrianTickOptions = {},
): HomeDrivePedestrianRuntimeState {
  if (options.enabled === false) {
    return pedestrians;
  }

  const safeDeltaSeconds = clamp(
    deltaSeconds,
    0,
    Math.max(0.001, options.maxDeltaSeconds ?? DEFAULT_MAX_DELTA_SECONDS),
  );
  const elapsedSeconds = pedestrians.elapsedSeconds + safeDeltaSeconds;
  const tickedAgents = dedupeHomeDrivePedestrianAgentsById(
    pedestrians.agents.map((agent) => {
      return tickAgentIfScheduled(agent, pedestrians, safeDeltaSeconds, options);
    }),
  );
  const populationResult = repopulateHomeDrivePedestrianPopulationRuntime({
    agents: tickedAgents,
    zones: pedestrians.zones,
    seed: options.seed ?? pedestrians.seed,
    elapsedSeconds,
    populationRuntime: pedestrians.populationRuntime,
    options: {
      ...options,
      enabled: options.populationEnabled ?? options.enabled ?? true,
      activeCenter: options.activeCenter,
      activeHeadingRad: options.activeHeadingRad,
      activeSpeedMps: options.activeSpeedMps,
      seed: options.seed ?? pedestrians.seed,
    },
  });

  return {
    ...pedestrians,
    agents: populationResult.agents,
    elapsedSeconds,
    populationRuntime: populationResult.populationRuntime,
  };
}

export function getHomeDrivePedestrianAgentsNearPosition(
  pedestrians: HomeDrivePedestrianRuntimeState,
  position: Readonly<{ x: number; z: number }>,
  radiusMeters: number,
): readonly HomeDrivePedestrianAgent[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return pedestrians.agents.filter((agent) => {
    return getDistanceSquared(agent.position, position) <= radiusSquared;
  });
}
