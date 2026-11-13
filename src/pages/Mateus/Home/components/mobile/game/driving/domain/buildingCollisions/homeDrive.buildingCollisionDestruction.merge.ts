// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.merge.ts

import {
  createHomeDriveBuildingCollisionBreachZonePatch,
} from "./homeDrive.buildingCollisionBreach";
import type {
  HomeDriveBuildingDestructionZone,
} from "./homeDrive.buildingCollisionDestruction.types";
import {
  clamp,
  getFaceWidthMeters,
  getFaceDepthMeters,
  createGroundAnchoredBreachFromZone,
  createEdgeProfile,
} from "./homeDrive.buildingCollisionDestruction.breach";

export function getZoneDistanceMeters(
  first: HomeDriveBuildingDestructionZone,
  second: HomeDriveBuildingDestructionZone,
): number {
  if (first.face !== second.face) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.hypot(first.localX - second.localX, first.localY - second.localY);
}

export function mergeHomeDriveBuildingDestructionZones(
  current: HomeDriveBuildingDestructionZone,
  incoming: HomeDriveBuildingDestructionZone,
): HomeDriveBuildingDestructionZone {
  const nextHitCount = current.hitCount + 1;
  const accumulatedSeverity = clamp(
    current.accumulatedSeverity + incoming.severity * 0.94,
    0,
    6,
  );
  const severity = clamp(
    Math.max(current.severity, incoming.severity) +
      Math.min(0.38, nextHitCount * 0.05),
    0,
    1,
  );

  const event = incoming.sourceEvent;
  const faceWidthMeters = getFaceWidthMeters(event);
  const faceDepthMeters = getFaceDepthMeters(event);

  const localX = clamp(
    (current.localX * current.hitCount + incoming.localX) / nextHitCount,
    -faceWidthMeters * 0.5,
    faceWidthMeters * 0.5,
  );

  const holeWidthMeters = clamp(
    Math.max(current.holeWidthMeters, incoming.holeWidthMeters) +
      incoming.severity * 0.86 +
      nextHitCount * 0.08,
    1.4,
    Math.max(1.5, faceWidthMeters * 0.98),
  );
  const holeHeightMeters = clamp(
    Math.max(current.holeHeightMeters, incoming.holeHeightMeters) +
      incoming.severity * 0.68 +
      nextHitCount * 0.06,
    1.2,
    Math.max(1.35, event.buildingHeightMeters * 0.9),
  );
  const holeDepthMeters = clamp(
    Math.max(current.holeDepthMeters, incoming.holeDepthMeters) +
      incoming.severity * 0.42,
    0.64,
    Math.max(0.68, faceDepthMeters * 0.98),
  );

  const tempZone = {
    ...current,
    localX,
    localY: holeHeightMeters * 0.5,
    worldPosition: incoming.worldPosition,
    normal: incoming.normal,
    rotationYRad: incoming.rotationYRad,
    holeBottomMeters: 0,
    holeTopMeters: holeHeightMeters,
    holeWidthMeters,
    holeHeightMeters,
    holeDepthMeters,
    severity,
    accumulatedSeverity,
    hitCount: nextHitCount,
    updatedAtSeconds: incoming.updatedAtSeconds,
    sourceEvent: incoming.sourceEvent,
  };

  const breachProfile = createGroundAnchoredBreachFromZone({
    zone: tempZone,
    hitCount: nextHitCount,
    severity,
    localX,
    holeWidthMeters,
    holeHeightMeters,
    holeDepthMeters,
    seed: current.seed + nextHitCount * 4099,
  });
  const patch = createHomeDriveBuildingCollisionBreachZonePatch(breachProfile);

  const holeBottomMeters = 0;
  const holeTopMeters = clamp(
    patch.holeTopMeters,
    Math.min(2.1, event.buildingHeightMeters),
    Math.max(2.2, event.buildingHeightMeters * 0.9),
  );
  const finalHoleHeightMeters = Math.max(0.4, holeTopMeters - holeBottomMeters);

  return {
    ...current,
    localX: breachProfile.localX,
    localY: holeBottomMeters + finalHoleHeightMeters * 0.5,
    worldPosition: incoming.worldPosition,
    normal: incoming.normal,
    rotationYRad: incoming.rotationYRad,
    holeBottomMeters,
    holeTopMeters,
    holeWidthMeters: clamp(patch.holeWidthMeters, 1.4, Math.max(1.5, faceWidthMeters * 0.98)),
    holeHeightMeters: finalHoleHeightMeters,
    holeDepthMeters: clamp(patch.holeDepthMeters, 0.64, Math.max(0.68, faceDepthMeters * 0.98)),
    breachProfile: {
      ...patch.breachProfile,
      bottomMeters: holeBottomMeters,
      topMeters: holeTopMeters,
      heightMeters: finalHoleHeightMeters,
    },
    severity,
    accumulatedSeverity,
    hitCount: nextHitCount,
    updatedAtSeconds: incoming.updatedAtSeconds,
    edgeProfile: createEdgeProfile(current.seed, severity, nextHitCount),
    sourceEvent: incoming.sourceEvent,
  };
}
