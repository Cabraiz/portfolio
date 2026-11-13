// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionImpact.marks.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionMark,
  HomeDriveBuildingCollisionMarkKind,
} from "./homeDrive.buildingCollision.types";

export type HomeDriveBuildingCollisionMarkCreationOptions = Readonly<{
  maxMarks?: number;

  /**
   * Legado: mantido como alias para maxDestructions.
   */
  maxDeformations?: number;

  /**
   * Legados do sistema antigo de deformation/debris.
   * Mantidos só para compatibilidade com chamadas antigas.
   */
  maxChunksPerImpact?: number;
  maxRebarsPerImpact?: number;
  maxDebrisPiecesPerImpact?: number;
  deformationLifetimeSeconds?: number;

  maxDestructions?: number;
  maxDestructionZonesPerBuilding?: number;
  destructionMergeDistanceMeters?: number;
  destructionBuildingCenter?: HomeDriveVector2;
  destructionLocalXMeters?: number;
  destructionLocalYMeters?: number;

  maxRubblePiecesPerImpact?: number;
  maxRubblePiecesPerBuilding?: number;
  maxRubblePiecesTotal?: number;
  rubbleIntensity?: number;

  buildingLeanIntensity?: number;
  maxBuildingLeanRad?: number;
  basePivotYOffsetMeters?: number;

  crackLifetimeSeconds?: number;
  dustLifetimeSeconds?: number;
  comicLifetimeSeconds?: number;
  heavyDamageLifetimeSeconds?: number;
}>;

export const DEFAULT_MAX_MARKS = 132;
const DEFAULT_CRACK_LIFETIME_SECONDS = 12;
const DEFAULT_HEAVY_DAMAGE_LIFETIME_SECONDS = 18;
const DEFAULT_DUST_LIFETIME_SECONDS = 1.35;
const DEFAULT_COMIC_LIFETIME_SECONDS = 1.15;

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

function getRotationYFromNormal(
  normal: Readonly<{ x: number; z: number }>,
): number {
  return Math.atan2(normal.x, normal.z);
}

function getMarkLifetimeSeconds(
  kind: HomeDriveBuildingCollisionMarkKind,
  options: HomeDriveBuildingCollisionMarkCreationOptions,
): number {
  switch (kind) {
    case "dust":
      return options.dustLifetimeSeconds ?? DEFAULT_DUST_LIFETIME_SECONDS;

    case "comic-burst":
      return options.comicLifetimeSeconds ?? DEFAULT_COMIC_LIFETIME_SECONDS;

    case "concrete-hole":
    case "impact-stain":
    case "paint-transfer":
    case "broken-plaster":
      return (
        options.heavyDamageLifetimeSeconds ??
        DEFAULT_HEAVY_DAMAGE_LIFETIME_SECONDS
      );

    case "bent-sign":
    case "scratch":
    case "crack":
    default:
      return options.crackLifetimeSeconds ?? DEFAULT_CRACK_LIFETIME_SECONDS;
  }
}

function getMarkSizeMeters(
  event: HomeDriveBuildingCollisionEvent,
  kind: HomeDriveBuildingCollisionMarkKind,
): Readonly<{ widthMeters: number; heightMeters: number }> {
  const severity = clamp(event.severity, 0, 1);

  switch (kind) {
    case "dust":
      return {
        widthMeters: 3.2 + severity * 5.6,
        heightMeters: 1.7 + severity * 2.8,
      };

    case "impact-stain":
      return {
        widthMeters: 2.4 + severity * 4.8,
        heightMeters: 1.6 + severity * 3.6,
      };

    case "concrete-hole":
      return {
        widthMeters: 1.2 + severity * 2.4,
        heightMeters: 0.9 + severity * 1.8,
      };

    case "paint-transfer":
      return {
        widthMeters: 2.1 + severity * 3.7,
        heightMeters: 0.42 + severity * 0.86,
      };

    case "broken-plaster":
      return {
        widthMeters: 2.2 + severity * 4.4,
        heightMeters: 1.5 + severity * 3.2,
      };

    case "comic-burst":
      return {
        widthMeters: 2.8 + severity * 2.4,
        heightMeters: 1.1 + severity * 0.9,
      };

    case "bent-sign":
      return {
        widthMeters: 2.5 + severity * 1.2,
        heightMeters: 0.72 + severity * 0.36,
      };

    case "scratch":
      return {
        widthMeters: 2.4 + severity * 3.2,
        heightMeters: 0.5 + severity * 0.7,
      };

    case "crack":
    default:
      return {
        widthMeters: 1.9 + severity * 3.8,
        heightMeters: 1.5 + severity * 3.1,
      };
  }
}

export function createMark(params: Readonly<{
  event: HomeDriveBuildingCollisionEvent;
  kind: HomeDriveBuildingCollisionMarkKind;
  id: string;
  nowSeconds: number;
  options: HomeDriveBuildingCollisionMarkCreationOptions;
  yOffsetMeters?: number;
  opacity?: number;
}>): HomeDriveBuildingCollisionMark {
  const size = getMarkSizeMeters(params.event, params.kind);
  const lifetimeSeconds = getMarkLifetimeSeconds(params.kind, params.options);

  return {
    id: params.id,
    buildingId: params.event.buildingId,
    kind: params.kind,
    message:
      params.kind === "comic-burst" || params.kind === "bent-sign"
        ? params.event.message
        : undefined,
    position: params.event.position,
    normal: params.event.normal,
    rotationYRad: getRotationYFromNormal(params.event.normal),
    yMeters: params.event.contactYMeters + (params.yOffsetMeters ?? 0),
    widthMeters: size.widthMeters,
    heightMeters: size.heightMeters,
    opacity: params.opacity ?? 1,
    severity: params.event.severity,
    createdAtSeconds: params.nowSeconds,
    expiresAtSeconds: params.nowSeconds + lifetimeSeconds,
    seed: hashString(
      `${params.event.buildingId}:${params.kind}:${params.event.occurredAtSeconds}`,
    ),
  };
}

export function getKindsForEvent(
  event: HomeDriveBuildingCollisionEvent,
): readonly HomeDriveBuildingCollisionMarkKind[] {
  /*
    O buraco volumétrico agora é responsabilidade de `destructions`.
    Aqui ficam apenas marcas auxiliares leves; nada de concrete-hole,
    broken-plaster ou overlay pesado competindo com o mesh quebrado.
  */
  if (event.severity >= 0.74) {
    return ["dust", "crack", "scratch", "paint-transfer", "bent-sign"];
  }

  if (event.severity >= 0.38) {
    return ["dust", "crack", "scratch", "paint-transfer"];
  }

  return ["dust", "scratch"];
}

function sortMarksByCreatedAt(
  marks: readonly HomeDriveBuildingCollisionMark[],
): readonly HomeDriveBuildingCollisionMark[] {
  return [...marks].sort((first, second) => {
    if (first.expiresAtSeconds !== second.expiresAtSeconds) {
      return first.expiresAtSeconds - second.expiresAtSeconds;
    }

    return first.createdAtSeconds - second.createdAtSeconds;
  });
}

export function limitMarks(
  marks: readonly HomeDriveBuildingCollisionMark[],
  maxMarks: number,
): readonly HomeDriveBuildingCollisionMark[] {
  if (marks.length <= maxMarks) {
    return marks;
  }

  return sortMarksByCreatedAt(marks).slice(-maxMarks);
}

export function getMarkYOffsetMeters(
  kind: HomeDriveBuildingCollisionMarkKind,
  severity: number,
): number {
  switch (kind) {
    case "comic-burst":
      return 1.75 + severity * 0.7;

    case "dust":
      return -0.42;

    case "bent-sign":
      return 0.85;

    case "paint-transfer":
      return -0.18;

    case "concrete-hole":
      return 0;

    case "impact-stain":
      return -0.02;

    case "broken-plaster":
      return 0.08;

    case "crack":
    case "scratch":
    default:
      return 0;
  }
}

export function getInitialMarkOpacity(
  kind: HomeDriveBuildingCollisionMarkKind,
  severity: number,
): number {
  switch (kind) {
    case "dust":
      return 0.82;

    case "impact-stain":
      return 0.86 + severity * 0.12;

    case "concrete-hole":
      return 0.92 + severity * 0.08;

    case "broken-plaster":
      return 0.8 + severity * 0.16;

    case "paint-transfer":
      return 0.76 + severity * 0.16;

    default:
      return 1;
  }
}

export function resolveMaxDestructions(
  options: Readonly<{
    maxDestructions?: number;
    maxDeformations?: number;
  }>,
): number | undefined {
  return options.maxDestructions ?? options.maxDeformations;
}
