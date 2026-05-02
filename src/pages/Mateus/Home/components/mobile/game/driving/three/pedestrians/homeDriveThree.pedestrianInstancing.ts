// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstancing.ts

import type { ColorRepresentation } from "three";
import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import type {
  HomeDriveThreePedestrianInstancedBucket,
  HomeDriveThreePedestrianInstancedBucketKey,
  HomeDriveThreePedestrianInstancedEntry,
  HomeDriveThreePedestrianInstancePalette,
} from "./homeDriveThree.pedestrianInstancing.types";

function normalizeRole(role: string): HomeDriveThreePedestrianInstancedBucketKey {
  switch (role) {
    case "worker":
    case "shopper":
    case "runner":
    case "elder":
    case "child":
    case "parent":
    case "smoker":
    case "adult":
      return role;

    default:
      return "generic";
  }
}

export function getHomeDriveThreePedestrianInstancedBucketKey(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianInstancedBucketKey {
  return normalizeRole(agent.role);
}

export function groupHomeDriveThreePedestrianInstancedEntries(
  entries: readonly HomeDriveThreePedestrianInstancedEntry[],
): readonly HomeDriveThreePedestrianInstancedBucket[] {
  const buckets = new Map<
    HomeDriveThreePedestrianInstancedBucketKey,
    HomeDriveThreePedestrianInstancedEntry[]
  >();

  entries.forEach((entry) => {
    const key = getHomeDriveThreePedestrianInstancedBucketKey(entry.agent);
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(entry);
    } else {
      buckets.set(key, [entry]);
    }
  });

  return Array.from(buckets.entries())
    .map(([key, bucketEntries]) => ({
      key,
      entries: bucketEntries,
    }))
    .sort((first, second) => first.key.localeCompare(second.key));
}

export function getHomeDriveThreePedestrianInstancedScale(
  agent: HomeDrivePedestrianAgent,
): Readonly<{ x: number; y: number; z: number }> {
  const bodyScale = Math.max(0.72, Math.min(1.18, agent.appearance.bodyScale));

  switch (agent.role) {
    case "child":
      return { x: 0.72 * bodyScale, y: 0.74 * bodyScale, z: 0.72 * bodyScale };

    case "elder":
      return { x: 0.92 * bodyScale, y: 0.9 * bodyScale, z: 0.92 * bodyScale };

    case "runner":
      return { x: 0.86 * bodyScale, y: 1.04 * bodyScale, z: 0.86 * bodyScale };

    case "worker":
      return { x: 0.98 * bodyScale, y: 1.04 * bodyScale, z: 0.98 * bodyScale };

    case "parent":
      return { x: bodyScale, y: 1.02 * bodyScale, z: bodyScale };

    default:
      return { x: 0.94 * bodyScale, y: bodyScale, z: 0.94 * bodyScale };
  }
}

export function getHomeDriveThreePedestrianInstancedPalette(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianInstancePalette {
  const skinColors: Record<string, ColorRepresentation> = {
    "tone-1": "#e7bd96",
    "tone-2": "#d49a73",
    "tone-3": "#b97857",
    "tone-4": "#965b40",
    "tone-5": "#70412f",
    "tone-6": "#4d2d23",
  };
  const clothingColors: Record<string, ColorRepresentation> = {
    "coastal-light": "#d9d2bc",
    "urban-dark": "#30343d",
    "office-neutral": "#7b776d",
    "market-colorful": "#9a5145",
    sport: "#37616c",
    "casual-blue": "#3d5f83",
    "casual-earth": "#78624c",
  };

  const body =
    clothingColors[agent.appearance.clothingPaletteKey] ??
    (agent.role === "worker"
      ? "#39485a"
      : agent.role === "shopper"
        ? "#66503b"
        : agent.role === "runner"
          ? "#3d5960"
          : "#42464b");

  const head =
    skinColors[agent.appearance.skinToneKey] ??
    (agent.role === "child" ? "#d49a73" : "#b97857");

  return {
    body,
    head,
    accent: agent.appearance.walkStyleKey === "hurried" ? "#6f7f84" : "#34363a",
  };
}

export function filterHomeDriveThreePedestrianInstancedEntries<
  TEntry extends Readonly<{
    agent: HomeDrivePedestrianAgent;
    detailLevel: string;
    distanceSquared?: number;
    distanceMeters?: number;
    visibilityRank?: number;
  }>,
>(
  entries: readonly TEntry[],
): readonly HomeDriveThreePedestrianInstancedEntry[] {
  return entries
    .filter((entry) => {
      return entry.detailLevel === "medium";
    })
    .map((entry) => {
      const distanceSquared =
        typeof entry.distanceSquared === "number" ? entry.distanceSquared : undefined;

      return {
        agent: entry.agent,
        detailLevel: "medium",
        distanceSquared,
        distanceMeters:
          typeof entry.distanceMeters === "number"
            ? entry.distanceMeters
            : typeof distanceSquared === "number"
              ? Math.sqrt(Math.max(0, distanceSquared))
              : undefined,
        visibilityRank:
          typeof entry.visibilityRank === "number"
            ? entry.visibilityRank
            : undefined,
      };
    });
}


