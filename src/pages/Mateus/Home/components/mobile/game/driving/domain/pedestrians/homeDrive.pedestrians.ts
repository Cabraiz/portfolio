// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.ts

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
  getHomeDrivePedestrianZoneById,
  resolveHomeDrivePedestrianSidewalkProgressAfterDistance,
} from "./homeDrive.pedestrianSidewalks";

const DEFAULT_PEDESTRIAN_SEED = 7429;
const DEFAULT_MAX_PEDESTRIANS = 118;
const DEFAULT_PEDESTRIAN_DENSITY = 0.72;
const DEFAULT_MAX_DELTA_SECONDS = 0.08;
const SPEED_RESPONSE_PER_SECOND = 5.8;

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
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
  const lateralOffsetMeters = member.groupSideOffsetMeters + seededRange(memberSeed, 701, -0.18, 0.18);
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

    behaviorElapsedSeconds: seededRange(memberSeed, 709, 0, behaviorAssignment.durationSeconds * 0.45),
    behaviorDurationSeconds: behaviorAssignment.durationSeconds,
    animationPhase: seededRange(memberSeed, 719, 0, Math.PI * 2),
    idleLookYawRad: seededRange(memberSeed, 727, -0.32, 0.32),

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

function tickAgent(
  agent: HomeDrivePedestrianAgent,
  zone: HomeDrivePedestrianSidewalkZone,
  deltaSeconds: number,
  elapsedSeconds: number,
): HomeDrivePedestrianAgent {
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
  options: HomeDrivePedestrianTickOptions = {},
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

      return tickAgent(agent, zone, deltaSeconds, elapsedSeconds);
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
