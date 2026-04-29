// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianRandom.ts

import type {
  HomeDrivePedestrianAppearance,
  HomeDrivePedestrianClothingPaletteKey,
  HomeDrivePedestrianRole,
  HomeDrivePedestrianSkinToneKey,
  HomeDrivePedestrianWalkStyleKey,
} from "./homeDrive.pedestrians.types";

export type HomeDriveWeightedOption<T> = Readonly<{
  value: T;
  weight: number;
}>;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function smoothstep01(value: number): number {
  const x = clamp01(value);

  return x * x * (3 - 2 * x);
}

export function hashStringToSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function hashNumbers(...values: readonly number[]): number {
  let hash = 2166136261;

  for (const value of values) {
    const normalized = Math.floor(Math.abs(value) * 1000003) | 0;
    hash ^= normalized;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createHomeDrivePedestrianSeed(
  namespace: string,
  ...values: readonly number[]
): number {
  return hashNumbers(hashStringToSeed(namespace), ...values);
}

export function seededRandom01(seed: number, salt = 0): number {
  const mixed = Math.sin((seed + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;

  return mixed - Math.floor(mixed);
}

export function seededRange(
  seed: number,
  salt: number,
  min: number,
  max: number,
): number {
  return lerp(min, max, seededRandom01(seed, salt));
}

export function seededInt(
  seed: number,
  salt: number,
  minInclusive: number,
  maxInclusive: number,
): number {
  const min = Math.ceil(minInclusive);
  const max = Math.floor(maxInclusive);

  return Math.floor(seededRandom01(seed, salt) * (max - min + 1)) + min;
}

export function seededSign(seed: number, salt: number): 1 | -1 {
  return seededRandom01(seed, salt) >= 0.5 ? 1 : -1;
}

export function seededChoice<T>(
  items: readonly T[],
  seed: number,
  salt: number,
  fallback: T,
): T {
  if (items.length <= 0) {
    return fallback;
  }

  const index = Math.floor(seededRandom01(seed, salt) * items.length) % items.length;

  return items[index] ?? fallback;
}

export function pickFromWeightedOptions<T>(
  options: readonly HomeDriveWeightedOption<T>[],
  seed: number,
  salt: number,
  fallback: T,
): T {
  if (options.length <= 0) {
    return fallback;
  }

  const totalWeight = options.reduce((sum, option) => {
    return sum + Math.max(0, option.weight);
  }, 0);

  if (totalWeight <= 0) {
    return fallback;
  }

  let cursor = seededRandom01(seed, salt) * totalWeight;

  for (const option of options) {
    cursor -= Math.max(0, option.weight);

    if (cursor <= 0) {
      return option.value;
    }
  }

  return options[options.length - 1]?.value ?? fallback;
}

function getSkinTone(seed: number): HomeDrivePedestrianSkinToneKey {
  return seededChoice(
    ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5", "tone-6"],
    seed,
    101,
    "tone-3",
  );
}

function getClothingPalette(
  role: HomeDrivePedestrianRole,
  seed: number,
): HomeDrivePedestrianClothingPaletteKey {
  if (role === "runner") {
    return "sport";
  }

  if (role === "worker") {
    return "office-neutral";
  }

  if (role === "shopper") {
    return seededChoice(
      ["market-colorful", "casual-blue", "casual-earth"],
      seed,
      131,
      "market-colorful",
    );
  }

  if (role === "smoker") {
    return seededChoice(
      ["urban-dark", "casual-earth", "casual-blue"],
      seed,
      137,
      "urban-dark",
    );
  }

  return seededChoice(
    [
      "coastal-light",
      "urban-dark",
      "office-neutral",
      "market-colorful",
      "casual-blue",
      "casual-earth",
    ],
    seed,
    139,
    "casual-blue",
  );
}

function getWalkStyle(
  role: HomeDrivePedestrianRole,
  seed: number,
): HomeDrivePedestrianWalkStyleKey {
  if (role === "child") {
    return "childlike";
  }

  if (role === "runner") {
    return "hurried";
  }

  if (role === "elder") {
    return "heavy";
  }

  return seededChoice(
    ["neutral", "relaxed", "hurried", "heavy"],
    seed,
    149,
    "neutral",
  );
}

function getHeightMeters(role: HomeDrivePedestrianRole, seed: number): number {
  switch (role) {
    case "child":
      return seededRange(seed, 157, 1.02, 1.36);
    case "elder":
      return seededRange(seed, 163, 1.5, 1.72);
    case "runner":
      return seededRange(seed, 167, 1.58, 1.86);
    default:
      return seededRange(seed, 173, 1.55, 1.88);
  }
}

export function createHomeDrivePedestrianAppearance(
  role: HomeDrivePedestrianRole,
  seed: number,
): HomeDrivePedestrianAppearance {
  const heightMeters = getHeightMeters(role, seed);
  const BODY_VISUAL_SCALE_MULTIPLIER = 1.5;

  const bodyScale = clamp(
    (heightMeters / 1.72) * BODY_VISUAL_SCALE_MULTIPLIER,
    0.62 * BODY_VISUAL_SCALE_MULTIPLIER,
    1.16 * BODY_VISUAL_SCALE_MULTIPLIER,
  );

  return {
    skinToneKey: getSkinTone(seed),
    clothingPaletteKey: getClothingPalette(role, seed),
    walkStyleKey: getWalkStyle(role, seed),
    heightMeters,
    shoulderWidthMeters:
      role === "child"
        ? seededRange(seed, 181, 0.26, 0.36)
        : seededRange(seed, 183, 0.38, 0.54),
    bodyScale,
    headScale: role === "child" ? seededRange(seed, 191, 0.92, 1.08) : seededRange(seed, 193, 0.86, 1.04),
    hairVariant: seededInt(seed, 197, 0, 8),
    outfitVariant: seededInt(seed, 199, 0, 11),
  };
}
