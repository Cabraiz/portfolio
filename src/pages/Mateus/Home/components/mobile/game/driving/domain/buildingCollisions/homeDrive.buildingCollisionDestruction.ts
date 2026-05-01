// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
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
const DEFAULT_MERGE_DISTANCE_METERS = 2.75;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
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
  const count = 18;
  const roughnessMeters = 0.16 + severity * 0.5 + Math.min(0.32, hitCount * 0.035);

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

function getEventLocalYMeters(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDestructionCreationOptions,
): number {
  return typeof options.localYMeters === "number"
    ? options.localYMeters
    : event.contactYMeters;
}

export function createHomeDriveBuildingDestructionZoneFromEvent(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDestructionCreationOptions = {},
): HomeDriveBuildingDestructionZone {
  const severity = clamp(event.severity, 0, 1);
  const faceWidthMeters = getFaceWidthMeters(event);
  const faceDepthMeters = getFaceDepthMeters(event);
  const localX = getEventLocalXMeters(event, options);

  const holeWidthMeters = clamp(
    1.55 + severity * 4.1 + clamp(event.relativeSpeedMps / 18, 0, 1) * 1.2,
    1.2,
    Math.max(1.25, faceWidthMeters * 0.78),
  );
  const holeHeightMeters = clamp(
    1.15 + severity * 3.35 + clamp(event.impulse / 32, 0, 1) * 1.05,
    0.95,
    Math.max(1.1, event.buildingHeightMeters * 0.62),
  );
  const holeDepthMeters = clamp(
    0.7 + severity * 2.65 + clamp(event.relativeSpeedMps / 22, 0, 1) * 1.4,
    0.58,
    Math.max(0.64, faceDepthMeters * 0.92),
  );

  const localY = clamp(
    getEventLocalYMeters(event, options),
    holeHeightMeters * 0.5 + 0.18,
    Math.max(
      holeHeightMeters * 0.5 + 0.22,
      event.buildingHeightMeters - holeHeightMeters * 0.5 - 0.16,
    ),
  );

  const seed = hashString(
    `${event.buildingId}:destruction:${event.face}:${event.occurredAtSeconds}:${event.impulse}`,
  );

  return {
    id: `${event.buildingId}:destruction-zone:${event.face}:${seed}`,
    buildingId: event.buildingId,
    face: event.face,
    localX: clamp(
      localX,
      -faceWidthMeters * 0.5 + holeWidthMeters * 0.5,
      faceWidthMeters * 0.5 - holeWidthMeters * 0.5,
    ),
    localY,
    worldPosition: event.position,
    normal: event.normal,
    rotationYRad: event.buildingRotationYRad,
    holeWidthMeters,
    holeHeightMeters,
    holeDepthMeters,
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
    current.accumulatedSeverity + incoming.severity * 0.92,
    0,
    6,
  );
  const severity = clamp(
    Math.max(current.severity, incoming.severity) +
      Math.min(0.32, nextHitCount * 0.04),
    0,
    1,
  );

  return {
    ...current,
    localX: (current.localX * current.hitCount + incoming.localX) / nextHitCount,
    localY: (current.localY * current.hitCount + incoming.localY) / nextHitCount,
    worldPosition: incoming.worldPosition,
    normal: incoming.normal,
    rotationYRad: incoming.rotationYRad,
    holeWidthMeters:
      Math.max(current.holeWidthMeters, incoming.holeWidthMeters) +
      incoming.severity * 0.6,
    holeHeightMeters:
      Math.max(current.holeHeightMeters, incoming.holeHeightMeters) +
      incoming.severity * 0.48,
    holeDepthMeters:
      Math.max(current.holeDepthMeters, incoming.holeDepthMeters) +
      incoming.severity * 0.32,
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
  return createHomeDriveBuildingRubblePiecesFromEvent(zone.sourceEvent, {
    ...options,
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
