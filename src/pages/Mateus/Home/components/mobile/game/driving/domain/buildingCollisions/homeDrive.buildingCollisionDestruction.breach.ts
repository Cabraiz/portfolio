// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDestruction.breach.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionEvent,
} from "./homeDrive.buildingCollision.types";
import {
  createHomeDriveBuildingCollisionBreachProfileFromEvent,
  createHomeDriveBuildingCollisionBreachProfileFromZone,
} from "./homeDrive.buildingCollisionBreach";
import type {
  HomeDriveBuildingCollisionBreachCreationOptions,
  HomeDriveBuildingCollisionBreachProfile,
} from "./homeDrive.buildingCollisionBreach.types";
import type {
  HomeDriveBuildingCollisionDestructionCreationOptions,
  HomeDriveBuildingDestructionEdgePoint,
  HomeDriveBuildingDestructionZone,
} from "./homeDrive.buildingCollisionDestruction.types";

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function hashString(value: string): number {
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

export function getFaceWidthMeters(event: HomeDriveBuildingCollisionEvent): number {
  return event.face === "front" || event.face === "back"
    ? event.buildingWidthMeters
    : event.buildingDepthMeters;
}

export function getFaceDepthMeters(event: HomeDriveBuildingCollisionEvent): number {
  return event.face === "front" || event.face === "back"
    ? event.buildingDepthMeters
    : event.buildingWidthMeters;
}

export function createEdgeProfile(
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

export function getEventLocalXMeters(
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

export function createGroundAnchoredBreachFromEvent(params: Readonly<{
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

export function createGroundAnchoredBreachFromZone(params: Readonly<{
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
