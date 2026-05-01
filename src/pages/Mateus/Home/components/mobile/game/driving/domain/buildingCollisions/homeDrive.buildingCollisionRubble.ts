// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionRubble.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingRubbleCreationOptions,
  HomeDriveBuildingRubblePiece,
  HomeDriveBuildingRubblePieceKind,
} from "./homeDrive.buildingCollisionRubble.types";

const DEFAULT_RUBBLE_INTENSITY = 1.35;
const DEFAULT_MIN_PIECES_PER_IMPACT = 26;
const DEFAULT_MAX_PIECES_PER_IMPACT = 180;
const DEFAULT_MAX_PIECES_PER_BUILDING = 520;
const DEFAULT_MAX_PIECES_TOTAL = 2400;

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

function normalizeVector(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.0001 || !Number.isFinite(length)) {
    return { x: 0, z: 1 };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getRightVectorFromNormal(normal: HomeDriveVector2): HomeDriveVector2 {
  const normalized = normalizeVector(normal);

  return {
    x: normalized.z,
    z: -normalized.x,
  };
}

function pickRubbleKind(
  randomValue: number,
  severity: number,
  index: number,
): HomeDriveBuildingRubblePieceKind {
  if (severity >= 0.78 && index % 9 === 0) {
    return "rebar-piece";
  }

  if (severity >= 0.68 && randomValue > 0.86) {
    return "concrete-boulder";
  }

  if (randomValue > 0.7) {
    return "broken-slab";
  }

  if (randomValue > 0.43) {
    return "concrete-rock";
  }

  if (randomValue > 0.14) {
    return "small-stone";
  }

  if (randomValue > 0.055) {
    return "plaster-shard";
  }

  return "dust-mound";
}

function getRubbleSize(params: Readonly<{
  kind: HomeDriveBuildingRubblePieceKind;
  severity: number;
  random: () => number;
}>): Readonly<{
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
}> {
  const severity = clamp(params.severity, 0, 1);

  switch (params.kind) {
    case "concrete-boulder":
      return {
        widthMeters: 0.52 + params.random() * (0.62 + severity * 0.9),
        heightMeters: 0.3 + params.random() * (0.36 + severity * 0.5),
        depthMeters: 0.48 + params.random() * (0.5 + severity * 0.76),
      };

    case "broken-slab":
      return {
        widthMeters: 0.7 + params.random() * (0.84 + severity * 1.05),
        heightMeters: 0.075 + params.random() * (0.12 + severity * 0.09),
        depthMeters: 0.38 + params.random() * (0.42 + severity * 0.5),
      };

    case "concrete-rock":
      return {
        widthMeters: 0.24 + params.random() * (0.38 + severity * 0.5),
        heightMeters: 0.16 + params.random() * (0.19 + severity * 0.24),
        depthMeters: 0.22 + params.random() * (0.34 + severity * 0.42),
      };

    case "small-stone":
      return {
        widthMeters: 0.07 + params.random() * 0.22,
        heightMeters: 0.045 + params.random() * 0.14,
        depthMeters: 0.07 + params.random() * 0.2,
      };

    case "plaster-shard":
      return {
        widthMeters: 0.18 + params.random() * 0.36,
        heightMeters: 0.022 + params.random() * 0.06,
        depthMeters: 0.12 + params.random() * 0.28,
      };

    case "rebar-piece":
      return {
        widthMeters: 0.032 + params.random() * 0.022,
        heightMeters: 0.032 + params.random() * 0.022,
        depthMeters: 0.88 + params.random() * (1.06 + severity * 1.1),
      };

    case "dust-mound":
    default:
      return {
        widthMeters: 0.28 + params.random() * 0.62,
        heightMeters: 0.018 + params.random() * 0.05,
        depthMeters: 0.24 + params.random() * 0.56,
      };
  }
}

function getRubblePieceCount(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingRubbleCreationOptions,
): number {
  const severity = clamp(event.severity, 0, 1);
  const intensity = clamp(options.rubbleIntensity ?? DEFAULT_RUBBLE_INTENSITY, 0, 3.25);
  const minPieces = Math.max(
    0,
    options.minRubblePiecesPerImpact ?? DEFAULT_MIN_PIECES_PER_IMPACT,
  );
  const maxPieces = Math.max(
    minPieces,
    options.maxRubblePiecesPerImpact ?? DEFAULT_MAX_PIECES_PER_IMPACT,
  );

  const impulseRatio = clamp(event.impulse / 38, 0, 1);
  const speedRatio = clamp(event.relativeSpeedMps / 30, 0, 1);

  return Math.round(
    clamp(
      (minPieces + severity * 72 + impulseRatio * 42 + speedRatio * 28) *
        intensity,
      minPieces,
      maxPieces,
    ),
  );
}

export function createHomeDriveBuildingRubblePiecesFromEvent(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingRubbleCreationOptions = {},
): readonly HomeDriveBuildingRubblePiece[] {
  const severity = clamp(event.severity, 0, 1);
  const count = getRubblePieceCount(event, options);
  const seed = hashString(
    `${event.buildingId}:rubble:${event.face}:${event.occurredAtSeconds}:${event.impulse}`,
  );
  const random = createSeededRandom(seed);
  const normal = normalizeVector(event.normal);
  const right = getRightVectorFromNormal(normal);
  const impactSpread = 1.4 + severity * 5.8;
  const forwardSpread =
    0.86 + severity * 7.4 + clamp(event.relativeSpeedMps / 18, 0, 1) * 2.8;

  return Array.from({ length: count }, (_, index): HomeDriveBuildingRubblePiece => {
    const kind = pickRubbleKind(random(), severity, index);
    const size = getRubbleSize({ kind, severity, random });
    const sideSign = random() > 0.5 ? 1 : -1;
    const sideMagnitude = Math.pow(random(), 0.54) * impactSpread;
    const localSideMeters = sideSign * sideMagnitude * (0.1 + random() * 0.94);
    const localForwardMeters =
      0.28 +
      Math.pow(random(), kind === "dust-mound" ? 0.4 : 0.46) *
        forwardSpread *
        (kind === "dust-mound" ? 0.82 : 1);
    const uphillJitter =
      kind === "rebar-piece" ? 0.16 + random() * 0.54 : random() * 0.18;

    return {
      id: `${event.buildingId}:rubble:${event.occurredAtSeconds}:${seed}:${index}`,
      buildingId: event.buildingId,
      sourceDestructionId: options.sourceDestructionId,
      sourceZoneId: options.sourceZoneId,
      kind,
      position: {
        x:
          event.position.x +
          right.x * localSideMeters +
          normal.x * localForwardMeters,
        z:
          event.position.z +
          right.z * localSideMeters +
          normal.z * localForwardMeters,
      },
      normal,
      localSideMeters,
      localForwardMeters,
      yMeters:
        kind === "rebar-piece"
          ? size.widthMeters * 0.5 + uphillJitter
          : size.heightMeters * 0.5 + random() * 0.06,
      widthMeters: size.widthMeters,
      heightMeters: size.heightMeters,
      depthMeters: size.depthMeters,
      rotationXRad: (random() - 0.5) * Math.PI * 0.82,
      rotationYRad:
        Math.atan2(normal.x, normal.z) +
        (random() - 0.5) * Math.PI * (kind === "rebar-piece" ? 0.62 : 1.88),
      rotationZRad: (random() - 0.5) * Math.PI * 1.05,
      opacity: kind === "dust-mound" ? 0.58 + random() * 0.18 : 1,
      severity,
      createdAtSeconds: event.occurredAtSeconds,
      seed: hashString(`${seed}:${index}:${kind}`),
    };
  });
}

export function limitHomeDriveBuildingRubblePieces(
  rubble: readonly HomeDriveBuildingRubblePiece[],
  options: HomeDriveBuildingRubbleCreationOptions = {},
): readonly HomeDriveBuildingRubblePiece[] {
  const maxPerBuilding =
    options.maxRubblePiecesPerBuilding ?? DEFAULT_MAX_PIECES_PER_BUILDING;
  const maxTotal = options.maxRubblePiecesTotal ?? DEFAULT_MAX_PIECES_TOTAL;

  const byBuilding = new Map<string, HomeDriveBuildingRubblePiece[]>();

  rubble.forEach((piece) => {
    const current = byBuilding.get(piece.buildingId);

    if (current) {
      current.push(piece);
      return;
    }

    byBuilding.set(piece.buildingId, [piece]);
  });

  const limitedByBuilding = Array.from(byBuilding.values()).flatMap((pieces) => {
    if (pieces.length <= maxPerBuilding) {
      return pieces;
    }

    return [...pieces]
      .sort((first, second) => second.createdAtSeconds - first.createdAtSeconds)
      .slice(0, maxPerBuilding);
  });

  if (limitedByBuilding.length <= maxTotal) {
    return limitedByBuilding;
  }

  return [...limitedByBuilding]
    .sort((first, second) => second.createdAtSeconds - first.createdAtSeconds)
    .slice(0, maxTotal);
}
