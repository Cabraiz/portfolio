// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionRubble.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingRubbleCreationOptions,
  HomeDriveBuildingRubblePiece,
  HomeDriveBuildingRubblePieceKind,
} from "./homeDrive.buildingCollisionRubble.types";

const DEFAULT_RUBBLE_INTENSITY = 1;
const DEFAULT_MIN_PIECES_PER_IMPACT = 10;
const DEFAULT_MAX_PIECES_PER_IMPACT = 78;
const DEFAULT_MAX_PIECES_PER_BUILDING = 260;
const DEFAULT_MAX_PIECES_TOTAL = 1400;

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
  if (severity >= 0.72 && index % 11 === 0) {
    return "rebar-piece";
  }

  if (severity >= 0.64 && randomValue > 0.82) {
    return "concrete-boulder";
  }

  if (randomValue > 0.68) {
    return "broken-slab";
  }

  if (randomValue > 0.42) {
    return "concrete-rock";
  }

  if (randomValue > 0.18) {
    return "small-stone";
  }

  if (randomValue > 0.08) {
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
        widthMeters: 0.46 + params.random() * (0.5 + severity * 0.72),
        heightMeters: 0.26 + params.random() * (0.3 + severity * 0.42),
        depthMeters: 0.42 + params.random() * (0.42 + severity * 0.62),
      };

    case "broken-slab":
      return {
        widthMeters: 0.62 + params.random() * (0.72 + severity * 0.86),
        heightMeters: 0.08 + params.random() * (0.11 + severity * 0.08),
        depthMeters: 0.34 + params.random() * (0.34 + severity * 0.36),
      };

    case "concrete-rock":
      return {
        widthMeters: 0.24 + params.random() * (0.32 + severity * 0.38),
        heightMeters: 0.16 + params.random() * (0.16 + severity * 0.2),
        depthMeters: 0.22 + params.random() * (0.3 + severity * 0.35),
      };

    case "small-stone":
      return {
        widthMeters: 0.08 + params.random() * 0.2,
        heightMeters: 0.05 + params.random() * 0.13,
        depthMeters: 0.08 + params.random() * 0.18,
      };

    case "plaster-shard":
      return {
        widthMeters: 0.18 + params.random() * 0.32,
        heightMeters: 0.025 + params.random() * 0.055,
        depthMeters: 0.12 + params.random() * 0.24,
      };

    case "rebar-piece":
      return {
        widthMeters: 0.035 + params.random() * 0.018,
        heightMeters: 0.035 + params.random() * 0.018,
        depthMeters: 0.72 + params.random() * (0.84 + severity * 0.86),
      };

    case "dust-mound":
    default:
      return {
        widthMeters: 0.22 + params.random() * 0.46,
        heightMeters: 0.022 + params.random() * 0.045,
        depthMeters: 0.18 + params.random() * 0.42,
      };
  }
}

function getRubblePieceCount(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingRubbleCreationOptions,
): number {
  const severity = clamp(event.severity, 0, 1);
  const intensity = clamp(options.rubbleIntensity ?? DEFAULT_RUBBLE_INTENSITY, 0, 3);
  const minPieces = Math.max(0, options.minRubblePiecesPerImpact ?? DEFAULT_MIN_PIECES_PER_IMPACT);
  const maxPieces = Math.max(
    minPieces,
    options.maxRubblePiecesPerImpact ?? DEFAULT_MAX_PIECES_PER_IMPACT,
  );

  return Math.round(
    clamp(
      (minPieces + severity * 46 + clamp(event.impulse / 32, 0, 1) * 22) *
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
  const impactSpread = 1.1 + severity * 4.2;
  const forwardSpread = 0.72 + severity * 5.6 + clamp(event.relativeSpeedMps / 18, 0, 1) * 2.2;

  return Array.from({ length: count }, (_, index): HomeDriveBuildingRubblePiece => {
    const kind = pickRubbleKind(random(), severity, index);
    const size = getRubbleSize({ kind, severity, random });
    const sideSign = random() > 0.5 ? 1 : -1;
    const sideMagnitude = Math.pow(random(), 0.58) * impactSpread;
    const localSideMeters = sideSign * sideMagnitude * (0.12 + random() * 0.88);
    const localForwardMeters =
      0.35 + Math.pow(random(), 0.47) * forwardSpread * (kind === "dust-mound" ? 0.7 : 1);
    const uphillJitter = kind === "rebar-piece" ? 0.18 + random() * 0.44 : random() * 0.16;

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
          : size.heightMeters * 0.5 + random() * 0.055,
      widthMeters: size.widthMeters,
      heightMeters: size.heightMeters,
      depthMeters: size.depthMeters,
      rotationXRad: (random() - 0.5) * Math.PI * 0.72,
      rotationYRad:
        Math.atan2(normal.x, normal.z) +
        (random() - 0.5) * Math.PI * (kind === "rebar-piece" ? 0.58 : 1.75),
      rotationZRad: (random() - 0.5) * Math.PI * 0.9,
      opacity: kind === "dust-mound" ? 0.58 + random() * 0.16 : 1,
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
