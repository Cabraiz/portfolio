// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianAgentPool.ts

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianAgentPool,
  HomeDrivePedestrianAgentPoolAcquireResult,
  HomeDrivePedestrianAgentPoolOptions,
  HomeDrivePedestrianAgentPoolReleaseResult,
  HomeDrivePedestrianAgentPoolReuseFactory,
} from "./homeDrive.pedestrianAgentPool.types";

const DEFAULT_AGENT_POOL_MAX_SIZE = 320;

export function createHomeDrivePedestrianAgentPool(
  options: HomeDrivePedestrianAgentPoolOptions = {},
): HomeDrivePedestrianAgentPool {
  return {
    availableAgents: [],
    maxSize: Math.max(0, Math.floor(options.maxSize ?? DEFAULT_AGENT_POOL_MAX_SIZE)),
    releasedCount: 0,
    acquiredCount: 0,
  };
}

export function releaseHomeDrivePedestrianAgentsToPool(
  pool: HomeDrivePedestrianAgentPool | null | undefined,
  agents: readonly HomeDrivePedestrianAgent[],
  options: HomeDrivePedestrianAgentPoolOptions = {},
): HomeDrivePedestrianAgentPoolReleaseResult {
  const current = pool ?? createHomeDrivePedestrianAgentPool(options);
  const reusableAgents = agents.filter((agent) => !agent.crosswalkId);
  const capacity = Math.max(0, current.maxSize - current.availableAgents.length);
  const releasedAgents = reusableAgents.slice(0, capacity);
  const nextPool: HomeDrivePedestrianAgentPool = {
    ...current,
    availableAgents: [...releasedAgents, ...current.availableAgents].slice(
      0,
      current.maxSize,
    ),
    releasedCount: current.releasedCount + releasedAgents.length,
  };

  return {
    pool: nextPool,
    releasedAgents,
  };
}

export function acquireHomeDrivePedestrianAgentFromPool(
  pool: HomeDrivePedestrianAgentPool | null | undefined,
  reuseFactory?: HomeDrivePedestrianAgentPoolReuseFactory,
): HomeDrivePedestrianAgentPoolAcquireResult {
  const current = pool ?? createHomeDrivePedestrianAgentPool();

  if (current.availableAgents.length <= 0) {
    return {
      agent: null,
      pool: current,
    };
  }

  const [pooledAgent, ...remainingAgents] = current.availableAgents;
  const reusedAgent = reuseFactory ? reuseFactory(pooledAgent, current.acquiredCount) : pooledAgent;

  return {
    agent: reusedAgent,
    pool: {
      ...current,
      availableAgents: remainingAgents,
      acquiredCount: current.acquiredCount + 1,
    },
  };
}

export function acquireHomeDrivePedestrianAgentsFromPool(
  pool: HomeDrivePedestrianAgentPool | null | undefined,
  count: number,
  reuseFactory?: HomeDrivePedestrianAgentPoolReuseFactory,
): Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  pool: HomeDrivePedestrianAgentPool;
}> {
  const agents: HomeDrivePedestrianAgent[] = [];
  let nextPool = pool ?? createHomeDrivePedestrianAgentPool();

  for (let index = 0; index < Math.max(0, count); index += 1) {
    const acquired = acquireHomeDrivePedestrianAgentFromPool(
      nextPool,
      reuseFactory
        ? (pooledAgent) => reuseFactory(pooledAgent, agents.length)
        : undefined,
    );

    nextPool = acquired.pool;

    if (!acquired.agent) {
      break;
    }

    agents.push(acquired.agent);
  }

  return {
    agents,
    pool: nextPool,
  };
}

export function trimHomeDrivePedestrianAgentPool(
  pool: HomeDrivePedestrianAgentPool,
  maxSize: number,
): HomeDrivePedestrianAgentPool {
  const safeMaxSize = Math.max(0, Math.floor(maxSize));

  return {
    ...pool,
    maxSize: safeMaxSize,
    availableAgents: pool.availableAgents.slice(0, safeMaxSize),
  };
}
