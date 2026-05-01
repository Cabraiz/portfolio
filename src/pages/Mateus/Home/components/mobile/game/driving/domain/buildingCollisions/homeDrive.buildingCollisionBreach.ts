// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBreach.ts

import type {
  HomeDriveBuildingCollisionBreachCreationInput,
  HomeDriveBuildingCollisionBreachCreationOptions,
  HomeDriveBuildingCollisionBreachFace,
  HomeDriveBuildingCollisionBreachFromZoneInput,
  HomeDriveBuildingCollisionBreachProfile,
  HomeDriveBuildingCollisionBreachSample,
  HomeDriveBuildingCollisionBreachZonePatch,
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const ratio = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));

  return ratio * ratio * (3 - 2 * ratio);
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}

function hashStringToUint32(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getFaceWidthMeters(
  face: HomeDriveBuildingCollisionBreachFace,
  buildingWidthMeters: number,
  buildingDepthMeters: number,
): number {
  return face === "front" || face === "back"
    ? buildingWidthMeters
    : buildingDepthMeters;
}

function getFaceDepthMeters(
  face: HomeDriveBuildingCollisionBreachFace,
  buildingWidthMeters: number,
  buildingDepthMeters: number,
): number {
  return face === "front" || face === "back"
    ? buildingDepthMeters
    : buildingWidthMeters;
}

function getOptions(options: HomeDriveBuildingCollisionBreachCreationOptions) {
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

function createBreachSample(params: Readonly<{
  index: number;
  sampleCount: number;
  bottomMeters: number;
  topMeters: number;
  maxHalfWidthMeters: number;
  maxDepthMeters: number;
  faceHalfWidthMeters: number;
  severity: number;
  speedRatio: number;
  jaggedness: number;
  random: () => number;
  seedBase: number;
}>): HomeDriveBuildingCollisionBreachSample {
  const {
    index,
    sampleCount,
    bottomMeters,
    topMeters,
    maxHalfWidthMeters,
    maxDepthMeters,
    faceHalfWidthMeters,
    severity,
    speedRatio,
    jaggedness,
    random,
    seedBase,
  } = params;

  const yRatio = sampleCount <= 1 ? 0 : index / (sampleCount - 1);
  const yMeters = lerp(bottomMeters, topMeters, yRatio);

  const middleBulge = Math.sin(Math.PI * clamp01(yRatio));
  const floorViolence = 1 - smoothstep(0.05, 0.34, yRatio) * 0.18;
  const topTaper = 1 - smoothstep(0.68, 1, yRatio) * 0.44;
  const asymmetry = (random() - 0.5) * 0.28 * jaggedness;
  const fractureWave =
    Math.sin(yRatio * Math.PI * (2.35 + random() * 0.45)) *
    0.08 *
    jaggedness;

  const widthRatio = clamp(
    (0.74 + middleBulge * 0.24 + asymmetry + fractureWave) *
      floorViolence *
      topTaper,
    0.34,
    1.12,
  );

  const halfWidthMeters = clamp(
    maxHalfWidthMeters * widthRatio,
    Math.min(0.42, maxHalfWidthMeters),
    faceHalfWidthMeters * 0.96,
  );

  const centerDrift =
    (Math.sin(yRatio * Math.PI * 1.4 + random() * 0.7) *
      maxHalfWidthMeters *
      0.09 +
      (random() - 0.5) * maxHalfWidthMeters * 0.075) *
    jaggedness;

  const maxCenterOffset = Math.max(
    0,
    faceHalfWidthMeters - halfWidthMeters - 0.08,
  );

  const centerOffsetMeters = clamp(
    centerDrift,
    -maxCenterOffset,
    maxCenterOffset,
  );

  const depthShape =
    0.82 +
    middleBulge * 0.18 -
    smoothstep(0.78, 1, yRatio) * 0.18 +
    (random() - 0.5) * 0.12 * jaggedness;

  const depthMeters = clamp(
    maxDepthMeters * depthShape,
    maxDepthMeters * 0.42,
    maxDepthMeters,
  );

  const fractureBase = lerp(
    0.1,
    0.38,
    clamp01(severity * 0.72 + speedRatio * 0.38),
  );
  const leftFractureMeters =
    (fractureBase + random() * fractureBase * 0.85) *
    jaggedness *
    (index % 2 === 0 ? 1 : 0.72);

  const rightFractureMeters =
    (fractureBase + random() * fractureBase * 0.85) *
    jaggedness *
    (index % 2 === 1 ? 1 : 0.72);

  const rimThicknessMeters = clamp(
    0.16 + severity * 0.28 + random() * 0.18 * jaggedness,
    0.12,
    0.62,
  );

  const rubbleWeight = clamp01(
    0.5 +
      severity * 0.36 +
      speedRatio * 0.32 +
      middleBulge * 0.12 -
      yRatio * 0.18,
  );

  const shadowOpacity = clamp01(
    0.55 + severity * 0.28 + depthShape * 0.12 - yRatio * 0.06,
  );

  return {
    yRatio,
    yMeters,
    centerOffsetMeters,
    halfWidthMeters,
    depthMeters,
    leftFractureMeters,
    rightFractureMeters,
    rimThicknessMeters,
    rubbleWeight,
    shadowOpacity,
    seed: hashStringToUint32(`${seedBase}:sample:${index}:${yRatio.toFixed(4)}`),
  };
}

function createProfile(params: Readonly<{
  id: string;
  buildingId: string;
  face: HomeDriveBuildingCollisionBreachFace;
  localX: number;
  normal: Readonly<{ x: number; z: number }>;
  buildingHeightMeters: number;
  buildingWidthMeters: number;
  buildingDepthMeters: number;
  severity: number;
  relativeSpeedMps: number;
  createdAtSeconds: number;
  seed: number;
  options?: HomeDriveBuildingCollisionBreachCreationOptions;
}>): HomeDriveBuildingCollisionBreachProfile {
  const resolvedOptions = getOptions(params.options ?? {});
  const severity = clamp01(params.severity);
  const speedRatio = clamp01(params.relativeSpeedMps / 32);

  const faceWidthMeters = getFaceWidthMeters(
    params.face,
    params.buildingWidthMeters,
    params.buildingDepthMeters,
  );
  const faceDepthMeters = getFaceDepthMeters(
    params.face,
    params.buildingWidthMeters,
    params.buildingDepthMeters,
  );

  const faceHalfWidthMeters = Math.max(0.1, faceWidthMeters * 0.5);
  const random = createSeededRandom(params.seed);

  const minHeightRatio = Math.min(
    resolvedOptions.minHeightRatio,
    resolvedOptions.maxHeightRatio,
  );
  const maxHeightRatio = Math.max(
    resolvedOptions.minHeightRatio,
    resolvedOptions.maxHeightRatio,
  );

  const minWidthRatio = Math.min(
    resolvedOptions.minWidthRatio,
    resolvedOptions.maxWidthRatio,
  );
  const maxWidthRatio = Math.max(
    resolvedOptions.minWidthRatio,
    resolvedOptions.maxWidthRatio,
  );

  const minDepthRatio = Math.min(
    resolvedOptions.minDepthRatio,
    resolvedOptions.maxDepthRatio,
  );
  const maxDepthRatio = Math.max(
    resolvedOptions.minDepthRatio,
    resolvedOptions.maxDepthRatio,
  );

  const bottomMeters = resolvedOptions.anchorToGround ? 0 : 0.12;

  const targetHeightRatio = clamp(
    lerp(minHeightRatio, maxHeightRatio, severity * 0.7 + speedRatio * 0.3) +
      (random() - 0.5) * 0.1,
    minHeightRatio,
    maxHeightRatio,
  );

  const topMeters = clamp(
    Math.max(2.2, params.buildingHeightMeters * targetHeightRatio),
    Math.min(params.buildingHeightMeters, 1.8),
    Math.max(2, params.buildingHeightMeters - 0.18),
  );

  const heightMeters = Math.max(0.4, topMeters - bottomMeters);

  const targetWidthRatio = clamp(
    lerp(minWidthRatio, maxWidthRatio, severity * 0.64 + speedRatio * 0.36) +
      (random() - 0.5) * 0.08,
    minWidthRatio,
    maxWidthRatio,
  );

  const maxHalfWidthMeters = clamp(
    faceWidthMeters * targetWidthRatio * 0.5,
    Math.min(0.72, faceHalfWidthMeters),
    faceHalfWidthMeters * 0.96,
  );

  const targetDepthRatio = clamp(
    lerp(minDepthRatio, maxDepthRatio, severity * 0.58 + speedRatio * 0.42) +
      random() * 0.08,
    minDepthRatio,
    maxDepthRatio,
  );

  const maxDepthMeters = clamp(
    faceDepthMeters * targetDepthRatio,
    Math.min(0.42, faceDepthMeters),
    Math.max(0.48, faceDepthMeters * 0.98),
  );

  const sampleCount = clampInteger(
    lerp(
      resolvedOptions.minSamples,
      resolvedOptions.maxSamples,
      clamp01(severity * 0.62 + speedRatio * 0.38),
    ) + random() * 2,
    Math.min(resolvedOptions.minSamples, resolvedOptions.maxSamples),
    Math.max(resolvedOptions.minSamples, resolvedOptions.maxSamples),
  );

  const clampedLocalX = clamp(
    params.localX,
    -faceHalfWidthMeters + maxHalfWidthMeters * 0.72,
    faceHalfWidthMeters - maxHalfWidthMeters * 0.72,
  );

  const samples = Array.from({ length: sampleCount }, (_, index) => {
    return createBreachSample({
      index,
      sampleCount,
      bottomMeters,
      topMeters,
      maxHalfWidthMeters,
      maxDepthMeters,
      faceHalfWidthMeters,
      severity,
      speedRatio,
      jaggedness: resolvedOptions.jaggedness,
      random,
      seedBase: params.seed,
    });
  });

  return {
    id: params.id,
    buildingId: params.buildingId,
    face: params.face,
    localX: clampedLocalX,
    normal: {
      x: params.normal.x,
      z: params.normal.z,
    },
    bottomMeters,
    topMeters,
    heightMeters,
    maxHalfWidthMeters,
    maxDepthMeters,
    samples,
    severity,
    createdAtSeconds: params.createdAtSeconds,
    seed: params.seed,
  };
}

export function createHomeDriveBuildingCollisionBreachProfileFromEvent(
  input: HomeDriveBuildingCollisionBreachCreationInput,
  options: HomeDriveBuildingCollisionBreachCreationOptions = {},
): HomeDriveBuildingCollisionBreachProfile {
  const { event } = input;
  const seed = hashStringToUint32(
    [
      event.buildingId,
      event.face,
      event.occurredAtSeconds.toFixed(3),
      event.relativeSpeedMps.toFixed(3),
      event.impulse.toFixed(3),
      input.idSuffix ?? "breach",
    ].join(":"),
  );

  return createProfile({
    id: `${event.buildingId}:breach:${event.occurredAtSeconds.toFixed(3)}:${
      input.idSuffix ?? "primary"
    }`,
    buildingId: event.buildingId,
    face: event.face,
    localX: input.localX ?? 0,
    normal: event.normal,
    buildingHeightMeters: event.buildingHeightMeters,
    buildingWidthMeters: event.buildingWidthMeters,
    buildingDepthMeters: event.buildingDepthMeters,
    severity: event.severity,
    relativeSpeedMps: event.relativeSpeedMps,
    createdAtSeconds: event.occurredAtSeconds,
    seed,
    options,
  });
}

export function createHomeDriveBuildingCollisionBreachProfileFromZone(
  input: HomeDriveBuildingCollisionBreachFromZoneInput,
  options: HomeDriveBuildingCollisionBreachCreationOptions = {},
): HomeDriveBuildingCollisionBreachProfile {
  const seed = hashStringToUint32(
    [
      input.id,
      input.buildingId,
      input.face,
      input.seed,
      input.holeWidthMeters.toFixed(3),
      input.holeHeightMeters.toFixed(3),
      input.holeDepthMeters.toFixed(3),
    ].join(":"),
  );

  const faceWidthMeters = getFaceWidthMeters(
    input.face,
    input.buildingWidthMeters,
    input.buildingDepthMeters,
  );
  const faceDepthMeters = getFaceDepthMeters(
    input.face,
    input.buildingWidthMeters,
    input.buildingDepthMeters,
  );

  const widthRatio = clamp(
    input.holeWidthMeters / Math.max(0.1, faceWidthMeters),
    0.1,
    0.98,
  );

  const heightRatio = clamp(
    input.holeHeightMeters / Math.max(0.1, input.buildingHeightMeters),
    0.1,
    0.96,
  );

  const depthRatio = clamp(
    input.holeDepthMeters / Math.max(0.1, faceDepthMeters),
    0.1,
    1,
  );

  return createProfile({
    id: `${input.id}:breach`,
    buildingId: input.buildingId,
    face: input.face,
    localX: input.localX,
    normal: input.normal,
    buildingHeightMeters: input.buildingHeightMeters,
    buildingWidthMeters: input.buildingWidthMeters,
    buildingDepthMeters: input.buildingDepthMeters,
    severity: input.severity,
    relativeSpeedMps: lerp(8, 30, clamp01(input.severity)),
    createdAtSeconds: input.createdAtSeconds,
    seed,
    options: {
      ...options,
      minHeightRatio: Math.max(0.1, heightRatio * 0.88),
      maxHeightRatio: Math.min(0.96, heightRatio * 1.12),
      minWidthRatio: Math.max(0.1, widthRatio * 0.86),
      maxWidthRatio: Math.min(0.98, widthRatio * 1.14),
      minDepthRatio: Math.max(0.1, depthRatio * 0.86),
      maxDepthRatio: Math.min(1, depthRatio * 1.14),
      anchorToGround: true,
    },
  });
}

export function normalizeHomeDriveBuildingCollisionBreachProfile(
  profile: HomeDriveBuildingCollisionBreachProfile,
): HomeDriveBuildingCollisionBreachProfile {
  const bottomMeters = Math.max(0, profile.bottomMeters);
  const topMeters = Math.max(bottomMeters + 0.1, profile.topMeters);

  const samples = [...profile.samples]
    .sort((first, second) => first.yRatio - second.yRatio)
    .map((sample) => ({
      ...sample,
      yRatio: clamp01(sample.yRatio),
      yMeters: clamp(sample.yMeters, bottomMeters, topMeters),
      halfWidthMeters: Math.max(0.05, sample.halfWidthMeters),
      depthMeters: Math.max(0.05, sample.depthMeters),
      rimThicknessMeters: Math.max(0.03, sample.rimThicknessMeters),
      rubbleWeight: clamp01(sample.rubbleWeight),
      shadowOpacity: clamp01(sample.shadowOpacity),
    }));

  return {
    ...profile,
    bottomMeters,
    topMeters,
    heightMeters: Math.max(0.1, topMeters - bottomMeters),
    maxHalfWidthMeters: Math.max(0.05, profile.maxHalfWidthMeters),
    maxDepthMeters: Math.max(0.05, profile.maxDepthMeters),
    severity: clamp01(profile.severity),
    samples,
  };
}

export function createHomeDriveBuildingCollisionBreachZonePatch(
  profile: HomeDriveBuildingCollisionBreachProfile,
): HomeDriveBuildingCollisionBreachZonePatch {
  const normalizedProfile = normalizeHomeDriveBuildingCollisionBreachProfile(profile);

  const maxHalfWidthMeters = normalizedProfile.samples.reduce(
    (maxValue, sample) => Math.max(maxValue, sample.halfWidthMeters),
    normalizedProfile.maxHalfWidthMeters,
  );

  const maxDepthMeters = normalizedProfile.samples.reduce(
    (maxValue, sample) => Math.max(maxValue, sample.depthMeters),
    normalizedProfile.maxDepthMeters,
  );

  return {
    holeBottomMeters: normalizedProfile.bottomMeters,
    holeTopMeters: normalizedProfile.topMeters,
    holeWidthMeters: maxHalfWidthMeters * 2,
    holeHeightMeters: normalizedProfile.topMeters - normalizedProfile.bottomMeters,
    holeDepthMeters: maxDepthMeters,
    breachProfile: normalizedProfile,
  };
}
