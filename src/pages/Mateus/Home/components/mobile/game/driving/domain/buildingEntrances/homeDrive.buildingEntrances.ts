// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.ts

import type { HomeDriveBuildingKind } from "../homeDrive.building.types";
import type {
  HomeDriveBuildingEntranceCanopyKind,
  HomeDriveBuildingEntranceCondition,
  HomeDriveBuildingEntranceKind,
  HomeDriveBuildingEntranceKindWeights,
  HomeDriveBuildingEntranceMaterial,
  HomeDriveBuildingEntranceMaterialWeights,
  HomeDriveBuildingEntranceProfile,
  HomeDriveBuildingEntranceResolutionInput,
  HomeDriveBuildingEntranceSignKind,
} from "./homeDrive.buildingEntrances.types";

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

function normalizeSeed(value: number | undefined, fallback: number): number {
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

function seeded01(...parts: readonly (string | number | undefined)[]): number {
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

function weightedPick<T extends string>(
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

function hasPremiumBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.premiumBias === true ||
    PREMIUM_DISTRICTS.has(input.districtId ?? "") ||
    input.materialKey === "office-blue" ||
    input.materialKey === "apartment-light"
  );
}

function hasCommercialBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.commercialBias === true ||
    input.kind === "commerce" ||
    input.kind === "office" ||
    COMMERCIAL_ROAD_KINDS.has(input.roadKind ?? "")
  );
}

function hasServiceBias(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    input.serviceBias === true ||
    input.kind === "warehouse" ||
    SERVICE_ROAD_KINDS.has(input.roadKind ?? "") ||
    input.materialKey === "warehouse-metal"
  );
}

function hasAgedBias(input: HomeDriveBuildingEntranceResolutionInput): boolean {
  return (
    input.agedBias === true ||
    AGED_DISTRICTS.has(input.districtId ?? "") ||
    input.materialKey === "commerce-night"
  );
}

function isDenseUrban(
  input: HomeDriveBuildingEntranceResolutionInput,
): boolean {
  return (
    DENSE_URBAN_DISTRICTS.has(input.districtId ?? "") ||
    input.kind === "office" ||
    input.kind === "apartment" ||
    COMMERCIAL_ROAD_KINDS.has(input.roadKind ?? "")
  );
}

function getKindWeights(
  input: HomeDriveBuildingEntranceResolutionInput,
): HomeDriveBuildingEntranceKindWeights {
  const premium = hasPremiumBias(input);
  const commercial = hasCommercialBias(input);
  const service = hasServiceBias(input);
  const aged = hasAgedBias(input);
  const dense = isDenseUrban(input);

  switch (input.kind) {
    case "house":
      return {
        "single-door": 4.8,
        "double-door": premium ? 1.05 : 0.34,
        "tall-door": 0.92,
        "portaria": 0,
        "garage-door": 0.72,
        "broken-door": aged ? 0.88 : 0.22,
        "service-gate": service ? 0.88 : 0.42,
        "shopfront-door": 0,
      };

    case "apartment":
      return {
        "single-door": 1.28,
        "double-door": 2.25,
        "tall-door": 0.84,
        "portaria": premium ? 3.6 : 2.1,
        "garage-door": dense ? 0.44 : 0.2,
        "broken-door": aged ? 0.42 : 0.1,
        "service-gate": 0.32,
        "shopfront-door": 0,
      };

    case "office":
      return {
        "single-door": 0.48,
        "double-door": 2.2,
        "tall-door": 1.15,
        "portaria": premium ? 3.8 : 2.45,
        "garage-door": 0.18,
        "broken-door": 0.04,
        "service-gate": 0.32,
        "shopfront-door": 0.94,
      };

    case "commerce":
      return {
        "single-door": 0.92,
        "double-door": 1.55,
        "tall-door": 0.52,
        "portaria": premium ? 0.65 : 0.16,
        "garage-door": service ? 1.2 : 0.42,
        "broken-door": aged ? 0.52 : 0.12,
        "service-gate": 0.65,
        "shopfront-door": commercial ? 3.75 : 2.4,
      };

    case "warehouse":
      return {
        "single-door": 0.38,
        "double-door": 0.24,
        "tall-door": 0.42,
        "portaria": 0.05,
        "garage-door": 3.6,
        "broken-door": aged ? 0.42 : 0.14,
        "service-gate": 2.35,
        "shopfront-door": 0.12,
      };

    default:
      return {
        "single-door": 1,
      };
  }
}

function getMaterialWeights(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
): HomeDriveBuildingEntranceMaterialWeights {
  const premium = hasPremiumBias(input);
  const aged = hasAgedBias(input);

  if (entranceKind === "portaria") {
    return {
      glass: premium ? 4.2 : 2.8,
      metal: 0.62,
      painted: 0.32,
      dark: 0.44,
      wood: 0.1,
      "rolling-steel": 0,
    };
  }

  if (entranceKind === "shopfront-door") {
    return {
      glass: 3.8,
      metal: 0.72,
      painted: 0.35,
      dark: 0.24,
      wood: 0.05,
      "rolling-steel": 0.42,
    };
  }

  if (entranceKind === "garage-door") {
    return {
      "rolling-steel": 3.5,
      metal: 2.15,
      painted: 0.42,
      dark: 0.28,
      wood: 0.08,
      glass: 0,
    };
  }

  if (entranceKind === "service-gate") {
    return {
      metal: 2.65,
      "rolling-steel": 1.15,
      painted: 0.88,
      dark: 0.72,
      wood: 0.16,
      glass: 0,
    };
  }

  if (entranceKind === "broken-door") {
    return {
      wood: aged ? 2.15 : 1.35,
      metal: 1.25,
      painted: 1.15,
      dark: 0.9,
      glass: 0.1,
      "rolling-steel": 0.12,
    };
  }

  switch (input.kind) {
    case "house":
      return {
        wood: 2.6,
        painted: 1.95,
        metal: 0.64,
        dark: 0.3,
        glass: premium ? 0.28 : 0.08,
        "rolling-steel": 0,
      };

    case "apartment":
      return {
        glass: premium ? 1.8 : 0.88,
        metal: 1.34,
        painted: 0.85,
        dark: 0.72,
        wood: 0.44,
        "rolling-steel": 0,
      };

    case "office":
      return {
        glass: 3.2,
        metal: 1.05,
        dark: 0.6,
        painted: 0.28,
        wood: 0.04,
        "rolling-steel": 0,
      };

    case "commerce":
      return {
        glass: 2.55,
        metal: 0.95,
        painted: 0.85,
        dark: 0.42,
        wood: 0.18,
        "rolling-steel": 0.22,
      };

    case "warehouse":
      return {
        metal: 2.4,
        "rolling-steel": 2.1,
        painted: 0.58,
        dark: 0.52,
        wood: 0.08,
        glass: 0,
      };

    default:
      return {
        painted: 1,
      };
  }
}

function resolveEntranceCondition(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceCondition {
  if (entranceKind === "broken-door") {
    return seed > 0.62 ? "broken" : "damaged";
  }

  const aged = hasAgedBias(input);

  if (aged && seed > 0.78) {
    return "damaged";
  }

  if (aged && seed > 0.48) {
    return "aged";
  }

  if (seed > 0.76) {
    return "used";
  }

  return "clean";
}

function resolveDamageLevel(
  condition: HomeDriveBuildingEntranceCondition,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): 0 | 1 | 2 | 3 {
  if (entranceKind === "broken-door") {
    return seed > 0.58 ? 3 : 2;
  }

  switch (condition) {
    case "broken":
      return 3;
    case "damaged":
      return seed > 0.55 ? 2 : 1;
    case "aged":
    case "used":
      return seed > 0.72 ? 1 : 0;
    case "clean":
    default:
      return 0;
  }
}

function resolveEntranceWidthMeters(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): number {
  const facadeWidth = Math.max(3.2, input.widthMeters);
  const maxSafeWidth = Math.max(1.4, facadeWidth * 0.42);

  const width = (() => {
    switch (entranceKind) {
      case "portaria":
        return lerp(2.25, 3.7, seed);
      case "double-door":
        return lerp(1.85, 2.85, seed);
      case "tall-door":
        return lerp(1.24, 1.82, seed);
      case "garage-door":
        return lerp(2.7, 4.6, seed);
      case "service-gate":
        return lerp(1.75, 2.95, seed);
      case "shopfront-door":
        return lerp(2.15, 4.2, seed);
      case "broken-door":
        return lerp(1.05, 1.72, seed);
      case "single-door":
      default:
        return lerp(1.05, 1.62, seed);
    }
  })();

  return clamp(width, 0.82, maxSafeWidth);
}

function resolveEntranceHeightMeters(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  widthMeters: number,
  seed: number,
): number {
  const buildingSafeHeight = Math.max(2.2, input.heightMeters * 0.55);

  const height = (() => {
    switch (entranceKind) {
      case "portaria":
        return lerp(3.05, 4.35, seed);
      case "double-door":
        return lerp(2.55, 3.35, seed);
      case "tall-door":
        return lerp(3.1, 4.05, seed);
      case "garage-door":
        return lerp(2.65, 3.8, seed);
      case "service-gate":
        return lerp(2.25, 3.18, seed);
      case "shopfront-door":
        return lerp(2.85, 4.15, seed);
      case "broken-door":
        return lerp(2.05, 2.75, seed);
      case "single-door":
      default:
        return lerp(2.15, 2.85, seed);
    }
  })();

  return clamp(height, 1.85, Math.max(widthMeters * 0.82, buildingSafeHeight));
}

function resolveLocalX(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  widthMeters: number,
  seed: number,
): number {
  const facadeWidth = Math.max(3.2, input.widthMeters);
  const availableHalf = Math.max(0, facadeWidth * 0.5 - widthMeters * 0.68);

  if (
    entranceKind === "portaria" ||
    entranceKind === "garage-door" ||
    entranceKind === "shopfront-door"
  ) {
    return clamp((seed - 0.5) * availableHalf * 0.54, -availableHalf, availableHalf);
  }

  if (input.kind === "house") {
    return clamp((seed - 0.5) * availableHalf * 1.38, -availableHalf, availableHalf);
  }

  return clamp((seed - 0.5) * availableHalf * 0.82, -availableHalf, availableHalf);
}

function resolveCanopyKind(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceCanopyKind {
  const premium = hasPremiumBias(input);

  if (entranceKind === "garage-door" || entranceKind === "service-gate") {
    return seed > 0.76 ? "thin-metal" : "none";
  }

  if (entranceKind === "portaria") {
    if (premium && seed > 0.42) {
      return "glass";
    }

    return seed > 0.34 ? "flat-slab" : "none";
  }

  if (entranceKind === "shopfront-door") {
    if (seed > 0.72) {
      return "fabric";
    }

    return seed > 0.32 ? "thin-metal" : "none";
  }

  if (entranceKind === "double-door" || entranceKind === "tall-door") {
    return seed > 0.64 ? "flat-slab" : "none";
  }

  if (input.kind === "house") {
    return seed > 0.82 ? "thin-metal" : "none";
  }

  return seed > 0.78 ? "flat-slab" : "none";
}

function resolveSignKind(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceSignKind {
  const dense = isDenseUrban(input);
  const commercial = hasCommercialBias(input);
  const service = hasServiceBias(input);

  if (entranceKind === "garage-door") {
    if (seed > 0.42 || dense) {
      return "no-parking";
    }

    return "garage";
  }

  if (entranceKind === "service-gate") {
    if (seed > 0.62) {
      return "service";
    }

    return seed > 0.28 ? "private-property" : "none";
  }

  if (entranceKind === "portaria") {
    if (seed > 0.62) {
      return "reception";
    }

    return dense && seed > 0.34 ? "no-parking" : "none";
  }

  if (commercial && seed > 0.72) {
    return "no-parking";
  }

  if (input.kind === "house" && seed > 0.88) {
    return "private-property";
  }

  return "none";
}

function shouldHaveIntercom(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): boolean {
  if (entranceKind === "portaria") {
    return seed > 0.12;
  }

  if (input.kind === "apartment" || input.kind === "office") {
    return seed > 0.38;
  }

  if (entranceKind === "double-door" || entranceKind === "tall-door") {
    return seed > 0.72;
  }

  return false;
}

function shouldHaveSidePillars(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): boolean {
  if (entranceKind === "portaria") {
    return seed > 0.16;
  }

  if (entranceKind === "double-door" && hasPremiumBias(input)) {
    return seed > 0.44;
  }

  if (entranceKind === "garage-door" || entranceKind === "service-gate") {
    return seed > 0.72;
  }

  return false;
}

function shouldHaveCenterDivider(
  entranceKind: HomeDriveBuildingEntranceKind,
): boolean {
  return (
    entranceKind === "double-door" ||
    entranceKind === "portaria" ||
    entranceKind === "shopfront-door" ||
    entranceKind === "garage-door"
  );
}

function shouldHaveGlassHighlights(
  material: HomeDriveBuildingEntranceMaterial,
  entranceKind: HomeDriveBuildingEntranceKind,
): boolean {
  return (
    material === "glass" ||
    entranceKind === "portaria" ||
    entranceKind === "shopfront-door"
  );
}

function shouldHaveHandle(
  entranceKind: HomeDriveBuildingEntranceKind,
  material: HomeDriveBuildingEntranceMaterial,
): boolean {
  return (
    entranceKind !== "garage-door" &&
    material !== "rolling-steel" &&
    entranceKind !== "service-gate"
  );
}

function getFallbackEntranceKind(
  buildingKind: HomeDriveBuildingKind,
): HomeDriveBuildingEntranceKind {
  switch (buildingKind) {
    case "apartment":
      return "portaria";
    case "office":
      return "double-door";
    case "commerce":
      return "shopfront-door";
    case "warehouse":
      return "garage-door";
    case "house":
    default:
      return "single-door";
  }
}

function getFallbackMaterial(
  entranceKind: HomeDriveBuildingEntranceKind,
): HomeDriveBuildingEntranceMaterial {
  switch (entranceKind) {
    case "portaria":
    case "shopfront-door":
      return "glass";
    case "garage-door":
      return "rolling-steel";
    case "service-gate":
      return "metal";
    case "broken-door":
      return "wood";
    case "double-door":
    case "tall-door":
    case "single-door":
    default:
      return "painted";
  }
}

export function createHomeDriveBuildingEntranceProfile(
  input: HomeDriveBuildingEntranceResolutionInput,
): HomeDriveBuildingEntranceProfile {
  const baseSeed = normalizeSeed(
    input.facadeSeed,
    seeded01(input.buildingId, input.roadId, input.variant, "entrance"),
  );

  const kindSeed = seeded01(input.buildingId, input.roadId, baseSeed, "kind");
  const materialSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "material",
  );
  const conditionSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "condition",
  );
  const damageSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "damage",
  );
  const widthSeed = seeded01(input.buildingId, baseSeed, "width");
  const heightSeed = seeded01(input.buildingId, baseSeed, "height");
  const localXSeed = seeded01(input.buildingId, baseSeed, "local-x");
  const canopySeed = seeded01(input.buildingId, baseSeed, "canopy");
  const signSeed = seeded01(input.buildingId, baseSeed, "sign");
  const intercomSeed = seeded01(input.buildingId, baseSeed, "intercom");
  const pillarSeed = seeded01(input.buildingId, baseSeed, "pillars");
  const detailSeed = seeded01(input.buildingId, baseSeed, "detail");

  const kind = weightedPick<HomeDriveBuildingEntranceKind>(
    getKindWeights(input),
    kindSeed,
    getFallbackEntranceKind(input.kind),
  );

  const material = weightedPick<HomeDriveBuildingEntranceMaterial>(
    getMaterialWeights(input, kind),
    materialSeed,
    getFallbackMaterial(kind),
  );

  const condition = resolveEntranceCondition(input, kind, conditionSeed);
  const damageLevel = resolveDamageLevel(condition, kind, damageSeed);

  const widthMeters = resolveEntranceWidthMeters(input, kind, widthSeed);
  const heightMeters = resolveEntranceHeightMeters(
    input,
    kind,
    widthMeters,
    heightSeed,
  );

  const localX = resolveLocalX(input, kind, widthMeters, localXSeed);
  const canopyKind = resolveCanopyKind(input, kind, canopySeed);
  const signKind = resolveSignKind(input, kind, signSeed);

  const isGate = kind === "garage-door" || kind === "service-gate";
  const isPremiumEntrance = kind === "portaria" || kind === "double-door";
  const isGlassEntrance = shouldHaveGlassHighlights(material, kind);

  return {
    kind,
    material,
    condition,

    localX,
    widthMeters,
    heightMeters,
    baseYOffsetMeters: isGate ? 0.02 : 0,
    protrusionMeters: isPremiumEntrance ? 0.08 : 0.045,

    hasFrame: true,
    hasHandle: shouldHaveHandle(kind, material),
    hasIntercom: shouldHaveIntercom(input, kind, intercomSeed),
    hasSidePillars: shouldHaveSidePillars(input, kind, pillarSeed),
    hasCenterDivider: shouldHaveCenterDivider(kind),
    hasGlassHighlights: isGlassEntrance,

    canopyKind,
    signKind,
    damageLevel,
    detailSeed,
  };
}

export function getHomeDriveBuildingEntranceIsPublic(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return (
    entrance.kind === "portaria" ||
    entrance.kind === "shopfront-door" ||
    entrance.signKind === "reception"
  );
}

export function getHomeDriveBuildingEntranceHasNoParkingSign(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return entrance.signKind === "no-parking";
}

export function getHomeDriveBuildingEntranceIsGarageLike(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return entrance.kind === "garage-door" || entrance.kind === "service-gate";
}

export function getHomeDriveBuildingEntranceVisualPriority(
  entrance: HomeDriveBuildingEntranceProfile,
): number {
  switch (entrance.kind) {
    case "portaria":
      return 5;
    case "shopfront-door":
      return 4;
    case "garage-door":
    case "double-door":
      return 3;
    case "tall-door":
    case "service-gate":
      return 2;
    case "broken-door":
    case "single-door":
    default:
      return 1;
  }
}
