// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.helpers.ts
// Constantes, helpers numéricos e vieses.

import type { HomeDriveBuildingEntranceResolutionInput } from "./homeDrive.buildingEntrances.types";

const PREMIUM_DISTRICTS = new Set([
  "aldeota",
  "meireles",
  "praia-de-iracema",
]);

const DENSE_URBAN_DISTRICTS = new Set([
  "centro",
  "aldeota",
  "meireles",
  "benfica",
]);

const AGED_DISTRICTS = new Set([
  "centro",
  "benfica",
  "castelao",
]);

const COMMERCIAL_ROAD_KINDS = new Set([
  "commercial",
  "avenue",
  "boulevard",
  "corridor",
]);

const SERVICE_ROAD_KINDS = new Set([
  "service",
  "industrial",
]);

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

export function normalizeSeed(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return clamp01(Math.abs(value ?? fallback) % 1);
}

function hashStringToUint32(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function seeded01(...parts: readonly (string | number | undefined)[]): number {
  const normalized = parts
    .map((part) => {
      if (typeof part === "number") {
        return Number.isFinite(part) ? part.toFixed(6) : "0";
      }

      return part ?? "";
    })
    .join("|");

  return hashStringToUint32(normalized) / 4294967295;
}

export function weightedPick<T extends string>(
  weights: Readonly<Partial<Record<T, number>>>,
  seed: number,
  fallback: T,
): T {
  let total = 0;

  for (const weight of Object.values(weights)) {
    if (typeof weight === "number" && Number.isFinite(weight) && weight > 0) {
      total += weight;
    }
  }

  if (total <= 0) {
    return fallback;
  }

  let cursor = clamp01(seed) * total;

  for (const [key, rawWeight] of Object.entries(weights) as [T, number][]) {
    const weight =
      typeof rawWeight === "number" && Number.isFinite(rawWeight)
        ? Math.max(0, rawWeight)
        : 0;

    if (weight <= 0) {
      continue;
    }

    cursor -= weight;

    if (cursor <= 0) {
      return key;
    }
  }

  return fallback;
}

export function hasPremiumBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.premiumBias === true ||
    PREMIUM_DISTRICTS.has(input.districtId ?? "") ||
    input.materialKey === "office-blue" ||
    input.materialKey === "apartment-light"
  );
}

export function hasCommercialBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.commercialBias === true ||
    input.kind === "commerce" ||
    input.kind === "office" ||
    COMMERCIAL_ROAD_KINDS.has(input.roadKind ?? "")
  );
}

export function hasServiceBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.serviceBias === true ||
    input.kind === "warehouse" ||
    SERVICE_ROAD_KINDS.has(input.roadKind ?? "") ||
    input.materialKey === "warehouse-metal"
  );
}

export function hasAgedBias(input: HomeDriveBuildingEntranceResolutionInput): boolean {
  return (
    input.agedBias === true ||
    AGED_DISTRICTS.has(input.districtId ?? "") ||
    input.materialKey === "commerce-night"
  );
}

export function isDenseUrban(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    DENSE_URBAN_DISTRICTS.has(input.districtId ?? "") ||
    input.kind === "office" ||
    input.kind === "apartment" ||
    COMMERCIAL_ROAD_KINDS.has(input.roadKind ?? "")
  );
}
