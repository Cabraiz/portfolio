// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBreach.helpers.ts
// Constantes e helpers numéricos da brecha.

import type {
  HomeDriveBuildingCollisionBreachCreationOptions,
  HomeDriveBuildingCollisionBreachFace,
} from "./homeDrive.buildingCollisionBreach.types";

const DEFAULT_MIN_SAMPLES = 9;
const DEFAULT_MAX_SAMPLES = 14;

const DEFAULT_MIN_HEIGHT_RATIO = 0.34;
const DEFAULT_MAX_HEIGHT_RATIO = 0.78;

const DEFAULT_MIN_WIDTH_RATIO = 0.38;
const DEFAULT_MAX_WIDTH_RATIO = 0.88;

const DEFAULT_MIN_DEPTH_RATIO = 0.44;
const DEFAULT_MAX_DEPTH_RATIO = 0.94;

const DEFAULT_JAGGEDNESS = 1;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const ratio = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));

  return ratio * ratio * (3 - 2 * ratio);
}

export function clampInteger(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}

export function hashStringToUint32(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function getFaceWidthMeters(
  face: HomeDriveBuildingCollisionBreachFace,
  buildingWidthMeters: number,
  buildingDepthMeters: number,
): number {
  return face === "front" || face === "back"
    ? buildingWidthMeters
    : buildingDepthMeters;
}

export function getFaceDepthMeters(
  face: HomeDriveBuildingCollisionBreachFace,
  buildingWidthMeters: number,
  buildingDepthMeters: number,
): number {
  return face === "front" || face === "back"
    ? buildingDepthMeters
    : buildingWidthMeters;
}

export function getOptions(options: HomeDriveBuildingCollisionBreachCreationOptions) {
  return {
    minSamples: clampInteger(options.minSamples ?? DEFAULT_MIN_SAMPLES, 5, 24),
    maxSamples: clampInteger(options.maxSamples ?? DEFAULT_MAX_SAMPLES, 5, 28),
    minHeightRatio: clamp(
      options.minHeightRatio ?? DEFAULT_MIN_HEIGHT_RATIO,
      0.12,
      0.92,
    ),
    maxHeightRatio: clamp(
      options.maxHeightRatio ?? DEFAULT_MAX_HEIGHT_RATIO,
      0.2,
      0.96,
    ),
    minWidthRatio: clamp(options.minWidthRatio ?? DEFAULT_MIN_WIDTH_RATIO, 0.12, 0.96),
    maxWidthRatio: clamp(options.maxWidthRatio ?? DEFAULT_MAX_WIDTH_RATIO, 0.2, 0.98),
    minDepthRatio: clamp(options.minDepthRatio ?? DEFAULT_MIN_DEPTH_RATIO, 0.1, 0.98),
    maxDepthRatio: clamp(options.maxDepthRatio ?? DEFAULT_MAX_DEPTH_RATIO, 0.2, 1),
    jaggedness: clamp(options.jaggedness ?? DEFAULT_JAGGEDNESS, 0, 2.35),
    anchorToGround: options.anchorToGround ?? true,
  };
}
