// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderSeparation.ts

import type {
  HomeDriveThreePedestrianRenderOffset,
  HomeDriveThreePedestrianRenderSeparationCandidate,
  HomeDriveThreePedestrianRenderSeparationConfig,
  HomeDriveThreePedestrianRenderSeparationFrame,
  HomeDriveThreePedestrianRenderSeparationSourceEntry,
} from "./homeDriveThree.pedestrianRenderSeparation.types";

/**
 * SeparaÃ§Ã£o apenas geomÃ©trica: nÃ£o usa fade preto, material escuro,
 * placeholder ou qualquer disfarce de loading.
 */
const DEFAULT_CELL_SIZE_METERS = 1.35;
const DEFAULT_MIN_SEPARATION_METERS = 0.82;
const DEFAULT_MAX_OFFSET_METERS = 0.72;
const DEFAULT_CANDIDATE_COUNT = 14;
const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5));

const ZERO_OFFSET: HomeDriveThreePedestrianRenderOffset = Object.freeze({
  x: 0,
  z: 0,
  magnitudeMeters: 0,
  collisionCount: 0,
});

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getDistanceMeters(
  entry: HomeDriveThreePedestrianRenderSeparationSourceEntry,
): number {
  if (typeof entry.distanceMeters === "number") {
    return Math.max(0, entry.distanceMeters);
  }

  if (typeof entry.distanceSquared === "number") {
    return Math.sqrt(Math.max(0, entry.distanceSquared));
  }

  return Number.POSITIVE_INFINITY;
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getCellKey(
  x: number,
  z: number,
  cellSizeMeters: number,
): string {
  return `${Math.floor(x / cellSizeMeters)}:${Math.floor(z / cellSizeMeters)}`;
}

function getNeighborCellKeys(cellKey: string): readonly string[] {
  const [rawX, rawZ] = cellKey.split(":");
  const cellX = Number(rawX);
  const cellZ = Number(rawZ);
  const keys: string[] = [];

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      keys.push(`${cellX + dx}:${cellZ + dz}`);
    }
  }

  return keys;
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getDistanceFade(
  distanceMeters: number,
  config: HomeDriveThreePedestrianRenderSeparationConfig,
): number {
  const start = config.distanceFadeStartMeters;
  const end = config.distanceFadeEndMeters;

  if (typeof start !== "number" || typeof end !== "number" || end <= start) {
    return 1;
  }

  if (distanceMeters <= start) {
    return 1;
  }

  if (distanceMeters >= end) {
    return 0.35;
  }

  const t = clamp((distanceMeters - start) / (end - start), 0, 1);

  return 1 - t * 0.65;
}

function normalizeEntries(
  entries: readonly HomeDriveThreePedestrianRenderSeparationSourceEntry[],
): readonly HomeDriveThreePedestrianRenderSeparationCandidate[] {
  return entries
    .map((entry, originalIndex) => ({
      agentId: entry.agent.id,
      x: entry.agent.position.x,
      z: entry.agent.position.z,
      distanceMeters: getDistanceMeters(entry),
      visibilityRank: entry.visibilityRank ?? 0,
      originalIndex,
    }))
    .sort((first, second) => {
      if (Math.abs(first.distanceMeters - second.distanceMeters) > 0.0001) {
        return first.distanceMeters - second.distanceMeters;
      }

      if (Math.abs(first.visibilityRank - second.visibilityRank) > 0.0001) {
        return first.visibilityRank - second.visibilityRank;
      }

      return first.agentId.localeCompare(second.agentId);
    });
}

function countConflicts(
  position: Readonly<{ x: number; z: number }>,
  acceptedByCell: ReadonlyMap<string, readonly HomeDriveThreePedestrianRenderSeparationCandidate[]>,
  cellSizeMeters: number,
  minSeparationMeters: number,
): number {
  const cellKey = getCellKey(position.x, position.z, cellSizeMeters);
  const minDistanceSquared = minSeparationMeters * minSeparationMeters;
  let conflictCount = 0;

  for (const neighborKey of getNeighborCellKeys(cellKey)) {
    const accepted = acceptedByCell.get(neighborKey) ?? [];

    for (const item of accepted) {
      if (getDistanceSquared(position, item) < minDistanceSquared) {
        conflictCount += 1;
      }
    }
  }

  return conflictCount;
}

function pushAcceptedCandidate(
  acceptedByCell: Map<string, HomeDriveThreePedestrianRenderSeparationCandidate[]>,
  candidate: HomeDriveThreePedestrianRenderSeparationCandidate,
  cellSizeMeters: number,
): void {
  const cellKey = getCellKey(candidate.x, candidate.z, cellSizeMeters);
  const current = acceptedByCell.get(cellKey);

  if (current) {
    current.push(candidate);
  } else {
    acceptedByCell.set(cellKey, [candidate]);
  }
}

function findBestOffset(params: Readonly<{
  candidate: HomeDriveThreePedestrianRenderSeparationCandidate;
  acceptedByCell: ReadonlyMap<string, readonly HomeDriveThreePedestrianRenderSeparationCandidate[]>;
  cellSizeMeters: number;
  minSeparationMeters: number;
  maxOffsetMeters: number;
  candidateCount: number;
  distanceFade: number;
}>): HomeDriveThreePedestrianRenderOffset {
  const baseConflictCount = countConflicts(
    params.candidate,
    params.acceptedByCell,
    params.cellSizeMeters,
    params.minSeparationMeters,
  );

  if (baseConflictCount <= 0) {
    return ZERO_OFFSET;
  }

  const hash = hashString(params.candidate.agentId);
  const angleSeed = (hash % 8192) / 8192;
  const maxOffsetMeters = params.maxOffsetMeters * params.distanceFade;
  const minSeparationMeters = params.minSeparationMeters * params.distanceFade;
  let bestOffset: HomeDriveThreePedestrianRenderOffset = {
    x: 0,
    z: 0,
    magnitudeMeters: 0,
    collisionCount: baseConflictCount,
  };

  for (let index = 0; index < params.candidateCount; index += 1) {
    const ringProgress = Math.sqrt((index + 1) / params.candidateCount);
    const magnitudeMeters = clamp(
      minSeparationMeters * (0.36 + ringProgress * 0.58),
      0,
      maxOffsetMeters,
    );
    const angle = (angleSeed * Math.PI * 2 + index * GOLDEN_ANGLE_RAD) %
      (Math.PI * 2);
    const offset = {
      x: Math.cos(angle) * magnitudeMeters,
      z: Math.sin(angle) * magnitudeMeters,
    };
    const position = {
      x: params.candidate.x + offset.x,
      z: params.candidate.z + offset.z,
    };
    const collisionCount = countConflicts(
      position,
      params.acceptedByCell,
      params.cellSizeMeters,
      params.minSeparationMeters,
    );

    if (
      collisionCount < bestOffset.collisionCount ||
      (collisionCount === bestOffset.collisionCount &&
        magnitudeMeters < bestOffset.magnitudeMeters)
    ) {
      bestOffset = {
        x: offset.x,
        z: offset.z,
        magnitudeMeters,
        collisionCount,
      };
    }

    if (collisionCount <= 0) {
      break;
    }
  }

  return bestOffset;
}

export function createHomeDriveThreePedestrianRenderSeparationFrame(
  entries: readonly HomeDriveThreePedestrianRenderSeparationSourceEntry[],
  config?: HomeDriveThreePedestrianRenderSeparationConfig,
): HomeDriveThreePedestrianRenderSeparationFrame {
  if (!config?.enabled || entries.length <= 1) {
    return {
      offsetsByAgentId: new Map(),
      separatedCount: 0,
      maxOffsetMeters: 0,
    };
  }

  const cellSizeMeters = Math.max(
    0.25,
    config.cellSizeMeters ?? DEFAULT_CELL_SIZE_METERS,
  );
  const minSeparationMeters = Math.max(
    0.1,
    config.minSeparationMeters ?? DEFAULT_MIN_SEPARATION_METERS,
  );
  const maxOffsetMeters = Math.max(
    0,
    config.maxOffsetMeters ?? DEFAULT_MAX_OFFSET_METERS,
  );
  const candidateCount = Math.max(
    4,
    Math.floor(config.candidateCount ?? DEFAULT_CANDIDATE_COUNT),
  );

  if (maxOffsetMeters <= 0) {
    return {
      offsetsByAgentId: new Map(),
      separatedCount: 0,
      maxOffsetMeters: 0,
    };
  }

  const candidates = normalizeEntries(entries);
  const acceptedByCell = new Map<
    string,
    HomeDriveThreePedestrianRenderSeparationCandidate[]
  >();
  const offsetsByAgentId = new Map<string, HomeDriveThreePedestrianRenderOffset>();
  let separatedCount = 0;
  let observedMaxOffsetMeters = 0;

  candidates.forEach((candidate) => {
    const distanceFade = getDistanceFade(candidate.distanceMeters, config);
    const offset = findBestOffset({
      candidate,
      acceptedByCell,
      cellSizeMeters,
      minSeparationMeters,
      maxOffsetMeters,
      candidateCount,
      distanceFade,
    });

    if (offset.magnitudeMeters > 0.0001) {
      offsetsByAgentId.set(candidate.agentId, offset);
      separatedCount += 1;
      observedMaxOffsetMeters = Math.max(
        observedMaxOffsetMeters,
        offset.magnitudeMeters,
      );
    }

    pushAcceptedCandidate(
      acceptedByCell,
      {
        ...candidate,
        x: candidate.x + offset.x,
        z: candidate.z + offset.z,
      },
      cellSizeMeters,
    );
  });

  return {
    offsetsByAgentId,
    separatedCount,
    maxOffsetMeters: observedMaxOffsetMeters,
  };
}

export function getHomeDriveThreePedestrianRenderSeparationOffset(
  frame: HomeDriveThreePedestrianRenderSeparationFrame | null | undefined,
  agentId: string,
): HomeDriveThreePedestrianRenderOffset {
  return frame?.offsetsByAgentId.get(agentId) ?? ZERO_OFFSET;
}
