// src/pages/Mateus/Home/components/mobile/game/driving/domain/crosswalks/homeDrive.crosswalks.geometry.ts
// Chance, espaçamento e geometria das faixas.

import { hashVector } from "../homeDrive.math";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import type { HomeDriveCrosswalk, HomeDriveCrosswalkKind } from "./homeDrive.crosswalks.types";

export const DEFAULT_MAX_CROSSWALKS = 96;
export const DEFAULT_MIN_ROAD_LENGTH_METERS = 82;
export const DEFAULT_CROSSWALK_DENSITY = 1;

const CROSSWALK_ENDPOINT_PADDING_RATIO = 0.16;
export const CROSSWALK_SIDEWALK_REACH_METERS = 5.2;

export type CrosswalkCandidate = Readonly<{
  crosswalk: HomeDriveCrosswalk;
  priority: number;
}>;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
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

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

export function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 29;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 41 + road.id.charCodeAt(index)) % 130363;
  }

  return hash + road.segmentIndex * 149;
}

export function getCrosswalkRoadChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("safe-endcap")) {
    return 0;
  }

  if (road.kind === "service") {
    return 0.1;
  }

  if (road.kind === "commercial") {
    return 0.86;
  }

  if (road.kind === "avenue") {
    return 0.72;
  }

  if (road.kind === "street") {
    return 0.62;
  }

  if (road.kind === "coastal") {
    return 0.54;
  }

  if (road.kind === "ring") {
    return 0.32;
  }

  if (tags.includes("main")) {
    return 0.66;
  }

  return 0.48;
}

export function getCrosswalkSlotSpacingMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  switch (road.kind) {
    case "commercial":
      return 190;

    case "avenue":
      return 235;

    case "street":
      return 215;

    case "coastal":
      return 260;

    case "ring":
      return 310;

    case "service":
      return 360;

    default:
      return 250;
  }
}

export function getCrosswalkKind(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveCrosswalkKind {
  if (road.kind === "avenue") {
    return seed > 0.28 ? "avenue-zebra" : "double-zebra";
  }

  if (road.kind === "commercial") {
    return seed > 0.2 ? "commercial" : "zebra";
  }

  if (road.districtId === "benfica" || road.districtId === "castelao") {
    return seed > 0.72 ? "school" : "zebra";
  }

  if (road.kind === "coastal") {
    return seed > 0.54 ? "double-zebra" : "zebra";
  }

  return seed > 0.72 ? "double-zebra" : "zebra";
}

export function getCrosswalkLengthMeters(kind: HomeDriveCrosswalkKind): number {
  switch (kind) {
    case "avenue-zebra":
      return 8.8;

    case "double-zebra":
      return 7.2;

    case "school":
      return 7.8;

    case "commercial":
      return 7.4;

    case "zebra":
    default:
      return 6.4;
  }
}

export function getCrosswalkStripeCount(
  kind: HomeDriveCrosswalkKind,
  roadWidthMeters: number,
): number {
  const baseCount = Math.max(4, Math.floor(roadWidthMeters / 1.85));

  switch (kind) {
    case "avenue-zebra":
      return clamp(baseCount + 2, 7, 16);

    case "double-zebra":
      return clamp(baseCount + 1, 6, 14);

    case "school":
      return clamp(baseCount + 2, 7, 15);

    case "commercial":
      return clamp(baseCount + 1, 6, 14);

    case "zebra":
    default:
      return clamp(baseCount, 5, 13);
  }
}

export function getCrosswalkStripeLengthMeters(
  kind: HomeDriveCrosswalkKind,
  lengthMeters: number,
): number {
  switch (kind) {
    case "avenue-zebra":
      return lengthMeters * 0.9;

    case "school":
      return lengthMeters * 0.88;

    case "commercial":
      return lengthMeters * 0.86;

    case "double-zebra":
      return lengthMeters * 0.84;

    case "zebra":
    default:
      return lengthMeters * 0.82;
  }
}

export function getCrosswalkStripeWidthMeters(
  kind: HomeDriveCrosswalkKind,
  widthMeters: number,
  stripeCount: number,
): number {
  const step = widthMeters / Math.max(1, stripeCount);
  const baseWidth = step * 0.48;

  switch (kind) {
    case "avenue-zebra":
      return clamp(baseWidth, 0.58, 1.14);

    case "school":
      return clamp(baseWidth * 1.04, 0.58, 1.18);

    case "commercial":
      return clamp(baseWidth, 0.54, 1.08);

    case "double-zebra":
      return clamp(baseWidth, 0.54, 1.08);

    case "zebra":
    default:
      return clamp(baseWidth, 0.5, 1.02);
  }
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

export function getCrosswalkT(
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const jitter = (hashVector(roadSeed, slotIndex, 863) - 0.5) * slotWidth * 0.42;

  return (
    CROSSWALK_ENDPOINT_PADDING_RATIO +
    clamp01(rawT + jitter) * (1 - CROSSWALK_ENDPOINT_PADDING_RATIO * 2)
  );
}
