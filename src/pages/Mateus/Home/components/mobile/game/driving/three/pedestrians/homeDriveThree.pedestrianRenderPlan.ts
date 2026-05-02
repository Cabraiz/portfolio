// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderPlan.ts

import type {
  HomeDriveThreePedestrianRenderPlan,
  HomeDriveThreePedestrianRenderPlanOptions,
} from "./homeDriveThree.pedestrianRenderPlan.types";
import type { HomeDriveThreeVisiblePedestrianEntry } from "./homeDriveThree.pedestrianVisibility";

const DEFAULT_MAX_FULL_REACT_PEDESTRIANS = 96;

function hasHandLink(entry: HomeDriveThreeVisiblePedestrianEntry): boolean {
  return (
    entry.agent.handHoldTargetId != null ||
    entry.agent.groupKind === "adult-child" ||
    entry.agent.props.includes("child-hand-link")
  );
}

/**
 * Plano de render sem LOD visual distante.
 *
 * Não existe mais:
 * - mediumReactEntries;
 * - instancedEntries;
 * - createInstancedEntry;
 * - fallback cinza/preto;
 * - rig simplificado de distância.
 *
 * Se couber no orçamento de React, o pedestre entra como full.
 * Se não couber, ele simplesmente não entra no render daquele snapshot.
 */
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
  const forceFullForHandLinks = options?.forceFullForHandLinks ?? true;
  const fullEntries: HomeDriveThreeVisiblePedestrianEntry[] = [];
  const selectedFullIds = new Set<string>();

  const sortedEntries = [...entries].sort((first, second) => {
    const firstHasHandLink = hasHandLink(first);
    const secondHasHandLink = hasHandLink(second);

    if (forceFullForHandLinks && firstHasHandLink !== secondHasHandLink) {
      return firstHasHandLink ? -1 : 1;
    }

    if (Math.abs(first.distanceSquared - second.distanceSquared) > 0.0001) {
      return first.distanceSquared - second.distanceSquared;
    }

    return first.agent.id.localeCompare(second.agent.id);
  });

  for (const entry of sortedEntries) {
    if (entry.detailLevel !== "full" && !(forceFullForHandLinks && hasHandLink(entry))) {
      continue;
    }

    if (fullEntries.length >= maxFullReactPedestrians) {
      continue;
    }

    fullEntries.push(entry);
    selectedFullIds.add(entry.agent.id);
  }

  const handLinkAgents = fullEntries
    .filter((entry) => {
      return selectedFullIds.has(entry.agent.id) && hasHandLink(entry);
    })
    .map((entry) => entry.agent);

  return {
    fullEntries,
    handLinkAgents,
    totalVisible: entries.length,
  };
}
