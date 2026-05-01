// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDeformation.ts

import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import { createHomeDriveBuildingCollisionDebrisPieces } from "./homeDrive.buildingCollisionDebris";
import type {
  HomeDriveBuildingCollisionDeformation,
  HomeDriveBuildingCollisionDeformationCreationOptions,
  HomeDriveBuildingCollisionDeformationKind,
  HomeDriveBuildingDamageChunk,
  HomeDriveBuildingDamagePlane,
  HomeDriveBuildingDamageRebar,
} from "./homeDrive.buildingCollisionDeformation.types";

const DEFAULT_MAX_DEFORMATIONS = 72;
const DEFAULT_MAX_CHUNKS_PER_IMPACT = 4;
const DEFAULT_MAX_REBARS_PER_IMPACT = 5;
const DEFAULT_MAX_DEBRIS_PIECES_PER_IMPACT = 8;
const DEFAULT_MERGE_DISTANCE_METERS = 3.35;

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

function getRotationYFromNormal(normal: Readonly<{ x: number; z: number }>): number {
  return Math.atan2(normal.x, normal.z);
}

function getDeformationKind(
  severity: number,
): HomeDriveBuildingCollisionDeformationKind {
  if (severity >= 0.82) {
    return "grotesque-facade-damage";
  }

  if (severity >= 0.68) {
    return "exposed-rebar";
  }

  if (severity >= 0.5) {
    return "collapsed-chunk";
  }

  if (severity >= 0.34) {
    return "deep-crater";
  }

  return "wall-dent";
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return (first.x - second.x) ** 2 + (first.z - second.z) ** 2;
}

function createDamagePlanes(
  event: HomeDriveBuildingCollisionEvent,
  random: () => number,
): readonly HomeDriveBuildingDamagePlane[] {
  const severity = clamp(event.severity, 0, 1);
  const craterWidth = 1.4 + severity * 3.35;
  const craterHeight = 1.04 + severity * 2.56;

  return [
    {
      id: `${event.buildingId}:plane:impact-stain`,
      kind: "impact-stain",
      localX: 0,
      localY: 0,
      widthMeters: craterWidth * 1.14,
      heightMeters: craterHeight * 1.08,
      rotationZRad: (random() - 0.5) * 0.13,
      opacity: 0.74 + severity * 0.18,
      surfaceOffsetMeters: 0.034,
    },
    {
      id: `${event.buildingId}:plane:broken-plaster`,
      kind: "broken-plaster",
      localX: (random() - 0.5) * 0.2,
      localY: (random() - 0.5) * 0.16,
      widthMeters: craterWidth * 0.88,
      heightMeters: craterHeight * 0.9,
      rotationZRad: (random() - 0.5) * 0.18,
      opacity: 0.74,
      surfaceOffsetMeters: 0.042,
    },
    {
      id: `${event.buildingId}:plane:inner-hole`,
      kind: "inner-hole",
      localX: (random() - 0.5) * 0.12,
      localY: (random() - 0.5) * 0.1,
      widthMeters: craterWidth * (0.32 + severity * 0.18),
      heightMeters: craterHeight * (0.3 + severity * 0.18),
      rotationZRad: (random() - 0.5) * 0.26,
      opacity: 0.86 + severity * 0.1,
      surfaceOffsetMeters: 0.052,
    },
    {
      id: `${event.buildingId}:plane:radial-cracks`,
      kind: "radial-cracks",
      localX: 0,
      localY: 0,
      widthMeters: craterWidth * 1.28,
      heightMeters: craterHeight * 1.18,
      rotationZRad: (random() - 0.5) * 0.24,
      opacity: 0.86,
      surfaceOffsetMeters: 0.068,
    },
    {
      id: `${event.buildingId}:plane:paint-transfer`,
      kind: "paint-transfer",
      localX: (random() - 0.5) * craterWidth * 0.18,
      localY: -craterHeight * (0.14 + random() * 0.12),
      widthMeters: craterWidth * (0.52 + random() * 0.22),
      heightMeters: 0.22 + severity * 0.24,
      rotationZRad: (random() - 0.5) * 0.14,
      opacity: 0.58,
      surfaceOffsetMeters: 0.074,
    },
  ];
}

function createDamageChunks(
  event: HomeDriveBuildingCollisionEvent,
  random: () => number,
  maxChunks: number,
): readonly HomeDriveBuildingDamageChunk[] {
  const severity = clamp(event.severity, 0, 1);

  if (severity < 0.28 || maxChunks <= 0) {
    return [];
  }

  const count = Math.max(1, Math.min(maxChunks, Math.round(1 + severity * 3)));
  const craterWidth = 1.15 + severity * 3.1;
  const craterHeight = 0.86 + severity * 2.25;

  return Array.from({ length: count }, (_, index) => {
    const side = random() > 0.5 ? 1 : -1;
    const localX =
      side *
      craterWidth *
      (0.18 + random() * 0.33) *
      (index % 3 === 0 ? 0.52 : 1);
    const localY =
      (random() - 0.5) * craterHeight * 0.62 +
      (index % 4 === 0 ? -craterHeight * 0.18 : 0);
    const kind =
      index % 5 === 0
        ? "dark-concrete"
        : index % 3 === 0
          ? "broken-plaster"
          : "concrete-slab";

    return {
      id: `${event.buildingId}:chunk:${event.occurredAtSeconds}:${index}`,
      kind,
      localX,
      localY,
      /*
       * Pequeno avanço para fora da parede. A peça parece presa/rachada,
       * não arremessada.
       */
      localOutMeters: 0.035 + random() * (0.055 + severity * 0.07),
      widthMeters: 0.22 + random() * (0.28 + severity * 0.36),
      heightMeters: 0.1 + random() * (0.14 + severity * 0.22),
      depthMeters: 0.035 + random() * (0.06 + severity * 0.08),
      rotationYRadOffset: (random() - 0.5) * 0.18,
      rotationZRad: (random() - 0.5) * 0.8,
      opacity: 0.88,
      seed: hashString(`${event.buildingId}:chunk:${event.occurredAtSeconds}:${index}`),
    };
  });
}

function createDamageRebars(
  event: HomeDriveBuildingCollisionEvent,
  random: () => number,
  maxRebars: number,
): readonly HomeDriveBuildingDamageRebar[] {
  const severity = clamp(event.severity, 0, 1);

  if (severity < 0.48 || maxRebars <= 0) {
    return [];
  }

  const count = Math.max(1, Math.min(maxRebars, Math.round(1 + severity * 3)));
  const craterWidth = 1.15 + severity * 3.3;
  const craterHeight = 0.86 + severity * 2.4;

  return Array.from({ length: count }, (_, index) => {
    const localX = (random() - 0.5) * craterWidth * 0.66;
    const localY = (random() - 0.5) * craterHeight * 0.56;

    return {
      id: `${event.buildingId}:rebar:${event.occurredAtSeconds}:${index}`,
      kind: "rebar",
      localX,
      localY,
      localOutMeters: 0.08 + random() * 0.15,
      lengthMeters: 0.62 + random() * (0.58 + severity * 0.74),
      radiusMeters: 0.018 + random() * 0.014,
      rotationYRadOffset: (random() - 0.5) * 0.18,
      rotationZRad: (random() - 0.5) * 1.08,
      bendRatio: 0.18 + random() * 0.52,
      opacity: 0.92,
      seed: hashString(`${event.buildingId}:rebar:${event.occurredAtSeconds}:${index}`),
    };
  });
}

function getDeformationSortScore(
  deformation: HomeDriveBuildingCollisionDeformation,
): number {
  return deformation.updatedAtSeconds * 10 + deformation.accumulatedSeverity;
}

function limitDeformations(
  deformations: readonly HomeDriveBuildingCollisionDeformation[],
  maxDeformations: number,
): readonly HomeDriveBuildingCollisionDeformation[] {
  if (deformations.length <= maxDeformations) {
    return deformations;
  }

  return [...deformations]
    .sort((first, second) => getDeformationSortScore(second) - getDeformationSortScore(first))
    .slice(0, maxDeformations);
}

function getMergedKind(
  first: HomeDriveBuildingCollisionDeformation,
  event: HomeDriveBuildingCollisionEvent,
): HomeDriveBuildingCollisionDeformationKind {
  return getDeformationKind(Math.max(first.severity, event.severity));
}

function shouldMergeDeformation(
  deformation: HomeDriveBuildingCollisionDeformation,
  event: HomeDriveBuildingCollisionEvent,
  mergeDistanceMeters: number,
): boolean {
  if (deformation.buildingId !== event.buildingId || deformation.face !== event.face) {
    return false;
  }

  const distanceSquared = getDistanceSquared(deformation.position, event.position);
  const allowedDistance = Math.max(
    mergeDistanceMeters,
    Math.min(5.8, deformation.radiusMeters * 0.78),
  );

  const verticalDistance = Math.abs(deformation.yMeters - event.contactYMeters);
  const allowedVerticalDistance = Math.max(1.35, deformation.radiusMeters * 0.42);

  return (
    distanceSquared <= allowedDistance * allowedDistance &&
    verticalDistance <= allowedVerticalDistance
  );
}

function mergeUniqueById<T extends Readonly<{ id: string }>>(
  first: readonly T[],
  second: readonly T[],
  maxItems: number,
): readonly T[] {
  const byId = new Map<string, T>();

  [...first, ...second].forEach((item) => {
    if (byId.size >= maxItems && !byId.has(item.id)) {
      return;
    }

    byId.set(item.id, item);
  });

  return [...byId.values()].slice(-maxItems);
}

export function createHomeDriveBuildingCollisionDeformationFromEvent(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDeformationCreationOptions = {},
): HomeDriveBuildingCollisionDeformation {
  const severity = clamp(event.severity, 0, 1);
  const seed = hashString(
    `${event.buildingId}:deformation:${event.occurredAtSeconds}:${event.impulse}`,
  );
  const random = createSeededRandom(seed);
  const isPersistent = options.persistent ?? true;
  const lifetimeSeconds = options.lifetimeSeconds;

  return {
    id: `${event.buildingId}:deformation:${event.face}:${event.occurredAtSeconds}:${seed}`,
    kind: getDeformationKind(severity),
    buildingId: event.buildingId,
    face: event.face,
    position: event.position,
    normal: event.normal,
    rotationYRad: getRotationYFromNormal(event.normal),
    localX: 0,
    localY: 0,
    yMeters: event.contactYMeters,
    severity,
    accumulatedSeverity: severity,
    hitCount: 1,
    radiusMeters: 1.14 + severity * 3.48,
    depthMeters: 0.16 + severity * 0.82,
    opacity: 1,
    createdAtSeconds: event.occurredAtSeconds,
    updatedAtSeconds: event.occurredAtSeconds,
    expiresAtSeconds:
      isPersistent || lifetimeSeconds === undefined
        ? null
        : event.occurredAtSeconds + lifetimeSeconds,
    isPersistent,
    seed,
    rimSeed: hashString(`${seed}:rim`),
    crackSeed: hashString(`${seed}:cracks`),
    stainSeed: hashString(`${seed}:stain`),
    sourceEvent: event,
    planes: createDamagePlanes(event, random),
    chunks: createDamageChunks(
      event,
      random,
      options.maxChunksPerImpact ?? DEFAULT_MAX_CHUNKS_PER_IMPACT,
    ),
    rebars: createDamageRebars(
      event,
      random,
      options.maxRebarsPerImpact ?? DEFAULT_MAX_REBARS_PER_IMPACT,
    ),
    debris: createHomeDriveBuildingCollisionDebrisPieces(event, {
      maxPieces:
        options.maxDebrisPiecesPerImpact ?? DEFAULT_MAX_DEBRIS_PIECES_PER_IMPACT,
    }),
  };
}

function mergeHomeDriveBuildingCollisionDeformation(
  current: HomeDriveBuildingCollisionDeformation,
  incoming: HomeDriveBuildingCollisionDeformation,
  options: HomeDriveBuildingCollisionDeformationCreationOptions,
): HomeDriveBuildingCollisionDeformation {
  const maxChunks = options.maxChunksPerImpact ?? DEFAULT_MAX_CHUNKS_PER_IMPACT;
  const maxRebars = options.maxRebarsPerImpact ?? DEFAULT_MAX_REBARS_PER_IMPACT;
  const maxDebris =
    options.maxDebrisPiecesPerImpact ?? DEFAULT_MAX_DEBRIS_PIECES_PER_IMPACT;

  const currentWeight = Math.max(1, current.hitCount);
  const incomingWeight = 1;
  const totalWeight = currentWeight + incomingWeight;
  const severity = clamp(
    Math.max(current.severity, incoming.severity) +
      Math.min(0.18, incoming.severity * 0.08),
    0,
    1,
  );

  return {
    ...current,
    kind: getMergedKind(current, incoming.sourceEvent),
    position: {
      x:
        (current.position.x * currentWeight + incoming.position.x * incomingWeight) /
        totalWeight,
      z:
        (current.position.z * currentWeight + incoming.position.z * incomingWeight) /
        totalWeight,
    },
    yMeters:
      (current.yMeters * currentWeight + incoming.yMeters * incomingWeight) /
      totalWeight,
    severity,
    accumulatedSeverity: clamp(
      current.accumulatedSeverity + incoming.severity * 0.42,
      0,
      2.85,
    ),
    hitCount: current.hitCount + 1,
    radiusMeters: clamp(
      Math.max(current.radiusMeters, incoming.radiusMeters) +
        incoming.severity * 0.42,
      1.1,
      6.2,
    ),
    depthMeters: clamp(
      Math.max(current.depthMeters, incoming.depthMeters) +
        incoming.severity * 0.115,
      0.14,
      1.25,
    ),
    opacity: 1,
    updatedAtSeconds: incoming.updatedAtSeconds,
    expiresAtSeconds: current.isPersistent ? null : incoming.expiresAtSeconds,
    sourceEvent: incoming.sourceEvent,
    planes: incoming.planes,
    chunks: mergeUniqueById(current.chunks, incoming.chunks, Math.max(1, maxChunks + 2)),
    rebars: mergeUniqueById(current.rebars, incoming.rebars, Math.max(1, maxRebars + 2)),
    debris: mergeUniqueById(current.debris, incoming.debris, Math.max(0, maxDebris + 4)),
  };
}

export function addHomeDriveBuildingCollisionDeformationToList(
  deformations: readonly HomeDriveBuildingCollisionDeformation[],
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDeformationCreationOptions = {},
): readonly HomeDriveBuildingCollisionDeformation[] {
  const maxDeformations = options.maxDeformations ?? DEFAULT_MAX_DEFORMATIONS;
  const mergeDistanceMeters =
    options.mergeDistanceMeters ?? DEFAULT_MERGE_DISTANCE_METERS;
  const nextDeformation = createHomeDriveBuildingCollisionDeformationFromEvent(
    event,
    options,
  );

  const existingIndex = deformations.findIndex((deformation) =>
    shouldMergeDeformation(deformation, event, mergeDistanceMeters),
  );

  if (existingIndex < 0) {
    return limitDeformations([...deformations, nextDeformation], maxDeformations);
  }

  return limitDeformations(
    deformations.map((deformation, index) => {
      if (index !== existingIndex) {
        return deformation;
      }

      return mergeHomeDriveBuildingCollisionDeformation(
        deformation,
        nextDeformation,
        options,
      );
    }),
    maxDeformations,
  );
}

export function tickHomeDriveBuildingCollisionDeformations(
  deformations: readonly HomeDriveBuildingCollisionDeformation[],
  nowSeconds: number,
  options: Readonly<{ maxDeformations?: number }> = {},
): readonly HomeDriveBuildingCollisionDeformation[] {
  const maxDeformations = options.maxDeformations ?? DEFAULT_MAX_DEFORMATIONS;

  const nextDeformations = deformations
    .filter((deformation) => {
      return (
        deformation.isPersistent ||
        deformation.expiresAtSeconds === null ||
        deformation.expiresAtSeconds > nowSeconds
      );
    })
    .map((deformation) => {
      if (deformation.isPersistent || deformation.expiresAtSeconds === null) {
        if (deformation.opacity >= 0.999) {
          return deformation;
        }

        return {
          ...deformation,
          opacity: 1,
        };
      }

      const totalLifetime = Math.max(
        0.001,
        deformation.expiresAtSeconds - deformation.createdAtSeconds,
      );
      const progress = clamp(
        (nowSeconds - deformation.createdAtSeconds) / totalLifetime,
        0,
        1,
      );
      const fadeStart = 0.86;
      const fadeProgress = clamp(
        (progress - fadeStart) / Math.max(0.001, 1 - fadeStart),
        0,
        1,
      );

      return {
        ...deformation,
        opacity: clamp(1 - fadeProgress, 0, 1),
      };
    });

  return limitDeformations(nextDeformations, maxDeformations);
}
