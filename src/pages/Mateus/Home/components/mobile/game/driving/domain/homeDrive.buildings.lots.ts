// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.lots.ts

import { hashVector } from "./homeDrive.math";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveBuildingSide } from "./homeDrive.building.types";
import {
  BUILDING_DEVELOPMENT_CHANCE_MULTIPLIER,
  LOT_POSITION_JITTER_RATIO,
  LOT_ENDPOINT_PADDING_RATIO,
} from "./homeDrive.buildings.constants";
import type { BuildingAxis } from "./homeDrive.buildings.constants";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function smoothstep01(value: number): number {
  const x = clamp01(value);

  return x * x * (3 - 2 * x);
}

export function dot(first: BuildingAxis, second: BuildingAxis): number {
  return first.x * second.x + first.z * second.z;
}

export function normalizeVector2(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return {
      x: 1,
      z: 0,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

export function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 17;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 31 + road.id.charCodeAt(index)) % 9973;
  }

  return hash + road.segmentIndex * 101;
}

export function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

export function getSideSalt(side: HomeDriveBuildingSide): number {
  return side === 1 ? 0 : 10_000;
}

export function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 7.4;

    case "avenue":
      return 5;

    case "commercial":
      return 4.6;

    case "ring":
      return 4.2;

    case "service":
      return 2.4;

    case "street":
      return 3;

    default:
      if (road.roadTone === "boulevard") {
        return 6.2;
      }

      if (road.roadTone === "urban-core") {
        return 4.1;
      }

      return 3.7;
  }
}

export function getCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

export function getRoadDevelopmentChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  let baseChance = 0.72;

  if (tags.includes("closed-loop")) {
    baseChance = 0.58;
  } else if (tags.includes("service") || road.kind === "service") {
    baseChance = 0.72;
  } else if (road.kind === "coastal") {
    baseChance = 0.78;
  } else if (road.kind === "avenue") {
    baseChance = 0.9;
  } else if (road.kind === "commercial") {
    baseChance = 0.94;
  } else if (road.kind === "street") {
    baseChance = 0.86;
  } else if (road.kind === "ring") {
    baseChance = 0.76;
  }

  if (tags.includes("main") || tags.includes("fast")) {
    baseChance += 0.08;
  }

  return clamp(baseChance * BUILDING_DEVELOPMENT_CHANCE_MULTIPLIER, 0, 0.98);
}

export function getLotSpacingMeters(road: HomeDriveGeneratedRoadSegment): number {
  /*
    Mantém a escala original do lote.
    A multiplicação real vem de BUILDING_SLOT_DENSITY_MULTIPLIER.
  */
  switch (road.kind) {
    case "coastal":
      return 86;

    case "avenue":
      return 72;

    case "commercial":
      return 54;

    case "ring":
      return 88;

    case "service":
      return 76;

    case "street":
      return 48;

    default:
      return 64;
  }
}

export function getLotSetbackMeters(_road: HomeDriveGeneratedRoadSegment): number {
  return 0;
}

export function getPointOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
): HomeDriveVector2 {
  return {
    x: road.from.x + (road.to.x - road.from.x) * t,
    z: road.from.z + (road.to.z - road.from.z) * t,
  };
}

export function getPaddedSlotT(
  roadSeed: number,
  slotIndex: number,
  slotCount: number,
  side: HomeDriveBuildingSide,
  salt: number,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawSlotT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const jitterSeed = hashVector(roadSeed, slotIndex, salt + getSideSalt(side));
  const jitter = (jitterSeed - 0.5) * slotWidth * LOT_POSITION_JITTER_RATIO;
  const shapedT = clamp01(rawSlotT + jitter);

  return (
    LOT_ENDPOINT_PADDING_RATIO +
    shapedT * (1 - LOT_ENDPOINT_PADDING_RATIO * 2)
  );
}

export function getRotationYForRoad(road: HomeDriveGeneratedRoadSegment): number {
  /*
    Alinha a largura do box com a direção da rua.
    Em Three.js, um box unitário usa X como largura e Z como profundidade.
  */
  return Math.atan2(-road.direction.z, road.direction.x);
}
