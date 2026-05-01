// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderPlan.ts

import type { HomeDriveThreePedestrianInstancedRigEntry } from "./homeDriveThree.pedestrianInstanceBatches.types";
import type {
  HomeDriveThreePedestrianRenderPlan,
  HomeDriveThreePedestrianRenderPlanOptions,
} from "./homeDriveThree.pedestrianRenderPlan.types";
import type { HomeDriveThreeVisiblePedestrianEntry } from "./homeDriveThree.pedestrianVisibility";

const DEFAULT_MAX_FULL_REACT_PEDESTRIANS = 48;
const DEFAULT_MAX_MEDIUM_REACT_PEDESTRIANS = 0;

function hasHandLink(entry: HomeDriveThreeVisiblePedestrianEntry): boolean {
  return (
    entry.agent.handHoldTargetId != null ||
    entry.agent.groupKind === "adult-child" ||
    entry.agent.props.includes("child-hand-link")
  );
}

function shouldPreferFullReact(
  entry: HomeDriveThreeVisiblePedestrianEntry,
): boolean {
  return entry.detailLevel === "full" || hasHandLink(entry);
}

function createInstancedEntry(
  entry: HomeDriveThreeVisiblePedestrianEntry,
): HomeDriveThreePedestrianInstancedRigEntry {
  return {
    agent: entry.agent,
    detailLevel: entry.detailLevel === "proxy" ? "proxy" : "medium",
    distanceSquared: entry.distanceSquared,
    distanceMeters: Math.sqrt(Math.max(0, entry.distanceSquared)),
    visibilityRank: entry.visibilityRank,
  };
}

export function getHomeDriveThreePedestrianRenderPlan(
  entries: readonly HomeDriveThreeVisiblePedestrianEntry[],
  options?: HomeDriveThreePedestrianRenderPlanOptions,
): HomeDriveThreePedestrianRenderPlan {
  const maxFullReactPedestrians = Math.max(
    0,
    Math.floor(
      options?.maxFullReactPedestrians ?? DEFAULT_MAX_FULL_REACT_PEDESTRIANS,
    ),
  );
  const maxMediumReactPedestrians = Math.max(
    0,
    Math.floor(
      options?.maxMediumReactPedestrians ??
        DEFAULT_MAX_MEDIUM_REACT_PEDESTRIANS,
    ),
  );
  const forceFullForHandLinks = options?.forceFullForHandLinks ?? true;
  const fullEntries: HomeDriveThreeVisiblePedestrianEntry[] = [];
  const mediumReactEntries: HomeDriveThreeVisiblePedestrianEntry[] = [];
  const instancedEntries: HomeDriveThreePedestrianInstancedRigEntry[] = [];
  const selectedFullIds = new Set<string>();

  const sortedEntries = [...entries].sort((first, second) => {
    if (Math.abs(first.distanceSquared - second.distanceSquared) > 0.0001) {
      return first.distanceSquared - second.distanceSquared;
    }

    return first.agent.id.localeCompare(second.agent.id);
  });

  for (const entry of sortedEntries) {
    if (entry.detailLevel === "proxy") {
      instancedEntries.push(createInstancedEntry(entry));
      continue;
    }

    const preferredFull = shouldPreferFullReact(entry);
    const forcedHandLink =
      forceFullForHandLinks && hasHandLink(entry) && fullEntries.length < maxFullReactPedestrians;
    const canUseFull =
      fullEntries.length < maxFullReactPedestrians &&
      (entry.detailLevel === "full" || preferredFull);

    if (forcedHandLink || canUseFull) {
      fullEntries.push(entry);
      selectedFullIds.add(entry.agent.id);
      continue;
    }

    if (
      entry.detailLevel === "medium" &&
      mediumReactEntries.length < maxMediumReactPedestrians
    ) {
      mediumReactEntries.push(entry);
      continue;
    }

    instancedEntries.push(createInstancedEntry(entry));
  }

  const handLinkAgents = fullEntries
    .filter((entry) => {
      return selectedFullIds.has(entry.agent.id) && hasHandLink(entry);
    })
    .map((entry) => entry.agent);

  return {
    fullEntries,
    mediumReactEntries,
    instancedEntries,
    handLinkAgents,
    totalVisible: entries.length,
  };
}
