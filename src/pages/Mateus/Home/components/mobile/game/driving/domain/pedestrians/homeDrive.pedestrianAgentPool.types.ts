// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianAgentPool.types.ts

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianAgentPool = Readonly<{
  availableAgents: readonly HomeDrivePedestrianAgent[];
  maxSize: number;
  releasedCount: number;
  acquiredCount: number;
}>;

export type HomeDrivePedestrianAgentPoolOptions = Readonly<{
  maxSize?: number;
}>;

export type HomeDrivePedestrianAgentPoolAcquireResult = Readonly<{
  agent: HomeDrivePedestrianAgent | null;
  pool: HomeDrivePedestrianAgentPool;
}>;

export type HomeDrivePedestrianAgentPoolReleaseResult = Readonly<{
  pool: HomeDrivePedestrianAgentPool;
  releasedAgents: readonly HomeDrivePedestrianAgent[];
}>;

export type HomeDrivePedestrianAgentPoolReuseFactory = (
  pooledAgent: HomeDrivePedestrianAgent,
  index: number,
) => HomeDrivePedestrianAgent;
