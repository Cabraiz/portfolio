// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstanceBatches.ts

import type { HomeDrivePedestrianRole } from "../../domain/pedestrians";
import type {
  HomeDriveThreePedestrianInstanceBatch,
  HomeDriveThreePedestrianInstanceBatchKey,
  HomeDriveThreePedestrianInstanceBatchOptions,
  HomeDriveThreePedestrianInstanceSourceEntry,
  HomeDriveThreePedestrianInstancedRigDetailLevel,
  HomeDriveThreePedestrianInstancedRigEntry,
} from "./homeDriveThree.pedestrianInstanceBatches.types";

function toInstancedDetailLevel(
  detailLevel: string,
): HomeDriveThreePedestrianInstancedRigDetailLevel | null {
  if (detailLevel === "medium") {
    return "medium";
  }

  if (detailLevel === "proxy") {
    return "proxy";
  }

  return null;
}

function getBatchKey(
  role: HomeDrivePedestrianRole | "generic",
  detailLevel: HomeDriveThreePedestrianInstancedRigDetailLevel,
): HomeDriveThreePedestrianInstanceBatchKey {
  return `${role}:${detailLevel}` as HomeDriveThreePedestrianInstanceBatchKey;
}

function getDistanceMeters(
  entry: HomeDriveThreePedestrianInstanceSourceEntry,
): number | undefined {
  if (typeof entry.distanceMeters === "number") {
    return Math.max(0, entry.distanceMeters);
  }

  if (typeof entry.distanceSquared === "number") {
    return Math.sqrt(Math.max(0, entry.distanceSquared));
  }

  return undefined;
}

function getPoolPriority(entry: Readonly<{
  distanceMeters?: number;
  distanceSquared?: number;
  visibilityRank?: number;
}>): number {
  const distanceMeters =
    typeof entry.distanceMeters === "number"
      ? entry.distanceMeters
      : Math.sqrt(Math.max(0, entry.distanceSquared ?? 0));
  const visibilityRank = entry.visibilityRank ?? 0;

  return visibilityRank + distanceMeters * 0.012;
}

function sortEntriesForInstancing(
  entries: readonly HomeDriveThreePedestrianInstancedRigEntry[],
  options: HomeDriveThreePedestrianInstanceBatchOptions | undefined,
): readonly HomeDriveThreePedestrianInstancedRigEntry[] {
  const preferNearest = options?.preferNearest ?? true;
  const preferStableAgentOrder = options?.preferStableAgentOrder ?? true;

  return [...entries].sort((first, second) => {
    if (preferNearest) {
      const firstDistance = first.distanceSquared ?? Number.POSITIVE_INFINITY;
      const secondDistance = second.distanceSquared ?? Number.POSITIVE_INFINITY;

      if (Math.abs(firstDistance - secondDistance) > 0.0001) {
        return firstDistance - secondDistance;
      }
    }

    const priorityDelta = first.poolPriority - second.poolPriority;

    if (Math.abs(priorityDelta) > 0.0001) {
      return priorityDelta;
    }

    const firstRank = first.visibilityRank ?? 0;
    const secondRank = second.visibilityRank ?? 0;

    if (Math.abs(firstRank - secondRank) > 0.0001) {
      return firstRank - secondRank;
    }

    if (preferStableAgentOrder) {
      return first.stableKey.localeCompare(second.stableKey);
    }

    return (first.sourceIndex ?? 0) - (second.sourceIndex ?? 0);
  });
}

export function normalizeHomeDriveThreePedestrianInstancedRigEntries(
  entries: readonly HomeDriveThreePedestrianInstanceSourceEntry[],
  options?: HomeDriveThreePedestrianInstanceBatchOptions,
): readonly HomeDriveThreePedestrianInstancedRigEntry[] {
  const normalized = entries
    .map((entry, sourceIndex): HomeDriveThreePedestrianInstancedRigEntry | null => {
      const detailLevel = toInstancedDetailLevel(entry.detailLevel);
      const distanceMeters = getDistanceMeters(entry);

      if (!detailLevel) {
        return null;
      }

      return {
        agent: entry.agent,
        detailLevel,
        distanceSquared: entry.distanceSquared,
        distanceMeters,
        visibilityRank: entry.visibilityRank,
        sourceIndex,
        stableKey: entry.agent.id,
        poolPriority: getPoolPriority({
          distanceMeters,
          distanceSquared: entry.distanceSquared,
          visibilityRank: entry.visibilityRank,
        }),
      };
    })
    .filter((entry): entry is HomeDriveThreePedestrianInstancedRigEntry => {
      return Boolean(entry);
    });

  const sorted = sortEntriesForInstancing(normalized, options);
  const maxInstances = Math.max(
    0,
    Math.floor(options?.maxInstances ?? sorted.length),
  );

  return sorted.slice(0, maxInstances);
}

export function groupHomeDriveThreePedestrianInstanceBatches(
  entries: readonly HomeDriveThreePedestrianInstancedRigEntry[],
): readonly HomeDriveThreePedestrianInstanceBatch[] {
  const batches = new Map<
    HomeDriveThreePedestrianInstanceBatchKey,
    HomeDriveThreePedestrianInstancedRigEntry[]
  >();

  entries.forEach((entry) => {
    const role = entry.agent.role ?? "generic";
    const key = getBatchKey(role, entry.detailLevel);
    const current = batches.get(key);

    if (current) {
      current.push(entry);
    } else {
      batches.set(key, [entry]);
    }
  });

  return Array.from(batches.entries())
    .map(([key, batchEntries]) => {
      const [role, detailLevel] = key.split(":") as [
        HomeDrivePedestrianRole | "generic",
        HomeDriveThreePedestrianInstancedRigDetailLevel,
      ];

      return {
        key,
        role,
        detailLevel,
        entries: batchEntries,
      };
    })
    .sort((first, second) => first.key.localeCompare(second.key));
}
