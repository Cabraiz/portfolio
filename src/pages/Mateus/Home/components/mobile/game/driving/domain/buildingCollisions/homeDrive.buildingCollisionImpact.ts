// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionImpact.ts

import {
  addHomeDriveBuildingCollisionDestructionToList,
  tickHomeDriveBuildingCollisionDestructions,
} from "./homeDrive.buildingCollisionDestruction";

import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionRuntimeState,
} from "./homeDrive.buildingCollision.types";
import {
  DEFAULT_MAX_MARKS,
  resolveMaxDestructions,
  limitMarks,
  getKindsForEvent,
  createMark,
  getMarkYOffsetMeters,
  getInitialMarkOpacity,
} from "./homeDrive.buildingCollisionImpact.marks";
import type {
  HomeDriveBuildingCollisionMarkCreationOptions,
} from "./homeDrive.buildingCollisionImpact.marks";

export type {
  HomeDriveBuildingCollisionMarkCreationOptions,
} from "./homeDrive.buildingCollisionImpact.marks";

export type HomeDriveBuildingCollisionImpactTickOptions = Readonly<{
  maxMarks?: number;

  /**
   * Legado: mantido como alias para maxDestructions para não quebrar chamadas antigas.
   * O sistema novo não usa mais collisionDeformation.
   */
  maxDeformations?: number;

  maxDestructions?: number;
}>;

export function createInitialHomeDriveBuildingCollisionState(): HomeDriveBuildingCollisionRuntimeState {
  return {
    serial: 0,
    marks: [],

    /*
      Campo legado: fica vazio para compatibilidade com o runtime antigo.
      Não existe mais criação nem tick de collisionDeformation.
    */
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

  /*
    Deformations foi removido. Mantemos o array como estava para não quebrar
    o shape do estado enquanto o restante do código ainda tiver esse campo.
  */
  const deformations = state.deformations;

  const destructions = tickHomeDriveBuildingCollisionDestructions(
    state.destructions ?? [],
    nowSeconds,
    {
      maxDestructions: resolveMaxDestructions(options),
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
    Dano pesado agora é 100% por `destructions`:
    - prédio original some do instanced batch;
    - prédio substituto renderiza buraco volumétrico;
    - rubble persistente sai da própria destruction.
  */
  const nextDeformations = state.deformations;

  const nextDestructions = addHomeDriveBuildingCollisionDestructionToList(
    state.destructions ?? [],
    event,
    {
      maxDestructions: resolveMaxDestructions(options),
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
