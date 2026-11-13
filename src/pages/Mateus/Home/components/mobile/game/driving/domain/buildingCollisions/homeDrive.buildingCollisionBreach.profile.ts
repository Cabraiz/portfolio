// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBreach.profile.ts
// Amostras e perfil da brecha.

import type {
  HomeDriveBuildingCollisionBreachCreationOptions,
  HomeDriveBuildingCollisionBreachFace,
  HomeDriveBuildingCollisionBreachProfile,
  HomeDriveBuildingCollisionBreachSample,
} from "./homeDrive.buildingCollisionBreach.types";
import {
  clamp,
  clamp01,
  lerp,
  smoothstep,
  clampInteger,
  hashStringToUint32,
  createSeededRandom,
  getFaceWidthMeters,
  getFaceDepthMeters,
  getOptions,
} from "./homeDrive.buildingCollisionBreach.helpers";

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

export function createProfile(params: Readonly<{
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
