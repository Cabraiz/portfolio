// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionImpact.ts

import {
  tickHomeDriveBuildingCollisionDeformations,
} from "./homeDrive.buildingCollisionDeformation";
import {
  addHomeDriveBuildingCollisionDestructionToList,
  tickHomeDriveBuildingCollisionDestructions,
} from "./homeDrive.buildingCollisionDestruction";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionMark,
  HomeDriveBuildingCollisionMarkKind,
  HomeDriveBuildingCollisionRuntimeState,
} from "./homeDrive.buildingCollision.types";

export type HomeDriveBuildingCollisionImpactTickOptions = Readonly<{
  maxMarks?: number;
  maxDeformations?: number;
  maxDestructions?: number;
}>;

export type HomeDriveBuildingCollisionMarkCreationOptions = Readonly<{
  maxMarks?: number;
  maxDeformations?: number;
  maxChunksPerImpact?: number;
  maxRebarsPerImpact?: number;
  maxDebrisPiecesPerImpact?: number;
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
  deformationLifetimeSeconds?: number;
}>;

const DEFAULT_MAX_MARKS = 132;
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

function createMark(params: Readonly<{
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

function getKindsForEvent(
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

function limitMarks(
  marks: readonly HomeDriveBuildingCollisionMark[],
  maxMarks: number,
): readonly HomeDriveBuildingCollisionMark[] {
  if (marks.length <= maxMarks) {
    return marks;
  }

  return sortMarksByCreatedAt(marks).slice(-maxMarks);
}

function getMarkYOffsetMeters(
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

function getInitialMarkOpacity(
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

export function createInitialHomeDriveBuildingCollisionState(): HomeDriveBuildingCollisionRuntimeState {
  return {
    serial: 0,
    marks: [],
    deformations: [],
    destructions: [],
    lastCollisionAtByBuildingId: {},
  };
}

export function tickHomeDriveBuildingCollisionState(
  state: HomeDriveBuildingCollisionRuntimeState,
  nowSeconds: number,
  options: HomeDriveBuildingCollisionImpactTickOptions = {},
): HomeDriveBuildingCollisionRuntimeState {
  const maxMarks = options.maxMarks ?? DEFAULT_MAX_MARKS;

  /*
    Não atualizamos opacity em todo tick. Isso evita recriar objetos/arrays
    continuamente enquanto o carro anda e reduz o risco de loops React #185
    nos componentes que leem marks dentro do Canvas.
  */
  const marks = state.marks.filter((mark) => mark.expiresAtSeconds > nowSeconds);

  const deformations = tickHomeDriveBuildingCollisionDeformations(
    state.deformations,
    nowSeconds,
    {
      maxDeformations: options.maxDeformations,
    },
  );

  const destructions = tickHomeDriveBuildingCollisionDestructions(
    state.destructions ?? [],
    nowSeconds,
    {
      maxDestructions: options.maxDestructions ?? options.maxDeformations,
    },
  );

  if (
    marks.length === state.marks.length &&
    deformations.length === state.deformations.length &&
    destructions.length === (state.destructions ?? []).length &&
    marks.every((mark, index) => mark === state.marks[index]) &&
    deformations.every(
      (deformation, index) => deformation === state.deformations[index],
    ) &&
    destructions.every(
      (destruction, index) => destruction === (state.destructions ?? [])[index],
    )
  ) {
    return state;
  }

  return {
    ...state,
    marks: limitMarks(marks, maxMarks),
    deformations,
    destructions,
  };
}

export function addHomeDriveBuildingCollisionEventToState(
  state: HomeDriveBuildingCollisionRuntimeState,
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingCollisionMarkCreationOptions = {},
): HomeDriveBuildingCollisionRuntimeState {
  const maxMarks = options.maxMarks ?? DEFAULT_MAX_MARKS;
  const nowSeconds = event.occurredAtSeconds;
  const nextSerialBase = state.serial + 1;
  const kinds = getKindsForEvent(event);

  const nextMarks = kinds.map((kind, index) => {
    return createMark({
      event,
      kind,
      id: `${event.buildingId}:${nextSerialBase}:${kind}:${index}`,
      nowSeconds,
      options,
      yOffsetMeters: getMarkYOffsetMeters(kind, event.severity),
      opacity: getInitialMarkOpacity(kind, event.severity),
    });
  });

  /*
    Não geramos mais o dano pesado por `deformations`, porque aquilo era
    renderizado como planes/chunks/debris sobre o prédio intacto. Para criar
    buraco real, mantemos `deformations` como legado e alimentamos `destructions`.
  */
  const nextDeformations = state.deformations;

  const nextDestructions = addHomeDriveBuildingCollisionDestructionToList(
    state.destructions ?? [],
    event,
    {
      maxDestructions: options.maxDestructions ?? options.maxDeformations,
      maxZonesPerBuilding: options.maxDestructionZonesPerBuilding,
      mergeDistanceMeters: options.destructionMergeDistanceMeters,
      buildingCenter: options.destructionBuildingCenter,
      localXMeters: options.destructionLocalXMeters,
      localYMeters: options.destructionLocalYMeters,

      maxRubblePiecesPerImpact: options.maxRubblePiecesPerImpact,
      maxRubblePiecesPerBuilding: options.maxRubblePiecesPerBuilding,
      maxRubblePiecesTotal: options.maxRubblePiecesTotal,
      rubbleIntensity: options.rubbleIntensity,

      buildingLeanIntensity: options.buildingLeanIntensity,
      maxBuildingLeanRad: options.maxBuildingLeanRad,
      basePivotYOffsetMeters: options.basePivotYOffsetMeters,
    },
  );

  return {
    serial: nextSerialBase + kinds.length + 1,
    lastCollisionAtByBuildingId: {
      ...state.lastCollisionAtByBuildingId,
      [event.buildingId]: event.occurredAtSeconds,
    },
    marks: limitMarks([...state.marks, ...nextMarks], maxMarks),
    deformations: nextDeformations,
    destructions: nextDestructions,
  };
}
