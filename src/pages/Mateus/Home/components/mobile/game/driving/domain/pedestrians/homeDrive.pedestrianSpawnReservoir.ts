// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSpawnReservoir.ts

import type {
  HomeDrivePedestrianSpawnReservoirSnapshot,
  HomeDrivePedestrianSpawnReservoirSlotState,
  HomeDrivePedestrianSpawnReservoirUpdateOptions,
  HomeDrivePedestrianSpawnReservoirUpdateResult,
  HomeDrivePedestrianStreamingSectorKey,
  HomeDrivePedestrianStreamingSlot,
} from "./homeDrive.pedestrianStreaming.types";

const DEFAULT_MAX_RESERVOIR_SLOT_AGE_SECONDS = 7.5;
const DEFAULT_MAX_ATTEMPTS_PER_SLOT = 3;

const EMPTY_SECTOR_COUNTS: Readonly<
  Record<HomeDrivePedestrianStreamingSectorKey, number>
> = Object.freeze({
  "front-near": 0,
  "front-far": 0,
  "left-sidewalk": 0,
  "right-sidewalk": 0,
  "rear-buffer": 0,
  "crosswalk-demand": 0,
});

function cloneSectorCounts(): Record<HomeDrivePedestrianStreamingSectorKey, number> {
  return {
    "front-near": 0,
    "front-far": 0,
    "left-sidewalk": 0,
    "right-sidewalk": 0,
    "rear-buffer": 0,
    "crosswalk-demand": 0,
  };
}

function createEmptyReservoir(): HomeDrivePedestrianSpawnReservoirSnapshot {
  return {
    slotsById: {},
    zoneSpawnCounts: {},
    sectorSpawnCounts: EMPTY_SECTOR_COUNTS,
  };
}

function isSlotStateFresh(
  state: HomeDrivePedestrianSpawnReservoirSlotState,
  elapsedSeconds: number,
  maxAgeSeconds: number,
  maxAttemptsPerSlot: number,
): boolean {
  if (state.attempts >= maxAttemptsPerSlot) {
    return false;
  }

  return elapsedSeconds - state.lastTouchedAtSeconds <= maxAgeSeconds;
}

function countState(
  state: HomeDrivePedestrianSpawnReservoirSlotState,
  zoneSpawnCounts: Record<string, number>,
  sectorSpawnCounts: Record<HomeDrivePedestrianStreamingSectorKey, number>,
): void {
  zoneSpawnCounts[state.zoneId] = (zoneSpawnCounts[state.zoneId] ?? 0) + 1;
  sectorSpawnCounts[state.sectorKey] =
    (sectorSpawnCounts[state.sectorKey] ?? 0) + 1;
}

function getReservoirSlotState(
  slot: HomeDrivePedestrianStreamingSlot,
  elapsedSeconds: number,
  previous?: HomeDrivePedestrianSpawnReservoirSlotState,
): HomeDrivePedestrianSpawnReservoirSlotState {
  return {
    slotId: slot.id,
    zoneId: slot.zoneId,
    sectorKey: slot.sectorKey,
    spawnReason: previous?.spawnReason ?? slot.spawnReason,
    worldPosition: slot.worldPosition,
    reservedAtSeconds: previous?.reservedAtSeconds ?? elapsedSeconds,
    lastTouchedAtSeconds: elapsedSeconds,
    attempts: (previous?.attempts ?? 0) + 1,
  };
}

function rebuildReservoirCounts(
  slotsById: Readonly<Record<string, HomeDrivePedestrianSpawnReservoirSlotState>>,
): Readonly<{
  zoneSpawnCounts: Record<string, number>;
  sectorSpawnCounts: Record<HomeDrivePedestrianStreamingSectorKey, number>;
}> {
  const zoneSpawnCounts: Record<string, number> = {};
  const sectorSpawnCounts = cloneSectorCounts();

  for (const state of Object.values(slotsById)) {
    countState(state, zoneSpawnCounts, sectorSpawnCounts);
  }

  return {
    zoneSpawnCounts,
    sectorSpawnCounts,
  };
}

export function createHomeDrivePedestrianSpawnReservoirSnapshot(): HomeDrivePedestrianSpawnReservoirSnapshot {
  return createEmptyReservoir();
}

export function updateHomeDrivePedestrianSpawnReservoir(
  options: HomeDrivePedestrianSpawnReservoirUpdateOptions,
): HomeDrivePedestrianSpawnReservoirUpdateResult {
  const maxAgeSeconds = Math.max(
    0.1,
    options.maxAgeSeconds ?? DEFAULT_MAX_RESERVOIR_SLOT_AGE_SECONDS,
  );
  const maxAttemptsPerSlot = Math.max(
    1,
    Math.floor(options.maxAttemptsPerSlot ?? DEFAULT_MAX_ATTEMPTS_PER_SLOT),
  );
  const previousReservoir = options.reservoir ?? createEmptyReservoir();
  const nextSlotsById: Record<
    string,
    HomeDrivePedestrianSpawnReservoirSlotState
  > = {};
  const acceptedSlots: HomeDrivePedestrianStreamingSlot[] = [];
  const rejectedSlotIds: string[] = [];

  for (const previousState of Object.values(previousReservoir.slotsById)) {
    if (
      isSlotStateFresh(
        previousState,
        options.elapsedSeconds,
        maxAgeSeconds,
        maxAttemptsPerSlot,
      )
    ) {
      nextSlotsById[previousState.slotId] = previousState;
    }
  }

  for (const slot of options.slots) {
    const previousState = nextSlotsById[slot.id];
    const nextState = getReservoirSlotState(
      slot,
      options.elapsedSeconds,
      previousState,
    );

    if (nextState.attempts > maxAttemptsPerSlot) {
      rejectedSlotIds.push(slot.id);
      continue;
    }

    nextSlotsById[slot.id] = nextState;
    acceptedSlots.push(slot);
  }

  const counts = rebuildReservoirCounts(nextSlotsById);

  return {
    reservoir: {
      slotsById: nextSlotsById,
      zoneSpawnCounts: counts.zoneSpawnCounts,
      sectorSpawnCounts: counts.sectorSpawnCounts,
    },
    acceptedSlots,
    rejectedSlotIds,
  };
}

export function releaseHomeDrivePedestrianReservoirSlots(
  reservoir: HomeDrivePedestrianSpawnReservoirSnapshot | undefined,
  slotIds: readonly string[],
): HomeDrivePedestrianSpawnReservoirSnapshot {
  if (!reservoir || slotIds.length <= 0) {
    return reservoir ?? createEmptyReservoir();
  }

  const releaseSet = new Set(slotIds);
  const slotsById: Record<string, HomeDrivePedestrianSpawnReservoirSlotState> = {};

  for (const state of Object.values(reservoir.slotsById)) {
    if (releaseSet.has(state.slotId)) {
      continue;
    }

    slotsById[state.slotId] = state;
  }

  const counts = rebuildReservoirCounts(slotsById);

  return {
    slotsById,
    zoneSpawnCounts: counts.zoneSpawnCounts,
    sectorSpawnCounts: counts.sectorSpawnCounts,
  };
}

export function getHomeDrivePedestrianReservoirZonePressure(
  reservoir: HomeDrivePedestrianSpawnReservoirSnapshot | undefined,
  zoneId: string,
): number {
  if (!reservoir) {
    return 0;
  }

  return reservoir.zoneSpawnCounts[zoneId] ?? 0;
}

export function getHomeDrivePedestrianReservoirSectorPressure(
  reservoir: HomeDrivePedestrianSpawnReservoirSnapshot | undefined,
  sectorKey: HomeDrivePedestrianStreamingSectorKey,
): number {
  if (!reservoir) {
    return 0;
  }

  return reservoir.sectorSpawnCounts[sectorKey] ?? 0;
}
