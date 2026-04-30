// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.ts

import {
  canHomeDrivePedestrianEnterCrosswalk,
  findNearestHomeDriveCrosswalk,
  getHomeDriveCrosswalkPointAtProgress,
  getHomeDriveCrosswalkSideForPoint,
} from "../crosswalks";
import type { HomeDriveCrosswalk } from "../crosswalks";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianGenerationOptions,
  HomeDrivePedestrianGroupDraft,
  HomeDrivePedestrianRuntimeState,
  HomeDrivePedestrianSidewalkZone,
  HomeDrivePedestrianTickOptions,
} from "./homeDrive.pedestrians.types";
import {
  createHomeDrivePedestrianBehaviorAssignment,
  getHomeDrivePedestrianBaseSpeedMps,
  shouldHomeDrivePedestrianMove,
} from "./homeDrive.pedestrianBehaviors";
import { createHomeDrivePedestrianGroupDraft } from "./homeDrive.pedestrianGroups";
import {
  clamp,
  createHomeDrivePedestrianAppearance,
  createHomeDrivePedestrianSeed,
  seededRange,
} from "./homeDrive.pedestrianRandom";
import {
  buildHomeDrivePedestrianSidewalkZones,
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
  getHomeDrivePedestrianSidewalkSlotCount,
  getHomeDrivePedestrianSideForCrosswalkSide,
  getHomeDrivePedestrianZoneById,
  getHomeDrivePedestrianZoneBySegmentAndSide,
  resolveHomeDrivePedestrianSidewalkProgressAfterDistance,
} from "./homeDrive.pedestrianSidewalks";

const DEFAULT_PEDESTRIAN_SEED = 7429;
const DEFAULT_MAX_PEDESTRIANS = 220;
const DEFAULT_PEDESTRIAN_DENSITY = 1.08;
const DEFAULT_MAX_DELTA_SECONDS = 0.12;
const SPEED_RESPONSE_PER_SECOND = 5.8;

type HomeDrivePedestrianPerformanceTickOptions =
  HomeDrivePedestrianTickOptions &
    Readonly<{
      activeCenter?: Readonly<{ x: number; z: number }>;
      activeRadiusMeters?: number;
      warmRadiusMeters?: number;
      warmTickModulo?: number;
      coldTickModulo?: number;
      tickIndex?: number;
    }>;

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function shouldTickAgentForPerformance(
  agent: HomeDrivePedestrianAgent,
  options: HomeDrivePedestrianPerformanceTickOptions,
): boolean {
  if (agent.crosswalkId) {
    return true;
  }

  if (!options.activeCenter) {
    return true;
  }

  const activeRadiusMeters = Math.max(1, options.activeRadiusMeters ?? 180);
  const warmRadiusMeters = Math.max(
    activeRadiusMeters,
    options.warmRadiusMeters ?? activeRadiusMeters * 1.85,
  );
  const distanceSquared = getDistanceSquared(agent.position, options.activeCenter);

  if (distanceSquared <= activeRadiusMeters * activeRadiusMeters) {
    return true;
  }

  const tickIndex = Math.max(0, options.tickIndex ?? 0);

  if (distanceSquared <= warmRadiusMeters * warmRadiusMeters) {
    const modulo = Math.max(1, options.warmTickModulo ?? 3);

    return Math.abs(agent.seed + tickIndex) % modulo === 0;
  }

  const modulo = Math.max(1, options.coldTickModulo ?? 9);

  return Math.abs(agent.seed + tickIndex) % modulo === 0;
}

function createAgentFromGroupMember(
  group: HomeDrivePedestrianGroupDraft,
  zone: HomeDrivePedestrianSidewalkZone,
  memberIndex: number,
): HomeDrivePedestrianAgent {
  const member = group.members[memberIndex];
  const memberSeed = createHomeDrivePedestrianSeed(
    group.id,
    group.seed,
    memberIndex,
    zone.lengthMeters,
  );
  const appearance = createHomeDrivePedestrianAppearance(member.role, memberSeed);
  const baseSpeedMps = Math.min(
    group.baseSpeedMps,
    getHomeDrivePedestrianBaseSpeedMps(
      member.role,
      appearance.walkStyleKey,
      memberSeed,
    ),
  );
  const behaviorAssignment = createHomeDrivePedestrianBehaviorAssignment({
    role: member.role,
    zone,
    seed: memberSeed,
    baseSpeedMps,
    existingProps: member.props,
    behaviorHint: member.behaviorHint,
  });
  const progress = group.progress;
  const lateralOffsetMeters =
    member.groupSideOffsetMeters + seededRange(memberSeed, 701, -0.18, 0.18);
  const position = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    lateralOffsetMeters,
  );
  const id = `ped-${group.id}-${memberIndex}`;
  const handHoldTargetId =
    member.handHoldPeerIndex === null
      ? null
      : `ped-${group.id}-${member.handHoldPeerIndex}`;

  return {
    id,
    groupId: group.id,
    groupKind: group.kind,
    groupMemberIndex: memberIndex,
    handHoldTargetId,

    role: member.role,
    behavior: behaviorAssignment.behavior,
    animationKey: behaviorAssignment.animationKey,
    props: behaviorAssignment.props,
    appearance,

    zoneId: zone.id,
    segmentId: zone.segmentId,
    sidewalkSide: zone.side,
    progress,
    directionSign: group.directionSign,
    position,
    headingRad: getHomeDrivePedestrianHeadingRadians(zone, group.directionSign),

    speedMps: behaviorAssignment.targetSpeedMps,
    baseSpeedMps,
    targetSpeedMps: behaviorAssignment.targetSpeedMps,
    lateralOffsetMeters,
    forwardOffsetMeters: member.groupForwardOffsetMeters,

    behaviorElapsedSeconds: seededRange(
      memberSeed,
      709,
      0,
      behaviorAssignment.durationSeconds * 0.45,
    ),
    behaviorDurationSeconds: behaviorAssignment.durationSeconds,
    animationPhase: seededRange(memberSeed, 719, 0, Math.PI * 2),
    idleLookYawRad: seededRange(memberSeed, 727, -0.32, 0.32),

    crosswalkId: null,
    crossingDirection: undefined,
    crossingProgress: undefined,
    crossingStartedAtSeconds: undefined,
    crossingDurationSeconds: undefined,
    crossingStart: undefined,
    crossingEnd: undefined,

    seed: memberSeed,
  };
}

function createAgentsForGroup(
  group: HomeDrivePedestrianGroupDraft,
  zone: HomeDrivePedestrianSidewalkZone,
): readonly HomeDrivePedestrianAgent[] {
  return group.members.map((_, memberIndex) => {
    return createAgentFromGroupMember(group, zone, memberIndex);
  });
}

function createPedestrianAgents(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  options: HomeDrivePedestrianGenerationOptions,
): readonly HomeDrivePedestrianAgent[] {
  const density = options.density ?? DEFAULT_PEDESTRIAN_DENSITY;
  const maxPedestrians = options.maxPedestrians ?? DEFAULT_MAX_PEDESTRIANS;
  const seed = options.seed ?? DEFAULT_PEDESTRIAN_SEED;
  const agents: HomeDrivePedestrianAgent[] = [];

  for (const zone of zones) {
    if (agents.length >= maxPedestrians) {
      break;
    }

    const slotCount = getHomeDrivePedestrianSidewalkSlotCount(zone, density);

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      if (agents.length >= maxPedestrians) {
        break;
      }

      const group = createHomeDrivePedestrianGroupDraft({
        zone,
        slotIndex,
        slotCount,
        seed,
      });
      const groupAgents = createAgentsForGroup(group, zone);

      for (const agent of groupAgents) {
        if (agents.length >= maxPedestrians) {
          break;
        }

        agents.push(agent);
      }
    }
  }

  return agents;
}

export function createInitialHomeDrivePedestrianState(
  options: HomeDrivePedestrianGenerationOptions = {},
): HomeDrivePedestrianRuntimeState {
  if (options.enabled === false) {
    return {
      agents: [],
      zones: [],
      elapsedSeconds: 0,
      seed: options.seed ?? DEFAULT_PEDESTRIAN_SEED,
    };
  }

  const zones = buildHomeDrivePedestrianSidewalkZones({
    minRoadLengthMeters: options.minRoadLengthMeters,
    maxRoads: options.maxRoads,
    density: options.density,
  });

  return {
    agents: createPedestrianAgents(zones, options),
    zones,
    elapsedSeconds: 0,
    seed: options.seed ?? DEFAULT_PEDESTRIAN_SEED,
  };
}

function shouldRefreshBehavior(agent: HomeDrivePedestrianAgent): boolean {
  return agent.behaviorElapsedSeconds >= agent.behaviorDurationSeconds;
}

function refreshAgentBehavior(
  agent: HomeDrivePedestrianAgent,
  zone: HomeDrivePedestrianSidewalkZone,
  elapsedSeconds: number,
): HomeDrivePedestrianAgent {
  const behaviorSeed = createHomeDrivePedestrianSeed(
    agent.id,
    agent.seed,
    Math.floor(elapsedSeconds * 10),
  );
  const behaviorAssignment = createHomeDrivePedestrianBehaviorAssignment({
    role: agent.role,
    zone,
    seed: behaviorSeed,
    baseSpeedMps: agent.baseSpeedMps,
    existingProps: agent.props,
  });

  return {
    ...agent,
    behavior: behaviorAssignment.behavior,
    animationKey: behaviorAssignment.animationKey,
    props: behaviorAssignment.props,
    targetSpeedMps: behaviorAssignment.targetSpeedMps,
    behaviorElapsedSeconds: 0,
    behaviorDurationSeconds: behaviorAssignment.durationSeconds,
    idleLookYawRad: seededRange(behaviorSeed, 809, -0.34, 0.34),
  };
}

function shouldAgentConsiderCrossing(
  agent: HomeDrivePedestrianAgent,
  elapsedSeconds: number,
): boolean {
  if (
    agent.behavior === "smoke" ||
    agent.behavior === "phone" ||
    agent.behavior === "talk" ||
    agent.behavior === "cross-wait" ||
    agent.behavior === "cross-walk" ||
    agent.behavior === "cross-run" ||
    agent.behavior === "cross-panic"
  ) {
    return false;
  }

  if (agent.role === "child" && agent.groupKind !== "adult-child") {
    return false;
  }

  const decisionTick = Math.floor(elapsedSeconds * 1.25);
  const decisionSeed = Math.abs(
    Math.sin(agent.seed * 97.13 + decisionTick * 12.71),
  );

  if (agent.behavior === "wait-crossing") {
    return decisionSeed > 0.2;
  }

  if (agent.role === "runner") {
    return decisionSeed > 0.92;
  }

  return decisionSeed > 0.965;
}

function getCrossingSpeedMultiplier(agent: HomeDrivePedestrianAgent): number {
  switch (agent.role) {
    case "runner":
      return 1.42;

    case "child":
      return 0.78;

    case "elder":
      return 0.66;

    case "shopper":
      return 0.82;

    case "parent":
      return 0.74;

    default:
      return 1;
  }
}

function getHeadingBetweenPoints(
  from: Readonly<{ x: number; z: number }>,
  to: Readonly<{ x: number; z: number }>,
): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

function beginAgentCrosswalk(
  agent: HomeDrivePedestrianAgent,
  crosswalk: HomeDriveCrosswalk,
  elapsedSeconds: number,
): HomeDrivePedestrianAgent {
  const currentSide = getHomeDriveCrosswalkSideForPoint(
    crosswalk,
    agent.position,
  );
  const direction = currentSide === -1 ? 1 : -1;
  const start = getHomeDriveCrosswalkPointAtProgress(crosswalk, direction, 0);
  const end = getHomeDriveCrosswalkPointAtProgress(crosswalk, direction, 1);
  const durationSeconds = clamp(
    crosswalk.widthMeters /
      Math.max(0.48, agent.baseSpeedMps * getCrossingSpeedMultiplier(agent)),
    3.2,
    12.5,
  );
  const panicSeed = Math.abs(Math.sin(agent.seed * 33.17 + elapsedSeconds));
  const behavior =
    agent.role === "runner"
      ? "cross-run"
      : panicSeed > 0.985
        ? "cross-panic"
        : "cross-walk";

  return {
    ...agent,
    behavior,
    animationKey:
      behavior === "cross-run" || behavior === "cross-panic"
        ? "fast-walk"
        : agent.role === "child"
          ? "child-walk"
          : "walk",
    targetSpeedMps: agent.baseSpeedMps * getCrossingSpeedMultiplier(agent),
    speedMps: Math.max(agent.speedMps, agent.baseSpeedMps * 0.8),
    crosswalkId: crosswalk.id,
    crossingDirection: direction,
    crossingProgress: 0,
    crossingStartedAtSeconds: elapsedSeconds,
    crossingDurationSeconds: durationSeconds,
    crossingStart: start,
    crossingEnd: end,
    position: start,
    headingRad: getHeadingBetweenPoints(start, end),
    behaviorElapsedSeconds: 0,
    behaviorDurationSeconds: durationSeconds,
  };
}

function finishAgentCrosswalk(
  agent: HomeDrivePedestrianAgent,
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  crosswalk: HomeDriveCrosswalk,
): HomeDrivePedestrianAgent {
  const endSide = agent.crossingDirection === 1 ? 1 : -1;
  const nextSide = getHomeDrivePedestrianSideForCrosswalkSide(endSide);
  const nextZone = getHomeDrivePedestrianZoneBySegmentAndSide(
    zones,
    crosswalk.segmentId,
    nextSide,
  );

  if (!nextZone) {
    return {
      ...agent,
      behavior: "walk",
      crosswalkId: null,
      crossingProgress: undefined,
      crossingDirection: undefined,
      crossingStartedAtSeconds: undefined,
      crossingDurationSeconds: undefined,
      crossingStart: undefined,
      crossingEnd: undefined,
    };
  }

  return {
    ...agent,
    behavior: "walk",
    animationKey:
      agent.role === "runner"
        ? "fast-walk"
        : agent.role === "child"
          ? "child-walk"
          : "walk",
    zoneId: nextZone.id,
    segmentId: nextZone.segmentId,
    sidewalkSide: nextZone.side,
    progress: crosswalk.t,
    position: getHomeDrivePedestrianPointOnSidewalk(
      nextZone,
      crosswalk.t,
      agent.lateralOffsetMeters,
    ),
    headingRad: getHomeDrivePedestrianHeadingRadians(
      nextZone,
      agent.directionSign,
    ),
    targetSpeedMps: agent.baseSpeedMps,
    crosswalkId: null,
    crossingProgress: undefined,
    crossingDirection: undefined,
    crossingStartedAtSeconds: undefined,
    crossingDurationSeconds: undefined,
    crossingStart: undefined,
    crossingEnd: undefined,
    behaviorElapsedSeconds: 0,
    behaviorDurationSeconds: 4.5,
  };
}

function tickAgentCrossing(
  agent: HomeDrivePedestrianAgent,
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  elapsedSeconds: number,
  deltaSeconds: number,
  crosswalks: NonNullable<HomeDrivePedestrianTickOptions["crosswalks"]>,
): HomeDrivePedestrianAgent {
  const crosswalk = crosswalks.crosswalks.find((item) => {
    return item.id === agent.crosswalkId;
  });

  if (!crosswalk || !agent.crossingDirection) {
    return {
      ...agent,
      crosswalkId: null,
      crossingProgress: undefined,
      crossingDirection: undefined,
      crossingStartedAtSeconds: undefined,
      crossingDurationSeconds: undefined,
    };
  }

  const currentProgress = agent.crossingProgress ?? 0;
  const durationSeconds = Math.max(0.1, agent.crossingDurationSeconds ?? 5);
  const nextProgress = clamp(
    currentProgress + deltaSeconds / durationSeconds,
    0,
    1,
  );
  const position = getHomeDriveCrosswalkPointAtProgress(
    crosswalk,
    agent.crossingDirection,
    nextProgress,
  );
  const start = getHomeDriveCrosswalkPointAtProgress(
    crosswalk,
    agent.crossingDirection,
    Math.max(0, nextProgress - 0.02),
  );

  if (nextProgress >= 1) {
    return finishAgentCrosswalk(agent, zones, crosswalk);
  }

  return {
    ...agent,
    position,
    headingRad: getHeadingBetweenPoints(start, position),
    crossingProgress: nextProgress,
    speedMps: moveTowards(
      agent.speedMps,
      agent.targetSpeedMps,
      SPEED_RESPONSE_PER_SECOND * deltaSeconds,
    ),
    behaviorElapsedSeconds: agent.behaviorElapsedSeconds + deltaSeconds,
    animationPhase:
      agent.animationPhase +
      deltaSeconds * clamp(Math.max(0.35, agent.speedMps) * 5.6, 1.2, 10.5),
  };
}

function tickAgent(
  agent: HomeDrivePedestrianAgent,
  zone: HomeDrivePedestrianSidewalkZone,
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  deltaSeconds: number,
  elapsedSeconds: number,
  crosswalks?: HomeDrivePedestrianTickOptions["crosswalks"],
): HomeDrivePedestrianAgent {
  if (agent.crosswalkId && crosswalks) {
    return tickAgentCrossing(
      agent,
      zones,
      elapsedSeconds,
      deltaSeconds,
      crosswalks,
    );
  }

  if (crosswalks && shouldAgentConsiderCrossing(agent, elapsedSeconds)) {
    const nearestCrosswalk = findNearestHomeDriveCrosswalk(
      crosswalks,
      agent.position,
      18 + (agent.behavior === "wait-crossing" ? 18 : 0),
    );

    if (
      nearestCrosswalk &&
      canHomeDrivePedestrianEnterCrosswalk(
        nearestCrosswalk.crosswalk,
        crosswalks.elapsedSeconds,
      )
    ) {
      return beginAgentCrosswalk(
        agent,
        nearestCrosswalk.crosswalk,
        elapsedSeconds,
      );
    }
  }

  const behaviorAgent = shouldRefreshBehavior(agent)
    ? refreshAgentBehavior(agent, zone, elapsedSeconds)
    : agent;

  const speedMps = moveTowards(
    behaviorAgent.speedMps,
    behaviorAgent.targetSpeedMps,
    SPEED_RESPONSE_PER_SECOND * deltaSeconds,
  );
  const moving = shouldHomeDrivePedestrianMove(behaviorAgent.behavior);
  const distanceMeters = moving ? speedMps * deltaSeconds : 0;
  const progressState = resolveHomeDrivePedestrianSidewalkProgressAfterDistance(
    zone,
    behaviorAgent.progress,
    behaviorAgent.directionSign,
    distanceMeters,
  );
  const progress = progressState.progress;
  const position = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    behaviorAgent.lateralOffsetMeters,
  );
  const headingRad = moving
    ? getHomeDrivePedestrianHeadingRadians(zone, progressState.directionSign)
    : getHomeDrivePedestrianHeadingRadians(zone, behaviorAgent.directionSign) +
      behaviorAgent.idleLookYawRad;

  return {
    ...behaviorAgent,
    progress,
    directionSign: progressState.directionSign,
    position,
    headingRad,
    speedMps,
    behaviorElapsedSeconds: behaviorAgent.behaviorElapsedSeconds + deltaSeconds,
    animationPhase:
      behaviorAgent.animationPhase +
      deltaSeconds * clamp(Math.max(0.25, speedMps) * 5.2, 1.1, 9.8),
  };
}

export function tickHomeDrivePedestrians(
  state: HomeDrivePedestrianRuntimeState,
  rawDeltaSeconds: number,
  options: HomeDrivePedestrianPerformanceTickOptions = {},
): HomeDrivePedestrianRuntimeState {
  if (options.enabled === false || rawDeltaSeconds <= 0) {
    return state;
  }

  const deltaSeconds = clamp(
    rawDeltaSeconds,
    0,
    options.maxDeltaSeconds ?? DEFAULT_MAX_DELTA_SECONDS,
  );
  const elapsedSeconds = state.elapsedSeconds + deltaSeconds;

  return {
    ...state,
    elapsedSeconds,
    agents: state.agents.map((agent) => {
      const zone = getHomeDrivePedestrianZoneById(state.zones, agent.zoneId);

      if (!zone) {
        return agent;
      }

      if (!shouldTickAgentForPerformance(agent, options)) {
        return agent;
      }

      return tickAgent(
        agent,
        zone,
        state.zones,
        deltaSeconds,
        elapsedSeconds,
        options.crosswalks,
      );
    }),
  };
}

export function getHomeDrivePedestrianAgentsNearPosition(
  state: HomeDrivePedestrianRuntimeState,
  position: Readonly<{ x: number; z: number }>,
  radiusMeters: number,
): readonly HomeDrivePedestrianAgent[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return state.agents.filter((agent) => {
    const dx = agent.position.x - position.x;
    const dz = agent.position.z - position.z;

    return dx * dx + dz * dz <= radiusSquared;
  });
}
