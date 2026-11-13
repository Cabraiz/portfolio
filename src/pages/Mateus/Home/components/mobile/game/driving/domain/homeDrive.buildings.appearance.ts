// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.appearance.ts

import { getHomeDriveStableStringSeed } from "./homeDrive.commerceNames";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveBuildingKind,
  HomeDriveBuildingMaterialKey,
  HomeDriveBuildingWindowStyle,
} from "./homeDrive.building.types";
import { getRoadTags, smoothstep01 } from "./homeDrive.buildings.lots";

export function pickBuildingKind(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveBuildingKind {
  const districtId = road.districtId;
  const tags = getRoadTags(road);
  const shapedSeed = smoothstep01(seed);

  if (road.kind === "service" || tags.includes("service")) {
    if (shapedSeed > 0.64) {
      return "warehouse";
    }

    if (shapedSeed > 0.28) {
      return "commerce";
    }

    return "house";
  }

  if (districtId === "castelao") {
    if (shapedSeed > 0.78) {
      return "commerce";
    }

    if (shapedSeed > 0.48) {
      return "warehouse";
    }

    if (shapedSeed > 0.18) {
      return "house";
    }

    return "commerce";
  }

  if (districtId === "centro") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.42) {
      return "apartment";
    }

    if (shapedSeed > 0.16) {
      return "commerce";
    }

    return "office";
  }

  if (districtId === "aldeota" || districtId === "meireles") {
    if (shapedSeed > 0.76) {
      return "office";
    }

    if (shapedSeed > 0.42) {
      return "apartment";
    }

    if (shapedSeed > 0.18) {
      return "commerce";
    }

    return "apartment";
  }

  if (districtId === "benfica") {
    if (shapedSeed > 0.74) {
      return "apartment";
    }

    if (shapedSeed > 0.42) {
      return "commerce";
    }

    if (shapedSeed > 0.16) {
      return "house";
    }

    return "apartment";
  }

  if (districtId === "praia-de-iracema") {
    if (shapedSeed > 0.62) {
      return "commerce";
    }

    if (shapedSeed > 0.28) {
      return "apartment";
    }

    return "house";
  }

  if (road.kind === "commercial") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.22) {
      return "commerce";
    }

    return "apartment";
  }

  if (road.kind === "avenue") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.36) {
      return "apartment";
    }

    return "commerce";
  }

  if (road.kind === "coastal") {
    if (shapedSeed > 0.64) {
      return "apartment";
    }

    if (shapedSeed > 0.24) {
      return "commerce";
    }

    return "house";
  }

  return shapedSeed > 0.58 ? "commerce" : "house";
}

export function getBuildingMaterialKey(
  kind: HomeDriveBuildingKind,
  seed: number,
): HomeDriveBuildingMaterialKey {
  switch (kind) {
    case "house":
      return seed > 0.5 ? "house-warm" : "house-cool";

    case "commerce":
      return seed > 0.56 ? "commerce-night" : "commerce-warm";

    case "apartment":
      return seed > 0.5 ? "apartment-concrete" : "apartment-light";

    case "office":
      return seed > 0.32 ? "office-blue" : "apartment-concrete";

    case "warehouse":
    default:
      return seed > 0.28 ? "warehouse-metal" : "commerce-night";
  }
}

export function getBuildingDimensions(
  kind: HomeDriveBuildingKind,
  seedA: number,
  seedB: number,
  seedC: number,
): Readonly<{
  widthMeters: number;
  depthMeters: number;
  heightMeters: number;
  floors: number;
}> {
  switch (kind) {
    case "house": {
      const floors = seedC > 0.66 ? 2 : 1;

      return {
        widthMeters: 7.5 + seedA * 7.4,
        depthMeters: 8 + seedB * 5.8,
        heightMeters: floors * 3.2 + 1.2 + seedA * 0.7,
        floors,
      };
    }

    case "commerce": {
      const floors =
        seedC > 0.86 ? 4 : seedC > 0.58 ? 3 : seedC > 0.24 ? 2 : 1;

      return {
        widthMeters: 9.5 + seedA * 12.8,
        depthMeters: 8.8 + seedB * 8.6,
        heightMeters: floors * 3.6 + 1.4 + seedB * 0.9,
        floors,
      };
    }

    case "apartment": {
      const floors = 3 + Math.floor(seedC * 9);

      return {
        widthMeters: 11 + seedA * 13.8,
        depthMeters: 10.5 + seedB * 10.2,
        heightMeters: floors * 3.05 + 2.2 + seedA * 1.1,
        floors,
      };
    }

    case "office": {
      const floors = 4 + Math.floor(seedC * 12);

      return {
        widthMeters: 12.5 + seedA * 15.2,
        depthMeters: 12 + seedB * 11.4,
        heightMeters: floors * 3.25 + 2.4 + seedB * 1.4,
        floors,
      };
    }

    case "warehouse":
    default: {
      return {
        widthMeters: 15 + seedA * 17.8,
        depthMeters: 13.5 + seedB * 14.5,
        heightMeters: 6 + seedC * 8.2,
        floors: 1,
      };
    }
  }
}

export function pickWindowStyle(
  kind: HomeDriveBuildingKind,
  buildingId: string,
  variant: number,
): HomeDriveBuildingWindowStyle {
  const seed = getHomeDriveStableStringSeed(
    `${buildingId}:window-style:${variant}`,
    113,
  );

  if (kind === "office") {
    return seed > 0.24 ? "glass" : "mixed";
  }

  if (kind === "warehouse") {
    return seed > 0.58 ? "gridded" : "dark";
  }

  if (kind === "house") {
    if (seed > 0.72) {
      return "open";
    }

    if (seed > 0.38) {
      return "wood";
    }

    return "mixed";
  }

  if (kind === "commerce") {
    if (seed > 0.72) {
      return "glass";
    }

    if (seed > 0.46) {
      return "mixed";
    }

    if (seed > 0.22) {
      return "wood";
    }

    return "dark";
  }

  if (seed > 0.72) {
    return "gridded";
  }

  if (seed > 0.46) {
    return "glass";
  }

  if (seed > 0.22) {
    return "mixed";
  }

  return "dark";
}

export function pickAirConditionerPresence(
  kind: HomeDriveBuildingKind,
  buildingId: string,
  variant: number,
): boolean {
  const seed = getHomeDriveStableStringSeed(
    `${buildingId}:air-conditioners:${variant}`,
    127,
  );

  switch (kind) {
    case "office":
    case "apartment":
      return seed > 0.24;

    case "commerce":
      return seed > 0.42;

    case "house":
      return seed > 0.68;

    case "warehouse":
    default:
      return seed > 0.82;
  }
}
