// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCrowdTuning.ts

import type { HomeDrivePedestrianGroupKind } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianRoadKindCrowdTuning = Readonly<{
  densityCap: number;
  targetSpacingMeters: number;
  maxGroupsPerZone: number;
  priorityBoost: number;

  /**
   * Multiplica a penalização de grupos com 2 membros em áreas densas.
   *
   * Valores menores preservam casais/famílias em áreas comerciais/turísticas.
   * Valores maiores deixam a calçada mais leve, priorizando pessoas solo.
   */
  pairedGroupPenalty: number;
}>;

export type HomeDrivePedestrianGroupKindWeightMultiplierMap = Readonly<
  Record<HomeDrivePedestrianGroupKind, number>
>;

export type HomeDrivePedestrianCrowdTuning = Readonly<{
  /**
   * Penalização global para grupos com 2 membros quando a célula/calçada está densa.
   * Usado por `homeDrive.pedestrianGroups.ts`.
   */
  groupKindPairPenaltyWhenDense: number;

  /**
   * Boost global para grupos solo quando a célula/calçada está densa.
   * Usado por `homeDrive.pedestrianGroups.ts`.
   */
  groupKindSoloBiasWhenDense: number;

  generation: Readonly<{
    defaultDensity: number;
    densityMin: number;
    densityMax: number;
    maxAcceptedSlotMultiplier: number;

    occupancyCellSizeMeters: number;
    maxGroupsPerCell: number;
    maxGroupsPerCellOnMainRoad: number;

    minGroupDistanceMeters: number;
    minGroupDistanceBusyMeters: number;
    minProgressGapMeters: number;
    lateralLaneCount: number;

    defaultRoadKind: HomeDrivePedestrianRoadKindCrowdTuning;
    roadKind: Readonly<Record<string, HomeDrivePedestrianRoadKindCrowdTuning>>;

    lowDensityGroupKindMultipliers: HomeDrivePedestrianGroupKindWeightMultiplierMap;
    highDensityGroupKindMultipliers: HomeDrivePedestrianGroupKindWeightMultiplierMap;
  }>;

  corner: Readonly<{
    hardExclusionMeters: number;
    softExclusionMeters: number;
    cornerCellSizeMeters: number;
    maxCornerSlotRatio: number;
    maxCornerGroupsPerCell: number;
    maxCornerGroupsPerZoneEnd: number;
    cornerPriorityMultiplier: number;
    middlePriorityMultiplier: number;
    crosswalkWaitAllowanceRatio: number;
  }>;

  spawnFocus: Readonly<{
    defaultRadiusMeters: number;
    minRadiusMeters: number;
    defaultPedestrianRatio: number;
    maxPedestriansPortrait: number;
    maxPedestriansLandscape: number;
    priorityBoost: number;
    nearZoneDistanceMultiplier: number;
    nearSlotProgressPaddingMeters: number;
  }>;

  visibility: Readonly<{
    cellSizeMeters: number;
    maxFullDetailPerCell: number;
    maxMediumDetailPerCell: number;
    maxProxyDetailPerCell: number;
    maxCornerEntriesPerCell: number;
    maxFallbackFillRatio: number;
    angularSectorCount: number;
    minSectorFillRatio: number;
  }>;

  lod: Readonly<{
    fullDetailRadiusMinMeters: number;
    mediumDetailRadiusMinMeters: number;
    proxyFadeStartMultiplier: number;
  }>;
}>;

export const HOME_DRIVE_PEDESTRIAN_CROWD_TUNING: HomeDrivePedestrianCrowdTuning =
  Object.freeze({
    groupKindPairPenaltyWhenDense: 0.72,
    groupKindSoloBiasWhenDense: 0.42,

    generation: Object.freeze({
      defaultDensity: 4.8,
      densityMin: 0,
      densityMax: 7.25,
      maxAcceptedSlotMultiplier: 1.18,

      occupancyCellSizeMeters: 18,
      maxGroupsPerCell: 6,
      maxGroupsPerCellOnMainRoad: 8,

      minGroupDistanceMeters: 5.4,
      minGroupDistanceBusyMeters: 4.2,
      minProgressGapMeters: 7.2,
      lateralLaneCount: 3,

      defaultRoadKind: Object.freeze({
        densityCap: 2.55,
        targetSpacingMeters: 14,
        maxGroupsPerZone: 28,
        priorityBoost: 12,
        pairedGroupPenalty: 1,
      }),

      roadKind: Object.freeze({
        commercial: Object.freeze({
          densityCap: 4.4,
          targetSpacingMeters: 7.2,
          maxGroupsPerZone: 64,
          priorityBoost: 86,
          pairedGroupPenalty: 0.78,
        }),
        coastal: Object.freeze({
          densityCap: 3.85,
          targetSpacingMeters: 8.2,
          maxGroupsPerZone: 58,
          priorityBoost: 72,
          pairedGroupPenalty: 0.68,
        }),
        avenue: Object.freeze({
          densityCap: 3.55,
          targetSpacingMeters: 8.9,
          maxGroupsPerZone: 52,
          priorityBoost: 58,
          pairedGroupPenalty: 0.92,
        }),
        street: Object.freeze({
          densityCap: 2.75,
          targetSpacingMeters: 11.5,
          maxGroupsPerZone: 34,
          priorityBoost: 34,
          pairedGroupPenalty: 1,
        }),
        ring: Object.freeze({
          densityCap: 1.45,
          targetSpacingMeters: 17.5,
          maxGroupsPerZone: 18,
          priorityBoost: 14,
          pairedGroupPenalty: 1.14,
        }),
        service: Object.freeze({
          densityCap: 0.95,
          targetSpacingMeters: 22,
          maxGroupsPerZone: 10,
          priorityBoost: 5,
          pairedGroupPenalty: 1.24,
        }),
      }),

      lowDensityGroupKindMultipliers: Object.freeze({
        solo: 1,
        shopper: 1,
        smoker: 1,
        couple: 0.82,
        "adult-child": 0.78,
        "chat-pair": 0.74,
        worker: 1,
      }),

      highDensityGroupKindMultipliers: Object.freeze({
        solo: 1.46,
        shopper: 1.08,
        smoker: 0.55,
        couple: 0.26,
        "adult-child": 0.22,
        "chat-pair": 0.2,
        worker: 1.12,
      }),
    }),

    corner: Object.freeze({
      hardExclusionMeters: 16,
      softExclusionMeters: 31,
      cornerCellSizeMeters: 22,
      maxCornerSlotRatio: 0.14,
      maxCornerGroupsPerCell: 3,
      maxCornerGroupsPerZoneEnd: 2,
      cornerPriorityMultiplier: 0.22,
      middlePriorityMultiplier: 1,
      crosswalkWaitAllowanceRatio: 0.18,
    }),

    spawnFocus: Object.freeze({
      defaultRadiusMeters: 220,
      minRadiusMeters: 80,
      defaultPedestrianRatio: 0.34,
      maxPedestriansPortrait: 520,
      maxPedestriansLandscape: 780,
      priorityBoost: 260,
      nearZoneDistanceMultiplier: 0.48,
      nearSlotProgressPaddingMeters: 34,
    }),

    visibility: Object.freeze({
      cellSizeMeters: 22,
      maxFullDetailPerCell: 7,
      maxMediumDetailPerCell: 4,
      maxProxyDetailPerCell: 2,
      maxCornerEntriesPerCell: 3,
      maxFallbackFillRatio: 0.16,
      angularSectorCount: 12,
      minSectorFillRatio: 0.28,
    }),

    lod: Object.freeze({
      fullDetailRadiusMinMeters: 24,
      mediumDetailRadiusMinMeters: 52,
      proxyFadeStartMultiplier: 1.15,
    }),
  });

export function clampHomeDrivePedestrianCrowdDensity(value: number): number {
  if (!Number.isFinite(value)) {
    return HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.defaultDensity;
  }

  return Math.max(
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.densityMin,
    Math.min(HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.densityMax, value),
  );
}

export function getHomeDrivePedestrianRoadKindCrowdTuning(
  roadKind: string,
): HomeDrivePedestrianRoadKindCrowdTuning {
  return (
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.roadKind[roadKind] ??
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.defaultRoadKind
  );
}

/**
 * Alias retrocompatível.
 *
 * Mantém funcionando qualquer arquivo antigo que ainda importe:
 * `getHomeDrivePedestrianRoadKindTuning`.
 */
export function getHomeDrivePedestrianRoadKindTuning(
  roadKind: string,
): HomeDrivePedestrianRoadKindCrowdTuning {
  return getHomeDrivePedestrianRoadKindCrowdTuning(roadKind);
}

export function getHomeDrivePedestrianTargetSpacingMeters(
  roadKind: string,
): number {
  return getHomeDrivePedestrianRoadKindCrowdTuning(roadKind).targetSpacingMeters;
}

export function getHomeDrivePedestrianRoadDensityCap(roadKind: string): number {
  return getHomeDrivePedestrianRoadKindCrowdTuning(roadKind).densityCap;
}

export function getHomeDrivePedestrianMaxGroupsPerZone(roadKind: string): number {
  return getHomeDrivePedestrianRoadKindCrowdTuning(roadKind).maxGroupsPerZone;
}

export function getHomeDrivePedestrianGroupKindMultipliers(
  density: number,
): HomeDrivePedestrianGroupKindWeightMultiplierMap {
  const normalizedDensity = clampHomeDrivePedestrianCrowdDensity(density);
  const highDensityThreshold =
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.densityMax * 0.5;

  return normalizedDensity >= highDensityThreshold
    ? HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.highDensityGroupKindMultipliers
    : HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.lowDensityGroupKindMultipliers;
}

export function getHomeDrivePedestrianGenerationCellKey(
  position: Readonly<{ x: number; z: number }>,
  cellSizeMeters =
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.occupancyCellSizeMeters,
): string {
  const safeCellSizeMeters = Math.max(1, cellSizeMeters);

  return `${Math.floor(position.x / safeCellSizeMeters)}:${Math.floor(
    position.z / safeCellSizeMeters,
  )}`;
}

export function getHomeDrivePedestrianNeighborCellKeys(
  cellKey: string,
): readonly string[] {
  const [rawX, rawZ] = cellKey.split(":");
  const centerX = Number.parseInt(rawX, 10);
  const centerZ = Number.parseInt(rawZ, 10);

  if (!Number.isFinite(centerX) || !Number.isFinite(centerZ)) {
    return [cellKey];
  }

  const keys: string[] = [];

  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      keys.push(`${centerX + dx}:${centerZ + dz}`);
    }
  }

  return keys;
}

export function getHomeDrivePedestrianDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return (first.x - second.x) ** 2 + (first.z - second.z) ** 2;
}

export function getHomeDrivePedestrianDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.sqrt(getHomeDrivePedestrianDistanceSquared(first, second));
}
