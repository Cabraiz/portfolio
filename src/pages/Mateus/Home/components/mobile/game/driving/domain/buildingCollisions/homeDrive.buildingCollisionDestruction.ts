// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.ts

import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import {
  createHomeDriveBuildingCollisionBreachZonePatch,
} from "./homeDrive.buildingCollisionBreach";
import type {
  HomeDriveBuildingCollisionBreachProfile,
} from "./homeDrive.buildingCollisionBreach.types";
import {
  createHomeDriveBuildingLeanStateFromEvent,
  mergeHomeDriveBuildingLeanStateFromEvent,
} from "./homeDrive.buildingCollisionLean";
import {
  createHomeDriveBuildingRubblePiecesFromEvent,
  limitHomeDriveBuildingRubblePieces,
} from "./homeDrive.buildingCollisionRubble";
import type {
  HomeDriveBuildingCollisionDestruction,
  HomeDriveBuildingCollisionDestructionCreationOptions,
  HomeDriveBuildingDestructionZone,
} from "./homeDrive.buildingCollisionDestruction.types";
import {
  clamp,
  getFaceWidthMeters,
  getFaceDepthMeters,
  getEventLocalXMeters,
  hashString,
  createGroundAnchoredBreachFromEvent,
  createEdgeProfile,
} from "./homeDrive.buildingCollisionDestruction.breach";
import {
  getZoneDistanceMeters,
  mergeHomeDriveBuildingDestructionZones,
} from "./homeDrive.buildingCollisionDestruction.merge";

const DEFAULT_MAX_DESTRUCTIONS = 96;
const DEFAULT_MAX_ZONES_PER_BUILDING = 3;
const DEFAULT_MERGE_DISTANCE_METERS = 3.25;

export function createHomeDriveBuildingDestructionZoneFromEvent(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDestructionCreationOptions = {},
): HomeDriveBuildingDestructionZone {
  const severity = clamp(event.severity, 0, 1);
  const faceWidthMeters = getFaceWidthMeters(event);
  const faceDepthMeters = getFaceDepthMeters(event);
  const localX = getEventLocalXMeters(event, options);

  const seed = hashString(
    `${event.buildingId}:destruction:${event.face}:${event.occurredAtSeconds}:${event.impulse}`,
  );

  const breachProfile = createGroundAnchoredBreachFromEvent({
    event,
    localX,
    idSuffix: `${seed}`,
  });
  const patch = createHomeDriveBuildingCollisionBreachZonePatch(breachProfile);

  const holeWidthMeters = clamp(
    patch.holeWidthMeters,
    1.5,
    Math.max(1.55, faceWidthMeters * 0.96),
  );
  const holeDepthMeters = clamp(
    patch.holeDepthMeters,
    0.64,
    Math.max(0.68, faceDepthMeters * 0.98),
  );
  const holeBottomMeters = 0;
  const holeTopMeters = clamp(
    patch.holeTopMeters,
    Math.min(2.1, event.buildingHeightMeters),
    Math.max(2.2, event.buildingHeightMeters * 0.88),
  );
  const holeHeightMeters = Math.max(0.4, holeTopMeters - holeBottomMeters);
  const localY = holeBottomMeters + holeHeightMeters * 0.5;

  const finalBreachProfile = {
    ...patch.breachProfile,
    localX: clamp(
      patch.breachProfile.localX,
      -faceWidthMeters * 0.5 + holeWidthMeters * 0.32,
      faceWidthMeters * 0.5 - holeWidthMeters * 0.32,
    ),
    bottomMeters: holeBottomMeters,
    topMeters: holeTopMeters,
    heightMeters: holeHeightMeters,
    maxHalfWidthMeters: holeWidthMeters * 0.5,
    maxDepthMeters: holeDepthMeters,
  } satisfies HomeDriveBuildingCollisionBreachProfile;

  return {
    id: `${event.buildingId}:destruction-zone:${event.face}:${seed}`,
    buildingId: event.buildingId,
    face: event.face,
    localX: finalBreachProfile.localX,
    localY,
    worldPosition: event.position,
    normal: event.normal,
    rotationYRad: event.buildingRotationYRad,
    holeBottomMeters,
    holeTopMeters,
    holeWidthMeters,
    holeHeightMeters,
    holeDepthMeters,
    breachProfile: finalBreachProfile,
    severity,
    accumulatedSeverity: severity,
    hitCount: 1,
    createdAtSeconds: event.occurredAtSeconds,
    updatedAtSeconds: event.occurredAtSeconds,
    seed,
    edgeProfile: createEdgeProfile(seed, severity),
    sourceEvent: event,
  };
}

function createRubbleForZone(
  destructionId: string,
  zone: HomeDriveBuildingDestructionZone,
  options: HomeDriveBuildingCollisionDestructionCreationOptions,
) {
  const rubbleIntensity = Math.max(
    options.rubbleIntensity ?? 1,
    1.28 + zone.severity * 1.18 + Math.min(0.5, zone.hitCount * 0.08),
  );

  return createHomeDriveBuildingRubblePiecesFromEvent(zone.sourceEvent, {
    ...options,
    rubbleIntensity,
    minRubblePiecesPerImpact: options.minRubblePiecesPerImpact ?? 26,
    maxRubblePiecesPerImpact: options.maxRubblePiecesPerImpact ?? 180,
    sourceDestructionId: destructionId,
    sourceZoneId: zone.id,
  });
}

function addZoneToDestruction(
  destruction: HomeDriveBuildingCollisionDestruction,
  zone: HomeDriveBuildingDestructionZone,
  options: HomeDriveBuildingCollisionDestructionCreationOptions,
): HomeDriveBuildingCollisionDestruction {
  const maxZonesPerBuilding =
    options.maxZonesPerBuilding ?? DEFAULT_MAX_ZONES_PER_BUILDING;
  const mergeDistanceMeters =
    options.mergeDistanceMeters ?? DEFAULT_MERGE_DISTANCE_METERS;

  const mergeIndex = destruction.zones.findIndex((currentZone) => {
    return getZoneDistanceMeters(currentZone, zone) <= mergeDistanceMeters;
  });

  const zones =
    mergeIndex >= 0
      ? destruction.zones.map((currentZone, index) => {
          return index === mergeIndex
            ? mergeHomeDriveBuildingDestructionZones(currentZone, zone)
            : currentZone;
        })
      : [...destruction.zones, zone];

  const limitedZones = [...zones]
    .sort((first, second) => second.updatedAtSeconds - first.updatedAtSeconds)
    .slice(0, maxZonesPerBuilding);

  const incomingRubble = createRubbleForZone(destruction.id, zone, options);
  const rubble = limitHomeDriveBuildingRubblePieces(
    [...destruction.rubble, ...incomingRubble],
    options,
  );
  const lean = mergeHomeDriveBuildingLeanStateFromEvent(
    destruction.lean,
    zone.sourceEvent,
    options,
  );

  return {
    ...destruction,
    zones: limitedZones,
    rubble,
    lean,
    strongestSeverity: Math.max(
      destruction.strongestSeverity,
      ...limitedZones.map((currentZone) => currentZone.severity),
    ),
    totalHitCount: limitedZones.reduce(
      (total, currentZone) => total + currentZone.hitCount,
      0,
    ),
    updatedAtSeconds: zone.updatedAtSeconds,
    serial: destruction.serial + 1,
  };
}

function createDestructionFromZone(
  zone: HomeDriveBuildingDestructionZone,
  options: HomeDriveBuildingCollisionDestructionCreationOptions,
): HomeDriveBuildingCollisionDestruction {
  const id = `${zone.buildingId}:destruction`;
  const rubble = limitHomeDriveBuildingRubblePieces(
    createRubbleForZone(id, zone, options),
    options,
  );

  return {
    id,
    buildingId: zone.buildingId,
    zones: [zone],
    rubble,
    lean: createHomeDriveBuildingLeanStateFromEvent(zone.sourceEvent, options),
    strongestSeverity: zone.severity,
    totalHitCount: zone.hitCount,
    createdAtSeconds: zone.createdAtSeconds,
    updatedAtSeconds: zone.updatedAtSeconds,
    serial: 1,
  };
}

function limitDestructions(
  destructions: readonly HomeDriveBuildingCollisionDestruction[],
  maxDestructions: number,
): readonly HomeDriveBuildingCollisionDestruction[] {
  if (destructions.length <= maxDestructions) {
    return destructions;
  }

  return [...destructions]
    .sort((first, second) => second.updatedAtSeconds - first.updatedAtSeconds)
    .slice(0, maxDestructions);
}

export function addHomeDriveBuildingCollisionDestructionToList(
  destructions: readonly HomeDriveBuildingCollisionDestruction[],
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDestructionCreationOptions = {},
): readonly HomeDriveBuildingCollisionDestruction[] {
  const zone = createHomeDriveBuildingDestructionZoneFromEvent(event, options);
  const existingIndex = destructions.findIndex((destruction) => {
    return destruction.buildingId === event.buildingId;
  });

  const nextDestructions =
    existingIndex >= 0
      ? destructions.map((destruction, index) => {
          return index === existingIndex
            ? addZoneToDestruction(destruction, zone, options)
            : destruction;
        })
      : [...destructions, createDestructionFromZone(zone, options)];

  return limitDestructions(
    nextDestructions,
    options.maxDestructions ?? DEFAULT_MAX_DESTRUCTIONS,
  );
}

export function tickHomeDriveBuildingCollisionDestructions(
  destructions: readonly HomeDriveBuildingCollisionDestruction[],
  _nowSeconds: number,
  options: Readonly<{ maxDestructions?: number }> = {},
): readonly HomeDriveBuildingCollisionDestruction[] {
  return limitDestructions(
    destructions,
    options.maxDestructions ?? DEFAULT_MAX_DESTRUCTIONS,
  );
}

export function getHomeDriveDamagedBuildingIds(
  destructions: readonly HomeDriveBuildingCollisionDestruction[],
): readonly string[] {
  return Array.from(
    new Set(
      destructions
        .filter((destruction) => destruction.zones.length > 0)
        .map((destruction) => destruction.buildingId),
    ),
  ).sort((first, second) => first.localeCompare(second));
}
