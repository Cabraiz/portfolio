// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBreach.ts

import type {
  HomeDriveBuildingCollisionBreachCreationInput,
  HomeDriveBuildingCollisionBreachCreationOptions,
  HomeDriveBuildingCollisionBreachFromZoneInput,
  HomeDriveBuildingCollisionBreachProfile,
  HomeDriveBuildingCollisionBreachZonePatch,
} from "./homeDrive.buildingCollisionBreach.types";
import {
  clamp,
  clamp01,
  lerp,
  hashStringToUint32,
  getFaceWidthMeters,
  getFaceDepthMeters,
} from "./homeDrive.buildingCollisionBreach.helpers";
import { createProfile } from "./homeDrive.buildingCollisionBreach.profile";

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
