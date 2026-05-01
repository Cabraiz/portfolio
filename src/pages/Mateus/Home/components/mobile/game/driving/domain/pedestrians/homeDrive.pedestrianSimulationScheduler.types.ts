// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSimulationScheduler.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianSimulationTier =
  | "crosswalk"
  | "hot"
  | "warm"
  | "cold"
  | "sleep";

export type HomeDrivePedestrianSimulationSchedulerOptions = Readonly<{
  activeCenter?: HomeDriveVector2;
  tickIndex?: number;

  hotRadiusMeters?: number;
  warmRadiusMeters?: number;
  coldRadiusMeters?: number;

  hotModulo?: number;
  warmModulo?: number;
  coldModulo?: number;
  sleepModulo?: number;

  alwaysTickCrosswalkAgents?: boolean;
}>;

export type HomeDrivePedestrianSimulationScheduleEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  tier: HomeDrivePedestrianSimulationTier;
  distanceSquared: number;
  shouldTick: boolean;
  tickModulo: number;
}>;

export type HomeDrivePedestrianSimulationSchedule = Readonly<{
  entries: readonly HomeDrivePedestrianSimulationScheduleEntry[];
  tickableAgents: readonly HomeDrivePedestrianAgent[];
  skippedAgents: readonly HomeDrivePedestrianAgent[];
  countsByTier: Readonly<Record<HomeDrivePedestrianSimulationTier, number>>;
  tickedByTier: Readonly<Record<HomeDrivePedestrianSimulationTier, number>>;
}>;

export type HomeDrivePedestrianSimulationTierConfig = Readonly<{
  tier: HomeDrivePedestrianSimulationTier;
  radiusMeters: number;
  tickModulo: number;
}>;
