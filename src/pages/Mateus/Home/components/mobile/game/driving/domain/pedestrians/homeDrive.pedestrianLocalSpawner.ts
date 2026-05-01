// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianLocalSpawner.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import { createHomeDrivePedestrianDistributedSlots } from "./homeDrive.pedestrianDistribution";
import { createHomeDrivePedestrianStreamingPlan } from "./homeDrive.pedestrianStreamingPlan";
import {
  releaseHomeDrivePedestrianReservoirSlots,
  updateHomeDrivePedestrianSpawnReservoir,
} from "./homeDrive.pedestrianSpawnReservoir";
import type { HomeDrivePedestrianDistributedSlot } from "./homeDrive.pedestrianDistribution.types";
import type { HomeDrivePedestrianStreamingSlot } from "./homeDrive.pedestrianStreaming.types";
import {
  createHomeDrivePedestrianBehaviorAssignment,
  getHomeDrivePedestrianBaseSpeedMps,
} from "./homeDrive.pedestrianBehaviors";
import { createHomeDrivePedestrianGroupDraft } from "./homeDrive.pedestrianGroups";
import {
  createHomeDriveLocalPedestrianAgentId,
  createHomeDriveLocalPedestrianGroupId,
  createHomeDrivePedestrianReservedIdSet,
  createHomeDrivePedestrianSpawnInstanceId,
  reserveHomeDrivePedestrianAgentId,
} from "./homeDrive.pedestrianIdentity";
import {
  createHomeDrivePedestrianAgentSpatialIndex,
  hasHomeDrivePedestrianSpatialItemNear,
  queryHomeDrivePedestrianSpatialIndex,
  type HomeDrivePedestrianAgentSpatialIndex,
} from "./homeDrive.pedestrianSpatialIndex";
import {
  createHomeDrivePedestrianAppearance,
  createHomeDrivePedestrianSeed,
  seededRange,
} from "./homeDrive.pedestrianRandom";
import {
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
} from "./homeDrive.pedestrianSidewalks";
import type {
  HomeDriveLocalPedestrianSpawnerOptions,
  HomeDriveLocalPedestrianSpawnerResult,
} from "./homeDrive.pedestrianPopulationRuntime.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianGroupDraft,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";

const DEFAULT_MIN_DISTANCE_FROM_EXISTING_AGENT_METERS = 4.25;
const DEFAULT_MIN_DISTANCE_FROM_ACCEPTED_LOCAL_AGENT_METERS = 3.75;
const DEFAULT_LOCAL_DENSITY = 4.8;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getDistanceToSegmentSquared(
  point: HomeDriveVector2,
  from: HomeDriveVector2,
  to: HomeDriveVector2,
): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared <= 0.000001) {
    return getDistanceSquared(point, from);
  }

  const t = clamp(
    ((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared,
    0,
    1,
  );

  const closest = {
    x: from.x + dx * t,
    z: from.z + dz * t,
  };

  return getDistanceSquared(point, closest);
}

export function getHomeDrivePedestrianAgentsNearPosition(
  agents: readonly HomeDrivePedestrianAgent[],
  position: HomeDriveVector2,
  radiusMeters: number,
): readonly HomeDrivePedestrianAgent[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return agents.filter((agent) => {
    return getDistanceSquared(agent.position, position) <= radiusSquared;
  });
}

export function getHomeDrivePedestrianZonesNearPosition(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  position: HomeDriveVector2,
  radiusMeters: number,
): readonly HomeDrivePedestrianSidewalkZone[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return zones
    .filter((zone) => {
      return (
        getDistanceToSegmentSquared(position, zone.from, zone.to) <=
        radiusSquared
      );
    })
    .sort((first, second) => {
      const firstDistance = getDistanceToSegmentSquared(
        position,
        first.from,
        first.to,
      );
      const secondDistance = getDistanceToSegmentSquared(
        position,
        second.from,
        second.to,
      );

      if (Math.abs(firstDistance - secondDistance) > 0.0001) {
        return firstDistance - secondDistance;
      }

      return second.lengthMeters - first.lengthMeters;
    });
}

function isPositionTooCloseToAgents(
  position: HomeDriveVector2,
  agents: readonly HomeDrivePedestrianAgent[],
  minDistanceMeters: number,
): boolean {
  const minDistanceSquared = minDistanceMeters * minDistanceMeters;

  return agents.some((agent) => {
    return getDistanceSquared(position, agent.position) <= minDistanceSquared;
  });
}

function isPositionTooCloseToAgentIndex(
  position: HomeDriveVector2,
  index: HomeDrivePedestrianAgentSpatialIndex,
  minDistanceMeters: number,
): boolean {
  return hasHomeDrivePedestrianSpatialItemNear(index, position, minDistanceMeters);
}

function getPreferredGroupKindForLocalSpawn(
  slot: HomeDrivePedestrianDistributedSlot,
): HomeDrivePedestrianGroupKind | undefined {
  if (slot.preferredGroupKind) {
    return slot.preferredGroupKind;
  }

  if (slot.forceSolo || slot.crowdPressure >= 0.52 || slot.isCornerSlot) {
    return "solo";
  }

  return undefined;
}

function createLocalPedestrianIdentityInput(params: Readonly<{
  group: HomeDrivePedestrianGroupDraft;
  zone: HomeDrivePedestrianSidewalkZone;
  slot: HomeDrivePedestrianDistributedSlot;
  generationSerial: number;
  spawnInstanceId: string;
}>) {
  return {
    namespace: "local" as const,
    generationSerial: 0,
    agentSerial: params.group.seed,
    slotIndex: params.slot.slotIndex,
    slotId: params.slot.id,
    zoneId: params.zone.id,
    segmentId: params.zone.segmentId,
    sidewalkSide: params.zone.side,
    groupKind: params.group.kind,
    slotSeed: params.slot.seed,
    seed: params.group.seed,
    progress: params.group.progress,
    groupId: params.group.id,
    salt: params.spawnInstanceId,
  };
}

function createAgentFromLocalGroupMember(params: Readonly<{
  group: HomeDrivePedestrianGroupDraft;
  zone: HomeDrivePedestrianSidewalkZone;
  slot: HomeDrivePedestrianDistributedSlot;
  memberIndex: number;
  generationSerial: number;
  spawnInstanceId: string;
}>): HomeDrivePedestrianAgent {
  const { group, zone, slot, memberIndex, generationSerial, spawnInstanceId } = params;
  const member = group.members[memberIndex];
  const identityInput = createLocalPedestrianIdentityInput({
    group,
    zone,
    slot,
    generationSerial,
    spawnInstanceId,
  });
  const localGroupId = createHomeDriveLocalPedestrianGroupId(identityInput);
  const memberSeed = createHomeDrivePedestrianSeed(
    localGroupId,
    group.seed,
    memberIndex,
    zone.lengthMeters,
    generationSerial,
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
    behaviorHint: slot.preferredBehavior ?? member.behaviorHint,
  });

  const progress = group.progress;
  const lateralOffsetMeters =
    slot.lateralOffsetMeters +
    member.groupSideOffsetMeters +
    seededRange(memberSeed, 701, -0.1, 0.1);

  const position = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    lateralOffsetMeters,
  );

  const id = createHomeDriveLocalPedestrianAgentId({
    ...identityInput,
    memberIndex,
  });

  const handHoldTargetId =
    member.handHoldPeerIndex === null
      ? null
      : createHomeDriveLocalPedestrianAgentId({
          ...identityInput,
          memberIndex: member.handHoldPeerIndex,
        });

  return {
    id,
    groupId: localGroupId,
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

function createAgentsForLocalSlot(params: Readonly<{
  slot: HomeDrivePedestrianDistributedSlot;
  seed: number;
  generationSerial: number;
  slotIndex: number;
  slotCount: number;
  spawnInstanceId: string;
}>): readonly HomeDrivePedestrianAgent[] {
  const { slot, seed, generationSerial, slotIndex, slotCount, spawnInstanceId } = params;
  const preferredKind = getPreferredGroupKindForLocalSpawn(slot);

  const group = createHomeDrivePedestrianGroupDraft({
    zone: slot.zone,
    slotIndex,
    slotCount,
    seed,
    progressOverride: slot.progress,
    directionSignOverride: slot.directionSign,
    preferredKind,
    groupKindBias: slot.groupKindBias,
    forceSolo: slot.forceSolo,
    crowdPressure: slot.crowdPressure,
  });

  return group.members.map((_, memberIndex) => {
    return createAgentFromLocalGroupMember({
      group,
      zone: slot.zone,
      slot,
      memberIndex,
      generationSerial,
      spawnInstanceId,
    });
  });
}

function getUniqueZones(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
): readonly HomeDrivePedestrianSidewalkZone[] {
  const byId = new Map<string, HomeDrivePedestrianSidewalkZone>();

  zones.forEach((zone) => {
    byId.set(zone.id, zone);
  });

  return Array.from(byId.values()).sort((first, second) => {
    return first.id.localeCompare(second.id);
  });
}

function getCrosswalkDemandCount(
  slots: readonly HomeDrivePedestrianStreamingSlot[],
): number {
  return slots.reduce((total, slot) => {
    return slot.spawnReason === "crosswalk-demand" ? total + 1 : total;
  }, 0);
}

function getSpawnedStreamingSlotId(
  slot: HomeDrivePedestrianDistributedSlot,
): string | null {
  return typeof slot.streamingSlotId === "string" ? slot.streamingSlotId : null;
}

function emptySpawnerResult(
  options: HomeDriveLocalPedestrianSpawnerOptions,
  nearAgentCount: number,
  streamingPlanId: string | null,
  streamingSectorCounts: HomeDriveLocalPedestrianSpawnerResult["streamingSectorCounts"],
  crosswalkDemandCount: number,
  spawnReservoir: HomeDriveLocalPedestrianSpawnerResult["spawnReservoir"],
): HomeDriveLocalPedestrianSpawnerResult {
  return {
    agents: [],
    activeZoneIds: [],
    nearAgentCount,
    spawnedAgentCount: 0,
    nextAgentSerial: options.lastAgentSerial,
    streamingPlanId,
    streamingSectorCounts,
    crosswalkDemandCount,
    spawnReservoir,
    warmRingSnapshot: options.warmRingSnapshot,
  };
}

export function createHomeDriveLocalPedestrianAgents(
  options: HomeDriveLocalPedestrianSpawnerOptions,
): HomeDriveLocalPedestrianSpawnerResult {
  const existingAgentSpatialIndex = createHomeDrivePedestrianAgentSpatialIndex(
    options.agents,
    18,
  );
  const nearAgents = queryHomeDrivePedestrianSpatialIndex(
    existingAgentSpatialIndex,
    {
      center: options.activeCenter,
      radiusMeters: options.populateRadiusMeters,
    },
  ).items;
  const remainingGlobalCapacity = Math.max(
    0,
    options.maxActivePedestrians - options.agents.length,
  );

  /**
   * Seed estável por macro-célula.
   *
   * Antes o seed dependia de elapsedSeconds/generationSerial; com carro rápido
   * isso fazia a mesma calçada gerar IDs novos o tempo todo. Agora a cidade
   * mantém identidade visual por zona/célula e o render só recicla slots.
   */
  const stableCenterTileX = Math.round(options.activeCenter.x / 96);
  const stableCenterTileZ = Math.round(options.activeCenter.z / 96);
  const localSeed =
    options.seed +
    stableCenterTileX * 73856093 +
    stableCenterTileZ * 19349663;

  const streamingPlan = createHomeDrivePedestrianStreamingPlan({
    agents: options.agents,
    zones: options.zones,
    activeCenter: options.activeCenter,
    activeHeadingRad: options.activeHeadingRad,
    activeSpeedMps: options.activeSpeedMps,
    elapsedSeconds: options.elapsedSeconds,
    seed: localSeed,
    populateRadiusMeters: options.populateRadiusMeters,
    localZoneSearchRadiusMeters: options.localZoneSearchRadiusMeters,
    maxSpawnPerRefresh: options.maxSpawnPerRefresh,
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
    crosswalks: options.crosswalks,
  });

  const reservoirUpdate = updateHomeDrivePedestrianSpawnReservoir({
    reservoir: options.spawnReservoir,
    slots: streamingPlan.spawnSlots,
    elapsedSeconds: options.elapsedSeconds,
  });

  const streamingSlots = reservoirUpdate.acceptedSlots;
  const neededAgentCount = Math.max(
    0,
    options.minPedestriansNearPlayer - nearAgents.length,
  );
  const spawnBudget = Math.min(
    Math.max(neededAgentCount, streamingSlots.length),
    remainingGlobalCapacity,
    Math.max(0, options.maxSpawnPerRefresh),
  );

  if (spawnBudget <= 0) {
    return emptySpawnerResult(
      options,
      nearAgents.length,
      streamingPlan.id,
      streamingPlan.sectorCounts,
      getCrosswalkDemandCount(streamingSlots),
      reservoirUpdate.reservoir,
    );
  }

  const zonesNearPlayer = getHomeDrivePedestrianZonesNearPosition(
    options.zones,
    options.activeCenter,
    options.localZoneSearchRadiusMeters,
  );
  const zonesForDistribution = getUniqueZones([
    ...zonesNearPlayer,
    ...streamingSlots.map((slot) => slot.zone),
    ...(options.warmRingSnapshot?.warmZones.map((warmZone) => warmZone.zone) ?? []),
  ]);

  if (zonesForDistribution.length <= 0) {
    return emptySpawnerResult(
      options,
      nearAgents.length,
      streamingPlan.id,
      streamingPlan.sectorCounts,
      getCrosswalkDemandCount(streamingSlots),
      reservoirUpdate.reservoir,
    );
  }

  const distributionMaxPedestrians = Math.max(
    spawnBudget * 2,
    spawnBudget + 24 + Math.floor(options.warmRingSnapshot?.recommendedSpawnBudgetBoost ?? 0),
  );
  const distribution = createHomeDrivePedestrianDistributedSlots({
    zones: zonesForDistribution,
    density: Math.max(DEFAULT_LOCAL_DENSITY, options.density),
    maxPedestrians: distributionMaxPedestrians,
    seed: localSeed,
    initialFocusCenter: options.activeCenter,
    initialFocusRadiusMeters: Math.max(
      options.populateRadiusMeters,
      options.frontLookaheadMeters ?? options.populateRadiusMeters,
      options.warmRingSnapshot?.recommendedPopulateRadiusMeters ?? 0,
    ),
    initialFocusPedestrianRatio: 1,
    maxInitialFocusPedestrians: distributionMaxPedestrians,
    streamingSlots,
    streamingPriorityBoost: 240 + Math.floor((options.warmRingSnapshot?.recommendedSpawnBudgetBoost ?? 0) * 2),
    profile: {
      maxPedestrians: distributionMaxPedestrians,
      density: Math.max(DEFAULT_LOCAL_DENSITY, options.density),
    },
  });

  const createdAgents: HomeDrivePedestrianAgent[] = [];
  const activeZoneIds = new Set<string>();
  const spawnedStreamingSlotIds = new Set<string>();
  const reservedAgentIds = createHomeDrivePedestrianReservedIdSet(options.agents);
  let nextAgentSerial = options.lastAgentSerial;
  for (const slot of distribution.slots) {
    if (createdAgents.length >= spawnBudget) {
      break;
    }

    if (
      isPositionTooCloseToAgentIndex(
        slot.worldPosition,
        existingAgentSpatialIndex,
        DEFAULT_MIN_DISTANCE_FROM_EXISTING_AGENT_METERS,
      )
    ) {
      continue;
    }

    if (
      isPositionTooCloseToAgents(
        slot.worldPosition,
        createdAgents,
        DEFAULT_MIN_DISTANCE_FROM_ACCEPTED_LOCAL_AGENT_METERS,
      )
    ) {
      continue;
    }

    const streamingSlotId = getSpawnedStreamingSlotId(slot);
    const spawnInstanceId = createHomeDrivePedestrianSpawnInstanceId({
      namespace: "local",
      generationSerial: 0,
      agentSerial: slot.seed,
      slotIndex: slot.slotIndex,
      slotId: slot.id,
      zoneId: slot.zoneId,
      segmentId: slot.segmentId,
      sidewalkSide: slot.side,
      groupKind: slot.preferredGroupKind ?? undefined,
      slotSeed: slot.seed,
      seed: localSeed,
      progress: slot.progress,
      salt: [
        streamingSlotId ?? "distributed",
        slot.occupancyCellKey,
        slot.streamingSectorKey ?? "sectorless",
        slot.spawnReason ?? "local",
      ].join("|"),
    });

    const slotAgents = createAgentsForLocalSlot({
      slot,
      seed: localSeed,
      generationSerial: 0,
      slotIndex: slot.slotIndex,
      slotCount: Math.max(1, distribution.slots.length),
      spawnInstanceId,
    });

    activeZoneIds.add(slot.zoneId);

    if (streamingSlotId) {
      spawnedStreamingSlotIds.add(streamingSlotId);
    }

    if (slotAgents.some((agent) => reservedAgentIds.has(agent.id))) {
      continue;
    }

    for (const agent of slotAgents) {
      if (createdAgents.length >= spawnBudget) {
        break;
      }

      if (!reserveHomeDrivePedestrianAgentId(reservedAgentIds, agent.id)) {
        continue;
      }

      createdAgents.push(agent);
      nextAgentSerial += 1;
    }
  }

  const finalReservoir = releaseHomeDrivePedestrianReservoirSlots(
    reservoirUpdate.reservoir,
    Array.from(spawnedStreamingSlotIds),
  );

  return {
    agents: createdAgents,
    activeZoneIds: Array.from(activeZoneIds).sort((first, second) =>
      first.localeCompare(second),
    ),
    nearAgentCount: nearAgents.length,
    spawnedAgentCount: createdAgents.length,
    nextAgentSerial,
    streamingPlanId: streamingPlan.id,
    streamingSectorCounts: streamingPlan.sectorCounts,
    crosswalkDemandCount: getCrosswalkDemandCount(streamingSlots),
    spawnReservoir: finalReservoir,
    warmRingSnapshot: options.warmRingSnapshot,
  };
}
