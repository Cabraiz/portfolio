// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisualPool.ts

import type { HomeDriveThreePedestrianInstancedRigEntry } from "./homeDriveThree.pedestrianInstanceBatches.types";
import type {
  HomeDriveThreePedestrianVisualPoolSlot,
  HomeDriveThreePedestrianVisualPoolState,
  HomeDriveThreePedestrianVisualPoolUpdateOptions,
  HomeDriveThreePedestrianVisualPoolUpdateResult,
  HomeDriveThreePedestrianVisualPoolVector2,
} from "./homeDriveThree.pedestrianVisualPool.types";

const DEFAULT_VISUAL_POOL_RETAIN_SECONDS = 0.82;
const DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS = 0.12;
const DEFAULT_FRONT_EMERGENCY_SPEED_MPS = 9.5;
const DEFAULT_FRONT_EMERGENCY_STEAL_DISTANCE_METERS = 360;
const DEFAULT_FRONT_EMERGENCY_RESERVE_RATIO = 0.34;
const DEFAULT_MAX_EMERGENCY_STEALS_PER_FRAME = 72;
const DEFAULT_VISIBLE_TELEPORT_BLOCK_METERS = 210;
const DEFAULT_VISIBLE_TELEPORT_CONE_RADIANS = 0.86;
const DEFAULT_STAGING_LEAD_SECONDS = 8.4;
const DEFAULT_MAX_STAGING_UPDATES_PER_FRAME = 36;
const DEFAULT_MAX_VISIBLE_STEALS_PER_FRAME = 0;
const DEFAULT_ALLOW_STAGING_REPLACEMENT = true;
const DEFAULT_STAGING_REPLACEMENT_MIN_SCORE_DELTA = 18;

type EntrySpatialScore = Readonly<{
  distanceMeters: number;
  forwardMeters: number;
  lateralMeters: number;
  absoluteLateralMeters: number;
  isFront: boolean;
  isSide: boolean;
  isRear: boolean;
  isVisibleTeleportBlocked: boolean;
  isStagingCandidate: boolean;
  frontScore: number;
}>;

type ResolvedVisualPoolOptions = Readonly<{
  elapsedSeconds: number;
  normalRetainSeconds: number;
  fastRetainSeconds: number;
  activeCenter: HomeDriveThreePedestrianVisualPoolVector2 | null;
  activeHeadingRad: number;
  activeSpeedMps: number;
  emergencyEnabled: boolean;
  emergencyActive: boolean;
  frontEmergencyStealDistanceMeters: number;
  frontEmergencyReserveRatio: number;
  maxEmergencyStealsPerFrame: number;
  allowVisibleTeleport: boolean;
  visibleTeleportBlockMeters: number;
  visibleTeleportConeRadians: number;
  stagingSize: number;
  stagingLeadSeconds: number;
  maxStagingUpdatesPerFrame: number;
  maxVisibleStealsPerFrame: number;
  allowStagingReplacement: boolean;
  stagingReplacementMinScoreDelta: number;
}>;

function createEmptySlot(slotIndex: number): HomeDriveThreePedestrianVisualPoolSlot {
  return {
    slotIndex,
    agentId: null,
    entry: null,
    assignedAtSeconds: 0,
    lastSeenSeconds: Number.NEGATIVE_INFINITY,
    retainedUntilSeconds: Number.NEGATIVE_INFINITY,
    colorSignature: "",
    matrixSignature: "",
    dirtyColor: true,
    dirtyMatrix: true,
    stagedOutsideVisibleCone: false,
    lastTeleportSeconds: Number.NEGATIVE_INFINITY,
  };
}

export function createHomeDriveThreePedestrianVisualPoolState(
  capacity: number,
): HomeDriveThreePedestrianVisualPoolState {
  const safeCapacity = Math.max(1, Math.floor(capacity));

  return {
    capacity: safeCapacity,
    slots: Array.from({ length: safeCapacity }, (_, index) =>
      createEmptySlot(index),
    ),
    agentSlotMap: new Map<string, number>(),
  };
}

function ensureHomeDriveThreePedestrianVisualPoolCapacity(
  state: HomeDriveThreePedestrianVisualPoolState,
  capacity: number,
): void {
  const safeCapacity = Math.max(1, Math.floor(capacity));

  if (safeCapacity === state.capacity) {
    return;
  }

  if (safeCapacity > state.capacity) {
    for (let index = state.capacity; index < safeCapacity; index += 1) {
      state.slots.push(createEmptySlot(index));
    }
  } else {
    for (let index = safeCapacity; index < state.slots.length; index += 1) {
      const slot = state.slots[index];

      if (slot.agentId) {
        state.agentSlotMap.delete(slot.agentId);
      }
    }

    state.slots.length = safeCapacity;
  }

  state.capacity = safeCapacity;
}

function resolveOptions(
  options: HomeDriveThreePedestrianVisualPoolUpdateOptions,
): ResolvedVisualPoolOptions {
  const capacity = Math.max(1, Math.floor(options.capacity));
  const activeSpeedMps = Math.max(0, options.activeSpeedMps ?? 0);
  const emergencySpeedMps = Math.max(
    0,
    options.frontEmergencySpeedMps ?? DEFAULT_FRONT_EMERGENCY_SPEED_MPS,
  );
  const emergencyEnabled = options.frontEmergencyEnabled ?? true;

  return {
    elapsedSeconds: Math.max(0, options.elapsedSeconds),
    normalRetainSeconds: Math.max(
      0,
      options.normalRetainSeconds ??
        options.retainSeconds ??
        DEFAULT_VISUAL_POOL_RETAIN_SECONDS,
    ),
    fastRetainSeconds: Math.max(
      0,
      options.fastRetainSeconds ?? DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS,
    ),
    activeCenter: options.activeCenter ?? null,
    activeHeadingRad: options.activeHeadingRad ?? 0,
    activeSpeedMps,
    emergencyEnabled,
    emergencyActive: emergencyEnabled && activeSpeedMps >= emergencySpeedMps,
    frontEmergencyStealDistanceMeters: Math.max(
      32,
      options.frontEmergencyStealDistanceMeters ??
        DEFAULT_FRONT_EMERGENCY_STEAL_DISTANCE_METERS,
    ),
    frontEmergencyReserveRatio: Math.max(
      0,
      Math.min(
        0.85,
        options.frontEmergencyReserveRatio ??
          DEFAULT_FRONT_EMERGENCY_RESERVE_RATIO,
      ),
    ),
    maxEmergencyStealsPerFrame: Math.max(
      0,
      Math.floor(
        options.maxEmergencyStealsPerFrame ??
          DEFAULT_MAX_EMERGENCY_STEALS_PER_FRAME,
      ),
    ),
    allowVisibleTeleport: options.allowVisibleTeleport ?? false,
    visibleTeleportBlockMeters: Math.max(
      24,
      options.visibleTeleportBlockMeters ?? DEFAULT_VISIBLE_TELEPORT_BLOCK_METERS,
    ),
    visibleTeleportConeRadians: Math.max(
      0.24,
      Math.min(
        Math.PI * 0.92,
        options.visibleTeleportConeRadians ?? DEFAULT_VISIBLE_TELEPORT_CONE_RADIANS,
      ),
    ),
    stagingSize: Math.max(
      0,
      Math.floor(options.stagingSize ?? capacity * 0.28),
    ),
    stagingLeadSeconds: Math.max(
      0.8,
      options.stagingLeadSeconds ?? DEFAULT_STAGING_LEAD_SECONDS,
    ),
    maxStagingUpdatesPerFrame: Math.max(
      1,
      Math.floor(
        options.maxStagingUpdatesPerFrame ??
          DEFAULT_MAX_STAGING_UPDATES_PER_FRAME,
      ),
    ),
    maxVisibleStealsPerFrame: Math.max(
      0,
      Math.floor(
        options.maxVisibleStealsPerFrame ?? DEFAULT_MAX_VISIBLE_STEALS_PER_FRAME,
      ),
    ),
    allowStagingReplacement:
      options.allowStagingReplacement ?? DEFAULT_ALLOW_STAGING_REPLACEMENT,
    stagingReplacementMinScoreDelta: Math.max(
      0,
      options.stagingReplacementMinScoreDelta ??
        DEFAULT_STAGING_REPLACEMENT_MIN_SCORE_DELTA,
    ),
  };
}

function getEntryColorSignature(
  entry: HomeDriveThreePedestrianInstancedRigEntry,
): string {
  const appearance = entry.agent.appearance;

  return [
    appearance.skinToneKey,
    appearance.clothingPaletteKey,
    appearance.hairVariant,
    appearance.outfitVariant,
    entry.detailLevel,
  ].join(":");
}

function getEntryMatrixSignature(
  entry: HomeDriveThreePedestrianInstancedRigEntry,
): string {
  const position = entry.agent.position;

  return [
    Math.round(position.x * 10),
    Math.round(position.z * 10),
    Math.round(entry.agent.headingRad * 100),
    Math.round(entry.agent.progress * 1000),
    entry.agent.animationKey,
    entry.agent.behavior,
  ].join(":");
}

function getEntryDistanceMeters(
  entry: HomeDriveThreePedestrianInstancedRigEntry,
): number {
  if (typeof entry.distanceMeters === "number") {
    return Math.max(0, entry.distanceMeters);
  }

  if (typeof entry.distanceSquared === "number") {
    return Math.sqrt(Math.max(0, entry.distanceSquared));
  }

  return 0;
}

function getEntrySpatialScore(
  entry: HomeDriveThreePedestrianInstancedRigEntry,
  options: ResolvedVisualPoolOptions,
): EntrySpatialScore {
  const distanceMeters = getEntryDistanceMeters(entry);

  if (!options.activeCenter) {
    return {
      distanceMeters,
      forwardMeters: distanceMeters,
      lateralMeters: 0,
      absoluteLateralMeters: 0,
      isFront: true,
      isSide: false,
      isRear: false,
      isVisibleTeleportBlocked: false,
      isStagingCandidate: true,
      frontScore: distanceMeters,
    };
  }

  const dx = entry.agent.position.x - options.activeCenter.x;
  const dz = entry.agent.position.z - options.activeCenter.z;
  const forwardX = Math.sin(options.activeHeadingRad);
  const forwardZ = Math.cos(options.activeHeadingRad);
  const rightX = Math.cos(options.activeHeadingRad);
  const rightZ = -Math.sin(options.activeHeadingRad);
  const forwardMeters = dx * forwardX + dz * forwardZ;
  const lateralMeters = dx * rightX + dz * rightZ;
  const absoluteLateralMeters = Math.abs(lateralMeters);
  const frontLimit = options.frontEmergencyStealDistanceMeters;
  const frontWidth = Math.max(48, frontLimit * 0.58);
  const isFront =
    forwardMeters >= -12 &&
    forwardMeters <= frontLimit &&
    absoluteLateralMeters <= frontWidth;
  const isRear = forwardMeters < -24;
  const isSide = !isFront && !isRear;
  const coneHalfRadians = options.visibleTeleportConeRadians * 0.5;
  const visibleConeHalfWidth = Math.max(
    22,
    Math.tan(coneHalfRadians) * Math.max(18, forwardMeters),
  );
  const isVisibleTeleportBlocked =
    !options.allowVisibleTeleport &&
    forwardMeters >= 0 &&
    forwardMeters <= options.visibleTeleportBlockMeters &&
    absoluteLateralMeters <= visibleConeHalfWidth;
  const stagingLeadMeters = Math.max(
    options.visibleTeleportBlockMeters + 30,
    options.activeSpeedMps * options.stagingLeadSeconds * 1.72,
    options.frontEmergencyStealDistanceMeters,
  );
  const isStagingCandidate =
    forwardMeters > options.visibleTeleportBlockMeters &&
    forwardMeters <= Math.max(frontLimit, stagingLeadMeters) &&
    absoluteLateralMeters <= Math.max(frontWidth, stagingLeadMeters * 0.52);

  return {
    distanceMeters,
    forwardMeters,
    lateralMeters,
    absoluteLateralMeters,
    isFront,
    isSide,
    isRear,
    isVisibleTeleportBlocked,
    isStagingCandidate,
    frontScore: Math.max(0, forwardMeters) + absoluteLateralMeters * 0.35,
  };
}

function getEntryPriority(
  entry: HomeDriveThreePedestrianInstancedRigEntry,
  options: ResolvedVisualPoolOptions,
): number {
  const spatial = getEntrySpatialScore(entry, options);
  const visibilityRank = entry.visibilityRank ?? 0;

  if (options.emergencyActive) {
    if (spatial.isStagingCandidate) {
      return -1700 + spatial.frontScore * 0.18 + visibilityRank * 0.05;
    }

    if (spatial.isFront) {
      return -1200 + spatial.frontScore * 0.22 + visibilityRank * 0.1;
    }

    if (spatial.isSide) {
      return 100 + spatial.distanceMeters * 0.035 + visibilityRank;
    }

    return 260 + spatial.distanceMeters * 0.045 + visibilityRank;
  }

  return visibilityRank + spatial.distanceMeters * 0.01;
}

function releaseSlot(
  state: HomeDriveThreePedestrianVisualPoolState,
  slot: HomeDriveThreePedestrianVisualPoolSlot,
): void {
  if (slot.agentId) {
    state.agentSlotMap.delete(slot.agentId);
  }

  slot.agentId = null;
  slot.entry = null;
  slot.assignedAtSeconds = 0;
  slot.lastSeenSeconds = Number.NEGATIVE_INFINITY;
  slot.retainedUntilSeconds = Number.NEGATIVE_INFINITY;
  slot.colorSignature = "";
  slot.matrixSignature = "";
  slot.dirtyColor = true;
  slot.dirtyMatrix = true;
  slot.stagedOutsideVisibleCone = false;
  slot.lastTeleportSeconds = Number.NEGATIVE_INFINITY;
}

function getSlotStealScore(
  slot: HomeDriveThreePedestrianVisualPoolSlot,
  options: ResolvedVisualPoolOptions,
  incomingAgentIds: ReadonlySet<string>,
): number {
  if (!slot.entry) {
    return 10_000;
  }

  const spatial = getEntrySpatialScore(slot.entry, options);
  const inactiveBonus = !slot.agentId || !incomingAgentIds.has(slot.agentId)
    ? 10_000
    : 0;
  const expiredBonus =
    slot.retainedUntilSeconds <= options.elapsedSeconds ? 5_000 : 0;
  const rearBonus = spatial.isRear ? 1_800 : 0;
  const sideBonus = spatial.isSide ? 850 : 0;
  const stagingBonus = spatial.isStagingCandidate ? -900 : 0;
  const visiblePenalty = spatial.isVisibleTeleportBlocked ? -8_000 : 0;
  const frontPenalty = spatial.isFront ? -3_500 : 0;
  const ageBonus = Math.max(0, options.elapsedSeconds - slot.lastSeenSeconds) * 12;

  return (
    inactiveBonus +
    expiredBonus +
    rearBonus +
    sideBonus +
    stagingBonus +
    spatial.distanceMeters * 4 +
    ageBonus +
    frontPenalty +
    visiblePenalty
  );
}

function chooseInactiveOrEmptySlot(
  state: HomeDriveThreePedestrianVisualPoolState,
  options: ResolvedVisualPoolOptions,
  incomingAgentIds: ReadonlySet<string>,
): HomeDriveThreePedestrianVisualPoolSlot | null {
  const emptySlot = state.slots.find((slot) => slot.agentId === null);

  if (emptySlot) {
    return emptySlot;
  }

  const inactiveExpiredSlots = state.slots.filter((slot) => {
    return (
      slot.agentId !== null &&
      !incomingAgentIds.has(slot.agentId) &&
      slot.retainedUntilSeconds <= options.elapsedSeconds
    );
  });

  if (inactiveExpiredSlots.length <= 0) {
    return null;
  }

  return inactiveExpiredSlots.sort((first, second) => {
    return (
      getSlotStealScore(second, options, incomingAgentIds) -
      getSlotStealScore(first, options, incomingAgentIds)
    );
  })[0] ?? null;
}

function chooseEmergencyStealSlot(
  state: HomeDriveThreePedestrianVisualPoolState,
  entry: HomeDriveThreePedestrianInstancedRigEntry,
  options: ResolvedVisualPoolOptions,
  incomingAgentIds: ReadonlySet<string>,
  protectedAgentIds: ReadonlySet<string>,
): HomeDriveThreePedestrianVisualPoolSlot | null {
  if (!options.emergencyActive) {
    return null;
  }

  const spatial = getEntrySpatialScore(entry, options);

  if (!spatial.isFront && !spatial.isStagingCandidate) {
    return null;
  }

  if (spatial.isVisibleTeleportBlocked && !options.allowVisibleTeleport) {
    return null;
  }

  const candidates = state.slots.filter((slot) => {
    if (!slot.agentId || slot.agentId === entry.agent.id) {
      return false;
    }

    if (protectedAgentIds.has(slot.agentId)) {
      return false;
    }

    const slotSpatial = slot.entry
      ? getEntrySpatialScore(slot.entry, options)
      : null;

    return (
      !incomingAgentIds.has(slot.agentId) ||
      !slotSpatial ||
      slotSpatial.isRear ||
      slotSpatial.isSide ||
      slotSpatial.distanceMeters > options.frontEmergencyStealDistanceMeters
    );
  });

  if (candidates.length <= 0) {
    return null;
  }

  return candidates.sort((first, second) => {
    return (
      getSlotStealScore(second, options, incomingAgentIds) -
      getSlotStealScore(first, options, incomingAgentIds)
    );
  })[0] ?? null;
}

function chooseFallbackStealSlot(
  state: HomeDriveThreePedestrianVisualPoolState,
  options: ResolvedVisualPoolOptions,
  incomingAgentIds: ReadonlySet<string>,
  protectedAgentIds: ReadonlySet<string>,
): HomeDriveThreePedestrianVisualPoolSlot | null {
  const candidates = state.slots.filter((slot) => {
    if (!slot.agentId) {
      return true;
    }

    if (protectedAgentIds.has(slot.agentId)) {
      return false;
    }

    const spatial = slot.entry ? getEntrySpatialScore(slot.entry, options) : null;

    return !spatial?.isVisibleTeleportBlocked;
  });

  if (candidates.length <= 0) {
    return null;
  }

  return candidates.sort((first, second) => {
    return (
      getSlotStealScore(second, options, incomingAgentIds) -
      getSlotStealScore(first, options, incomingAgentIds)
    );
  })[0] ?? null;
}

function chooseStagingReplacementSlot(
  state: HomeDriveThreePedestrianVisualPoolState,
  entry: HomeDriveThreePedestrianInstancedRigEntry,
  options: ResolvedVisualPoolOptions,
  incomingAgentIds: ReadonlySet<string>,
  protectedAgentIds: ReadonlySet<string>,
): HomeDriveThreePedestrianVisualPoolSlot | null {
  if (!options.allowStagingReplacement) {
    return null;
  }

  const incomingSpatial = getEntrySpatialScore(entry, options);

  if (!incomingSpatial.isStagingCandidate || incomingSpatial.isVisibleTeleportBlocked) {
    return null;
  }

  const candidates = state.slots.filter((slot) => {
    if (!slot.agentId || slot.agentId === entry.agent.id) {
      return false;
    }

    if (protectedAgentIds.has(slot.agentId)) {
      return false;
    }

    const slotSpatial = slot.entry ? getEntrySpatialScore(slot.entry, options) : null;

    if (!slotSpatial || slotSpatial.isVisibleTeleportBlocked) {
      return false;
    }

    return (
      !incomingAgentIds.has(slot.agentId) ||
      slotSpatial.isRear ||
      slotSpatial.isSide ||
      slotSpatial.distanceMeters > incomingSpatial.distanceMeters + 80 ||
      slotSpatial.frontScore > incomingSpatial.frontScore + options.stagingReplacementMinScoreDelta
    );
  });

  if (candidates.length <= 0) {
    return null;
  }

  return candidates.sort((first, second) => {
    const firstScore = getSlotStealScore(first, options, incomingAgentIds);
    const secondScore = getSlotStealScore(second, options, incomingAgentIds);

    return secondScore - firstScore;
  })[0] ?? null;
}

function assignEntryToSlot(params: Readonly<{
  state: HomeDriveThreePedestrianVisualPoolState;
  slot: HomeDriveThreePedestrianVisualPoolSlot;
  entry: HomeDriveThreePedestrianInstancedRigEntry;
  elapsedSeconds: number;
  retainSeconds: number;
  stagedOutsideVisibleCone: boolean;
}>): void {
  const {
    state,
    slot,
    entry,
    elapsedSeconds,
    retainSeconds,
    stagedOutsideVisibleCone,
  } = params;
  const nextColorSignature = getEntryColorSignature(entry);
  const nextMatrixSignature = getEntryMatrixSignature(entry);
  const wasDifferentAgent = slot.agentId !== entry.agent.id;

  if (slot.agentId && wasDifferentAgent) {
    state.agentSlotMap.delete(slot.agentId);
  }

  slot.agentId = entry.agent.id;
  slot.entry = entry;
  slot.lastSeenSeconds = elapsedSeconds;
  slot.retainedUntilSeconds = elapsedSeconds + retainSeconds;
  slot.stagedOutsideVisibleCone =
    slot.stagedOutsideVisibleCone || stagedOutsideVisibleCone;

  if (wasDifferentAgent) {
    slot.assignedAtSeconds = elapsedSeconds;
    slot.lastTeleportSeconds = elapsedSeconds;
    slot.stagedOutsideVisibleCone = stagedOutsideVisibleCone;
  }

  slot.dirtyColor =
    slot.dirtyColor ||
    wasDifferentAgent ||
    slot.colorSignature !== nextColorSignature;
  slot.dirtyMatrix =
    slot.dirtyMatrix ||
    wasDifferentAgent ||
    slot.matrixSignature !== nextMatrixSignature;
  slot.colorSignature = nextColorSignature;
  slot.matrixSignature = nextMatrixSignature;

  state.agentSlotMap.set(entry.agent.id, slot.slotIndex);
}

export function updateHomeDriveThreePedestrianVisualPool(
  state: HomeDriveThreePedestrianVisualPoolState,
  options: HomeDriveThreePedestrianVisualPoolUpdateOptions,
): HomeDriveThreePedestrianVisualPoolUpdateResult {
  const capacity = Math.max(1, Math.floor(options.capacity));
  const resolved = resolveOptions(options);
  const retainSeconds = resolved.emergencyActive
    ? resolved.fastRetainSeconds
    : resolved.normalRetainSeconds;

  ensureHomeDriveThreePedestrianVisualPoolCapacity(state, capacity);

  const entries = [...options.entries]
    .filter((entry) => Boolean(entry.agent?.id))
    .sort((first, second) => {
      const priorityDelta =
        getEntryPriority(first, resolved) - getEntryPriority(second, resolved);

      if (Math.abs(priorityDelta) > 0.0001) {
        return priorityDelta;
      }

      return first.agent.id.localeCompare(second.agent.id);
    })
    .slice(0, capacity);

  const incomingAgentIds = new Set(entries.map((entry) => entry.agent.id));
  const protectedAgentIds = new Set<string>();
  const releasedSlotIndices: number[] = [];
  const emergencyStealSlotIndices: number[] = [];
  const skippedVisibleTeleportAgentIds: string[] = [];
  let emergencyStealCount = 0;
  let visibleStealCount = 0;
  let stagingUpdateCount = 0;
  let stagedSlotCount = state.slots.reduce((total, slot) => {
    return slot.stagedOutsideVisibleCone &&
      slot.entry &&
      slot.retainedUntilSeconds >= resolved.elapsedSeconds
      ? total + 1
      : total;
  }, 0);

  state.slots.forEach((slot) => {
    if (!slot.agentId || incomingAgentIds.has(slot.agentId)) {
      return;
    }

    const slotSpatial = slot.entry
      ? getEntrySpatialScore(slot.entry, resolved)
      : null;
    const shouldFastRelease =
      resolved.emergencyActive &&
      Boolean(slotSpatial?.isRear || slotSpatial?.isSide) &&
      !slotSpatial?.isVisibleTeleportBlocked;

    if (
      slot.retainedUntilSeconds < resolved.elapsedSeconds ||
      shouldFastRelease
    ) {
      releasedSlotIndices.push(slot.slotIndex);
      releaseSlot(state, slot);
    }
  });

  const frontReserveCount = Math.floor(
    capacity * resolved.frontEmergencyReserveRatio,
  );
  let assignedFrontCount = 0;

  entries.forEach((entry) => {
    const spatial = getEntrySpatialScore(entry, resolved);
    const existingSlotIndex = state.agentSlotMap.get(entry.agent.id);
    const existingSlot =
      typeof existingSlotIndex === "number" ? state.slots[existingSlotIndex] : null;

    if (existingSlot) {
      assignEntryToSlot({
        state,
        slot: existingSlot,
        entry,
        elapsedSeconds: resolved.elapsedSeconds,
        retainSeconds,
        stagedOutsideVisibleCone:
          existingSlot.stagedOutsideVisibleCone || !spatial.isVisibleTeleportBlocked,
      });

      if (spatial.isFront) {
        assignedFrontCount += 1;
        protectedAgentIds.add(entry.agent.id);
      }

      return;
    }

    const wouldBirthInsideVisibleCone =
      spatial.isVisibleTeleportBlocked && !resolved.allowVisibleTeleport;

    if (wouldBirthInsideVisibleCone) {
      if (visibleStealCount >= resolved.maxVisibleStealsPerFrame) {
        skippedVisibleTeleportAgentIds.push(entry.agent.id);
        return;
      }

      visibleStealCount += 1;
    }

    let replacementStagingSlot: HomeDriveThreePedestrianVisualPoolSlot | null = null;

    if (spatial.isStagingCandidate) {
      const stagingBudgetBlocked =
        stagedSlotCount >= resolved.stagingSize ||
        stagingUpdateCount >= resolved.maxStagingUpdatesPerFrame;

      if (stagingBudgetBlocked) {
        replacementStagingSlot = chooseStagingReplacementSlot(
          state,
          entry,
          resolved,
          incomingAgentIds,
          protectedAgentIds,
        );

        if (!replacementStagingSlot) {
          return;
        }
      }

      stagingUpdateCount += 1;
    }

    let slot =
      replacementStagingSlot ??
      chooseInactiveOrEmptySlot(state, resolved, incomingAgentIds);

    const shouldUseEmergency =
      resolved.emergencyActive &&
      !wouldBirthInsideVisibleCone &&
      (spatial.isFront || spatial.isStagingCandidate) &&
      emergencyStealCount < resolved.maxEmergencyStealsPerFrame &&
      (assignedFrontCount < frontReserveCount || !slot);

    if (shouldUseEmergency) {
      const emergencySlot = chooseEmergencyStealSlot(
        state,
        entry,
        resolved,
        incomingAgentIds,
        protectedAgentIds,
      );

      if (emergencySlot) {
        slot = emergencySlot;
        emergencyStealSlotIndices.push(emergencySlot.slotIndex);
        emergencyStealCount += 1;
      }
    }

    if (!slot && resolved.emergencyActive && !wouldBirthInsideVisibleCone) {
      slot = chooseFallbackStealSlot(
        state,
        resolved,
        incomingAgentIds,
        protectedAgentIds,
      );
    }

    if (!slot) {
      return;
    }

    assignEntryToSlot({
      state,
      slot,
      entry,
      elapsedSeconds: resolved.elapsedSeconds,
      retainSeconds,
      stagedOutsideVisibleCone: !spatial.isVisibleTeleportBlocked,
    });

    if (spatial.isStagingCandidate || !spatial.isVisibleTeleportBlocked) {
      stagedSlotCount += 1;
    }

    if (spatial.isFront) {
      assignedFrontCount += 1;
      protectedAgentIds.add(entry.agent.id);
    }
  });

  const activeSlotIndices: number[] = [];
  const dirtyColorSlotIndices: number[] = [];
  const dirtyMatrixSlotIndices: number[] = [];

  state.slots.forEach((slot) => {
    if (
      !slot.entry ||
      !slot.agentId ||
      slot.retainedUntilSeconds < resolved.elapsedSeconds
    ) {
      return;
    }

    activeSlotIndices.push(slot.slotIndex);

    if (slot.dirtyColor) {
      dirtyColorSlotIndices.push(slot.slotIndex);
      slot.dirtyColor = false;
    }

    if (slot.dirtyMatrix) {
      dirtyMatrixSlotIndices.push(slot.slotIndex);
      slot.dirtyMatrix = false;
    }
  });

  return {
    state,
    activeSlotIndices,
    dirtyColorSlotIndices,
    dirtyMatrixSlotIndices,
    releasedSlotIndices,
    emergencyStealSlotIndices,
    skippedVisibleTeleportAgentIds,
  };
}

export function getHomeDriveThreePedestrianVisualPoolActiveEntries(
  state: HomeDriveThreePedestrianVisualPoolState,
  elapsedSeconds: number,
): readonly HomeDriveThreePedestrianInstancedRigEntry[] {
  return state.slots
    .filter((slot) => slot.entry && slot.retainedUntilSeconds >= elapsedSeconds)
    .map((slot) => slot.entry as HomeDriveThreePedestrianInstancedRigEntry);
}
