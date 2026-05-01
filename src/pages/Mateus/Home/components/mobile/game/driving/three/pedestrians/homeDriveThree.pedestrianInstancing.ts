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
      return role;

    case "adult":
      return "adult";

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
  switch (agent.role) {
    case "child":
      return { x: 0.72, y: 0.72, z: 0.72 };

    case "elder":
      return { x: 0.92, y: 0.9, z: 0.92 };

    case "runner":
      return { x: 0.86, y: 1.04, z: 0.86 };

    case "worker":
      return { x: 0.98, y: 1.04, z: 0.98 };

    case "parent":
      return { x: 1, y: 1.02, z: 1 };

    default:
      return { x: 0.94, y: 1, z: 0.94 };
  }
}

export function getHomeDriveThreePedestrianInstancedPalette(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianInstancePalette {
  const skinTone = String(agent.appearance.skinToneKey ?? "");
  const clothing = String(agent.appearance.clothingPaletteKey ?? "");
  const accent = String(agent.appearance.walkStyleKey ?? "");

  const skinColors: Record<string, ColorRepresentation> = {
    light: "#d8a17f",
    medium: "#b87854",
    tan: "#9b6245",
    dark: "#6f432e",
  };
  const clothingColors: Record<string, ColorRepresentation> = {
    blue: "#314b6d",
    green: "#344f3c",
    red: "#693334",
    yellow: "#6a5a2c",
    black: "#25272c",
    white: "#9a988f",
    gray: "#4d5256",
  };

  const body =
    clothingColors[clothing] ??
    (agent.role === "worker"
      ? "#39485a"
      : agent.role === "shopper"
        ? "#66503b"
        : agent.role === "runner"
          ? "#3d5960"
          : "#42464b");

  const head =
    skinColors[skinTone] ??
    (agent.role === "child" ? "#c89168" : "#a66b4d");

  return {
    body,
    head,
    accent: accent.includes("fast") ? "#6f7f84" : "#34363a",
  };
}

export function filterHomeDriveThreePedestrianInstancedEntries<
  TEntry extends Readonly<{ agent: HomeDrivePedestrianAgent; detailLevel: string }>,
>(
  entries: readonly TEntry[],
): readonly HomeDriveThreePedestrianInstancedEntry[] {
  return entries
    .filter((entry) => {
      return entry.detailLevel === "medium" || entry.detailLevel === "proxy";
    })
    .map((entry) => ({
      agent: entry.agent,
      detailLevel: entry.detailLevel === "medium" ? "medium" : "proxy",
      distanceMeters:
        "distanceMeters" in entry && typeof entry.distanceMeters === "number"
          ? entry.distanceMeters
          : undefined,
    }));
}
