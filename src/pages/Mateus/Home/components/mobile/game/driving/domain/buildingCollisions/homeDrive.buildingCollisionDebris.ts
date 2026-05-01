// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionDebris.ts

import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingDamageDebrisKind,
  HomeDriveBuildingDamageDebrisPiece,
} from "./homeDrive.buildingCollisionDeformation.types";

export type HomeDriveBuildingCollisionDebrisCreationOptions = Readonly<{
  maxPieces?: number;
}>;

/**
 * Entulho agora é detalhe secundário.
 * O visual principal da colisão fica na fachada deformada, não em explosão.
 */
const DEFAULT_MAX_DEBRIS_PIECES = 8;

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

function pickDebrisKind(
  randomValue: number,
  severity: number,
): HomeDriveBuildingDamageDebrisKind {
  if (severity >= 0.82 && randomValue > 0.84) {
    return "dark-concrete";
  }

  if (randomValue > 0.62) {
    return "concrete";
  }

  if (randomValue > 0.28) {
    return "plaster";
  }

  return "dust-clump";
}

function getDebrisPieceSize(params: Readonly<{
  kind: HomeDriveBuildingDamageDebrisKind;
  severity: number;
  random: () => number;
}>): Readonly<{
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
}> {
  const severity = clamp(params.severity, 0, 1);

  switch (params.kind) {
    case "dark-concrete":
      return {
        widthMeters: 0.22 + params.random() * (0.22 + severity * 0.22),
        heightMeters: 0.1 + params.random() * (0.12 + severity * 0.14),
        depthMeters: 0.16 + params.random() * (0.18 + severity * 0.2),
      };

    case "concrete":
      return {
        widthMeters: 0.18 + params.random() * (0.2 + severity * 0.18),
        heightMeters: 0.08 + params.random() * (0.1 + severity * 0.12),
        depthMeters: 0.14 + params.random() * (0.16 + severity * 0.16),
      };

    case "plaster":
      return {
        widthMeters: 0.12 + params.random() * (0.16 + severity * 0.14),
        heightMeters: 0.04 + params.random() * (0.07 + severity * 0.08),
        depthMeters: 0.1 + params.random() * (0.12 + severity * 0.1),
      };

    case "dust-clump":
    default:
      return {
        widthMeters: 0.08 + params.random() * 0.12,
        heightMeters: 0.018 + params.random() * 0.04,
        depthMeters: 0.08 + params.random() * 0.12,
      };
  }
}

export function createHomeDriveBuildingCollisionDebrisPieces(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionDebrisCreationOptions = {},
): readonly HomeDriveBuildingDamageDebrisPiece[] {
  const severity = clamp(event.severity, 0, 1);
  const maxPieces = Math.max(0, options.maxPieces ?? DEFAULT_MAX_DEBRIS_PIECES);

  if (maxPieces <= 0 || severity < 0.22) {
    return [];
  }

  const count = Math.max(
    1,
    Math.min(
      maxPieces,
      Math.round(1 + severity * 5 + clamp(event.relativeSpeedMps / 18, 0, 1) * 2),
    ),
  );

  const seed = hashString(
    `${event.buildingId}:debris:${event.occurredAtSeconds}:${event.impulse}`,
  );
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    const spread = 0.34 + severity * 1.08;
    const forwardSpread = 0.28 + severity * 0.72;
    const randomKind = pickDebrisKind(random(), severity);
    const size = getDebrisPieceSize({
      kind: randomKind,
      severity,
      random,
    });

    const sideSign = random() > 0.5 ? 1 : -1;
    const localX =
      sideSign *
      Math.pow(random(), 0.78) *
      spread *
      (0.18 + random() * 0.82);
    const localForwardMeters =
      0.16 + Math.pow(random(), 0.7) * forwardSpread;
    const yMeters = size.heightMeters * 0.5 + random() * 0.035;

    return {
      id: `${event.buildingId}:debris:${event.occurredAtSeconds}:${index}`,
      kind: randomKind,
      localX,
      localForwardMeters,
      yMeters,
      widthMeters: size.widthMeters,
      heightMeters: size.heightMeters,
      depthMeters: size.depthMeters,
      rotationYRad: (random() - 0.5) * Math.PI * 1.12,
      rotationZRad: (random() - 0.5) * 0.48,
      opacity: randomKind === "dust-clump" ? 0.52 : 0.92,
      seed: hashString(`${seed}:${index}`),
    };
  });
}
