// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import {
  createHomeDriveBuildingCollisionBreachProfileFromEvent,
  createHomeDriveBuildingCollisionBreachProfileFromZone,
  createHomeDriveBuildingCollisionBreachZonePatch,
} from "./homeDrive.buildingCollisionBreach";
import type {
  HomeDriveBuildingCollisionBreachCreationOptions,
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
  HomeDriveBuildingDestructionEdgePoint,
  HomeDriveBuildingDestructionZone,
} from "./homeDrive.buildingCollisionDestruction.types";

const DEFAULT_MAX_DESTRUCTIONS = 96;
const DEFAULT_MAX_ZONES_PER_BUILDING = 3;
const DEFAULT_MERGE_DISTANCE_METERS = 3.25;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function hashString(value: string): number {
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

function getRightVector(rotationYRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(rotationYRad),
    z: -Math.sin(rotationYRad),
  };
}

function getForwardVector(rotationYRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(rotationYRad),
    z: Math.cos(rotationYRad),
  };
}

function dot(first: HomeDriveVector2, second: HomeDriveVector2): number {
  return first.x * second.x + first.z * second.z;
}

function getFaceWidthMeters(event: HomeDriveBuildingCollisionEvent): number {
  return event.face === "front" || event.face === "back"
    ? event.buildingWidthMeters
    : event.buildingDepthMeters;
}

function getFaceDepthMeters(event: HomeDriveBuildingCollisionEvent): number {
  return event.face === "front" || event.face === "back"
    ? event.buildingDepthMeters
    : event.buildingWidthMeters;
}

function createEdgeProfile(
  seed: number,
  severity: number,
  hitCount = 1,
): readonly HomeDriveBuildingDestructionEdgePoint[] {
  const random = createSeededRandom(seed + hitCount * 1009);
  const count = 22;
  const roughnessMeters =
    0.22 + severity * 0.68 + Math.min(0.44, hitCount * 0.045);

  return Array.from({ length: count }, (_, index) => {
    const t = index / count;
    const side = Math.floor(t * 4);
    const sideT = t * 4 - side;

    if (side === 0) {
      return {
        x: -1 + sideT * 2,
        y: 1,
        offsetMeters: (random() - 0.5) * roughnessMeters,
      };
    }

    if (side === 1) {
      return {
        x: 1,
        y: 1 - sideT * 2,
        offsetMeters: (random() - 0.5) * roughnessMeters,
      };
    }

    if (side === 2) {
      return {
        x: 1 - sideT * 2,
        y: -1,
        offsetMeters: (random() - 0.5) * roughnessMeters,
      };
    }

    return {
      x: -1,
      y: -1 + sideT * 2,
      offsetMeters: (random() - 0.5) * roughnessMeters,
    };
  });
}

function getEventLocalXMeters(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDestructionCreationOptions,
): number {
  if (typeof options.localXMeters === "number") {
    return options.localXMeters;
  }

  if (!options.buildingCenter) {
    return 0;
  }

  const delta = {
    x: event.position.x - options.buildingCenter.x,
    z: event.position.z - options.buildingCenter.z,
  };

  if (event.face === "front" || event.face === "back") {
    return dot(delta, getRightVector(event.buildingRotationYRad));
  }

  return dot(delta, getForwardVector(event.buildingRotationYRad));
}

function getBreachOptions(
  event: HomeDriveBuildingCollisionEvent,
  hitCount = 1,
): HomeDriveBuildingCollisionBreachCreationOptions {
  const severity = clamp01(event.severity);
  const speedRatio = clamp01(event.relativeSpeedMps / 28);
  const impulseRatio = clamp01(event.impulse / 42);
  const violence = clamp01(severity * 0.54 + speedRatio * 0.28 + impulseRatio * 0.18);

  return {
    minSamples: 10,
    maxSamples: Math.round(14 + violence * 4 + Math.min(3, hitCount)),
    minHeightRatio: 0.36 + violence * 0.08,
    maxHeightRatio: clamp(0.66 + violence * 0.18 + hitCount * 0.018, 0.66, 0.86),
    minWidthRatio: 0.44 + violence * 0.08,
    maxWidthRatio: clamp(0.76 + violence * 0.2 + hitCount * 0.018, 0.76, 0.96),
    minDepthRatio: 0.48 + violence * 0.08,
    maxDepthRatio: clamp(0.84 + violence * 0.15, 0.84, 0.98),
    jaggedness: clamp(1.08 + violence * 0.64 + hitCount * 0.035, 1.08, 1.92),
    anchorToGround: true,
  };
}

function createGroundAnchoredBreachFromEvent(params: Readonly<{
  event: HomeDriveBuildingCollisionEvent;
  localX: number;
  idSuffix?: string;
  hitCount?: number;
}>): HomeDriveBuildingCollisionBreachProfile {
  const { event, localX, idSuffix, hitCount = 1 } = params;

  return createHomeDriveBuildingCollisionBreachProfileFromEvent(
    {
      event,
      localX,
      idSuffix,
    },
    getBreachOptions(event, hitCount),
  );
}

function createGroundAnchoredBreachFromZone(params: Readonly<{
  zone: HomeDriveBuildingDestructionZone;
  hitCount: number;
  severity: number;
  localX: number;
  holeWidthMeters: number;
  holeHeightMeters: number;
  holeDepthMeters: number;
  seed: number;
}>): HomeDriveBuildingCollisionBreachProfile {
  const { zone, hitCount, severity, localX, holeWidthMeters, holeHeightMeters, holeDepthMeters, seed } = params;
  const event = zone.sourceEvent;

  return createHomeDriveBuildingCollisionBreachProfileFromZone(
    {
      id: zone.id,
      buildingId: zone.buildingId,
      face: zone.face,
      localX,
      normal: zone.normal,
      buildingHeightMeters: event.buildingHeightMeters,
      buildingWidthMeters: event.buildingWidthMeters,
      buildingDepthMeters: event.buildingDepthMeters,
      holeWidthMeters,
      holeHeightMeters,
      holeDepthMeters,
      severity,
      createdAtSeconds: zone.createdAtSeconds,
      seed,
    },
    getBreachOptions(event, hitCount),
  );
}

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

function getZoneDistanceMeters(
  first: HomeDriveBuildingDestructionZone,
  second: HomeDriveBuildingDestructionZone,
): number {
  if (first.face !== second.face) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.hypot(first.localX - second.localX, first.localY - second.localY);
}

function mergeHomeDriveBuildingDestructionZones(
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
