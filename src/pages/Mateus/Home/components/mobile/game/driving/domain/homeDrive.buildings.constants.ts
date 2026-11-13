// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.constants.ts

import type { HomeDriveVector2 } from "./homeDrive.types";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingSide,
} from "./homeDrive.building.types";

export const DEFAULT_MAX_BUILDINGS = 16384;
export const DEFAULT_MIN_SEGMENT_LENGTH_METERS = 42;

/**
 * Multiplicador real de slots por rua.
 *
 * Como a geração tenta os dois lados da rua:
 * 4 slots * 2 lados = até 8x mais tentativas de prédios.
 */
export const BUILDING_SLOT_DENSITY_MULTIPLIER = 4;

/**
 * Aumenta a chance de cada slot virar prédio.
 */
export const BUILDING_DEVELOPMENT_CHANCE_MULTIPLIER = 1.24;

/**
 * Clearance real entre footprints.
 * Este valor é mais importante que o multiplicador antigo de distância circular.
 */
export const BUILDING_FOOTPRINT_CLEARANCE_METERS = 3.2;

/**
 * No mesmo segmento e mesmo lado, pode ficar mais compacto,
 * mas ainda sem interpenetrar.
 */
export const BUILDING_SAME_STREET_SIDE_CLEARANCE_METERS = 1.65;

/**
 * Se estiver em lados opostos da mesma rua, não precisa bloquear tanto,
 * porque a via/calçada já separa os footprints.
 */
export const BUILDING_OPPOSITE_SIDE_CLEARANCE_METERS = 1.25;

export const LOT_ENDPOINT_PADDING_RATIO = 0.08;
export const LOT_POSITION_JITTER_RATIO = 0.28;

/**
 * Gap visual inicial entre o fim externo da calçada e a fachada.
 *
 * A ideia é nascer praticamente colado na calçada, mas sem forçar
 * interseção com o filtro de exclusão de rua.
 */
export const LOT_FRONT_GAP_TO_SIDEWALK_METERS = 0.18;

/**
 * Fallbacks progressivos.
 *
 * Antes, quando a posição colada batia no filtro de colisão,
 * o prédio era removido com `return null`.
 *
 * Agora:
 * - tenta colado primeiro;
 * - se bloquear, afasta pouco;
 * - só remove se todos os offsets falharem.
 */
export const LOT_FRONT_GAP_FALLBACKS_METERS: readonly number[] = Object.freeze([
  0.18,
  0.35,
  0.55,
  0.8,
  1.15,
  1.6,
  2.25,
  3.1,
  4.25,
  5.8,
  7.6,
]);

/**
 * Não usar variação lateral randômica para empurrar prédio para longe da calçada.
 */
export const LOT_SIDE_OFFSET_RANDOM_METERS = 0;

export const BUILDING_ROAD_COLLISION_SAMPLE_RADIUS_METERS = 0.58;

/**
 * Índice espacial para evitar O(n²) pesado quando a cidade passa de milhares de prédios.
 */
export const BUILDING_SPATIAL_GRID_CELL_METERS = 64;
export const BUILDING_SPATIAL_SEARCH_RADIUS_CELLS = 2;

export type BuildingSpatialIndex = Map<string, HomeDriveBuilding[]>;

export type BuildingFootprint = Readonly<{
  position: HomeDriveVector2;
  widthMeters: number;
  depthMeters: number;
  rotationYRad: number;
  segmentId: string;
  side: HomeDriveBuildingSide;
}>;

export type BuildingAxis = Readonly<{
  x: number;
  z: number;
}>;
