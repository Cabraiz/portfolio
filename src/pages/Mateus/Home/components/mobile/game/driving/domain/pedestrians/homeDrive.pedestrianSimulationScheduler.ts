// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSimulationScheduler.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianSimulationSchedule,
  HomeDrivePedestrianSimulationScheduleEntry,
  HomeDrivePedestrianSimulationSchedulerOptions,
  HomeDrivePedestrianSimulationTier,
  HomeDrivePedestrianSimulationTierConfig,
} from "./homeDrive.pedestrianSimulationScheduler.types";

const DEFAULT_HOT_RADIUS_METERS = 160;
const DEFAULT_WARM_RADIUS_METERS = 380;
const DEFAULT_COLD_RADIUS_METERS = 760;

const DEFAULT_HOT_MODULO = 1;
const DEFAULT_WARM_MODULO = 3;
const DEFAULT_COLD_MODULO = 9;
const DEFAULT_SLEEP_MODULO = 17;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getSafeModulo(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value ?? fallback));
}

function createEmptyTierCounts(): Record<HomeDrivePedestrianSimulationTier, number> {
  return {
    crosswalk: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    sleep: 0,
  };
}

export function getHomeDrivePedestrianSimulationTierConfigs(
  options: HomeDrivePedestrianSimulationSchedulerOptions = {},
): readonly HomeDrivePedestrianSimulationTierConfig[] {
  const hotRadiusMeters = Math.max(1, options.hotRadiusMeters ?? DEFAULT_HOT_RADIUS_METERS);
  const warmRadiusMeters = Math.max(
    hotRadiusMeters,
    options.warmRadiusMeters ?? DEFAULT_WARM_RADIUS_METERS,
  );
  const coldRadiusMeters = Math.max(
    warmRadiusMeters,
    options.coldRadiusMeters ?? DEFAULT_COLD_RADIUS_METERS,
  );

  return [
    {
      tier: "hot",
      radiusMeters: hotRadiusMeters,
      tickModulo: getSafeModulo(options.hotModulo, DEFAULT_HOT_MODULO),
    },
    {
      tier: "warm",
      radiusMeters: warmRadiusMeters,
      tickModulo: getSafeModulo(options.warmModulo, DEFAULT_WARM_MODULO),
    },
    {
      tier: "cold",
      radiusMeters: coldRadiusMeters,
      tickModulo: getSafeModulo(options.coldModulo, DEFAULT_COLD_MODULO),
    },
    {
      tier: "sleep",
      radiusMeters: Number.POSITIVE_INFINITY,
      tickModulo: getSafeModulo(options.sleepModulo, DEFAULT_SLEEP_MODULO),
    },
  ];
}

export function classifyHomeDrivePedestrianSimulationTier(
  agent: HomeDrivePedestrianAgent,
  options: HomeDrivePedestrianSimulationSchedulerOptions = {},
): Readonly<{
  tier: HomeDrivePedestrianSimulationTier;
  distanceSquared: number;
  tickModulo: number;
}> {
  if (agent.crosswalkId && (options.alwaysTickCrosswalkAgents ?? true)) {
    return {
      tier: "crosswalk",
      distanceSquared: 0,
      tickModulo: 1,
    };
  }

  if (!options.activeCenter) {
    return {
      tier: "hot",
      distanceSquared: 0,
      tickModulo: getSafeModulo(options.hotModulo, DEFAULT_HOT_MODULO),
    };
  }

  const distanceSquared = getDistanceSquared(agent.position, options.activeCenter);
  const configs = getHomeDrivePedestrianSimulationTierConfigs(options);

  for (const config of configs) {
    if (distanceSquared <= config.radiusMeters * config.radiusMeters) {
      return {
        tier: config.tier,
        distanceSquared,
        tickModulo: config.tickModulo,
      };
    }
  }

  return {
    tier: "sleep",
    distanceSquared,
    tickModulo: getSafeModulo(options.sleepModulo, DEFAULT_SLEEP_MODULO),
  };
}

export function shouldTickHomeDrivePedestrianBySchedule(
  agent: HomeDrivePedestrianAgent,
  tickModulo: number,
  tickIndex: number,
): boolean {
  const safeModulo = Math.max(1, Math.floor(tickModulo));

  if (safeModulo <= 1) {
    return true;
  }

  return Math.abs(agent.seed + tickIndex) % safeModulo === 0;
}

export function createHomeDrivePedestrianSimulationSchedule(
  agents: readonly HomeDrivePedestrianAgent[],
  options: HomeDrivePedestrianSimulationSchedulerOptions = {},
): HomeDrivePedestrianSimulationSchedule {
  const tickIndex = Math.max(0, Math.floor(options.tickIndex ?? 0));
  const entries: HomeDrivePedestrianSimulationScheduleEntry[] = [];
  const tickableAgents: HomeDrivePedestrianAgent[] = [];
  const skippedAgents: HomeDrivePedestrianAgent[] = [];
  const countsByTier = createEmptyTierCounts();
  const tickedByTier = createEmptyTierCounts();

  agents.forEach((agent) => {
    const classification = classifyHomeDrivePedestrianSimulationTier(agent, options);
    const shouldTick = shouldTickHomeDrivePedestrianBySchedule(
      agent,
      classification.tickModulo,
      tickIndex,
    );
    const entry: HomeDrivePedestrianSimulationScheduleEntry = {
      agent,
      tier: classification.tier,
      distanceSquared: classification.distanceSquared,
      tickModulo: classification.tickModulo,
      shouldTick,
    };

    entries.push(entry);
    countsByTier[classification.tier] += 1;

    if (shouldTick) {
      tickableAgents.push(agent);
      tickedByTier[classification.tier] += 1;
    } else {
      skippedAgents.push(agent);
    }
  });

  return {
    entries,
    tickableAgents,
    skippedAgents,
    countsByTier,
    tickedByTier,
  };
}

export function shouldTickHomeDrivePedestrianAgent(
  agent: HomeDrivePedestrianAgent,
  options: HomeDrivePedestrianSimulationSchedulerOptions = {},
): boolean {
  const tickIndex = Math.max(0, Math.floor(options.tickIndex ?? 0));
  const classification = classifyHomeDrivePedestrianSimulationTier(agent, options);

  return shouldTickHomeDrivePedestrianBySchedule(
    agent,
    classification.tickModulo,
    tickIndex,
  );
}
