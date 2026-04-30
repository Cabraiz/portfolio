// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.ts

import {
  getHomeDriveCommerceDescriptor,
  getHomeDriveStableStringSeed,
  shouldHomeDriveBuildingHaveCommerceSign,
} from "./homeDrive.commerceNames";
import { hashVector } from "./homeDrive.math";
import { isHomeDrivePositionBlockedByRoad } from "./homeDrive.roadExclusion";
import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingGenerationOptions,
  HomeDriveBuildingKind,
  HomeDriveBuildingLotCandidate,
  HomeDriveBuildingMaterialKey,
  HomeDriveBuildingSide,
  HomeDriveBuildingWindowStyle,
} from "./homeDrive.building.types";

const DEFAULT_MAX_BUILDINGS = 16384;
const DEFAULT_MIN_SEGMENT_LENGTH_METERS = 42;

/**
 * Multiplicador real de slots por rua.
 *
 * Como a geração tenta os dois lados da rua:
 * 4 slots * 2 lados = até 8x mais tentativas de prédios.
 */
const BUILDING_SLOT_DENSITY_MULTIPLIER = 4;

/**
 * Aumenta a chance de cada slot virar prédio.
 */
const BUILDING_DEVELOPMENT_CHANCE_MULTIPLIER = 1.24;

/**
 * Clearance real entre footprints.
 * Este valor é mais importante que o multiplicador antigo de distância circular.
 */
const BUILDING_FOOTPRINT_CLEARANCE_METERS = 3.2;

/**
 * No mesmo segmento e mesmo lado, pode ficar mais compacto,
 * mas ainda sem interpenetrar.
 */
const BUILDING_SAME_STREET_SIDE_CLEARANCE_METERS = 1.65;

/**
 * Se estiver em lados opostos da mesma rua, não precisa bloquear tanto,
 * porque a via/calçada já separa os footprints.
 */
const BUILDING_OPPOSITE_SIDE_CLEARANCE_METERS = 1.25;

const LOT_ENDPOINT_PADDING_RATIO = 0.08;
const LOT_POSITION_JITTER_RATIO = 0.28;

/**
 * Gap visual inicial entre o fim externo da calçada e a fachada.
 *
 * A ideia é nascer praticamente colado na calçada, mas sem forçar
 * interseção com o filtro de exclusão de rua.
 */
const LOT_FRONT_GAP_TO_SIDEWALK_METERS = 0.18;

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
const LOT_FRONT_GAP_FALLBACKS_METERS: readonly number[] = Object.freeze([
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
const LOT_SIDE_OFFSET_RANDOM_METERS = 0;

const BUILDING_ROAD_COLLISION_SAMPLE_RADIUS_METERS = 0.58;

/**
 * Índice espacial para evitar O(n²) pesado quando a cidade passa de milhares de prédios.
 */
const BUILDING_SPATIAL_GRID_CELL_METERS = 64;
const BUILDING_SPATIAL_SEARCH_RADIUS_CELLS = 2;

type BuildingSpatialIndex = Map<string, HomeDriveBuilding[]>;

type BuildingFootprint = Readonly<{
  position: HomeDriveVector2;
  widthMeters: number;
  depthMeters: number;
  rotationYRad: number;
  segmentId: string;
  side: HomeDriveBuildingSide;
}>;

type BuildingAxis = Readonly<{
  x: number;
  z: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function smoothstep01(value: number): number {
  const x = clamp01(value);

  return x * x * (3 - 2 * x);
}

function dot(first: BuildingAxis, second: BuildingAxis): number {
  return first.x * second.x + first.z * second.z;
}

function normalizeVector2(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return {
      x: 1,
      z: 0,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 17;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 31 + road.id.charCodeAt(index)) % 9973;
  }

  return hash + road.segmentIndex * 101;
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function getSideSalt(side: HomeDriveBuildingSide): number {
  return side === 1 ? 0 : 10_000;
}

function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 7.4;

    case "avenue":
      return 5;

    case "commercial":
      return 4.6;

    case "ring":
      return 4.2;

    case "service":
      return 2.4;

    case "street":
      return 3;

    default:
      if (road.roadTone === "boulevard") {
        return 6.2;
      }

      if (road.roadTone === "urban-core") {
        return 4.1;
      }

      return 3.7;
  }
}

function getCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

function getRoadDevelopmentChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  let baseChance = 0.72;

  if (tags.includes("closed-loop")) {
    baseChance = 0.58;
  } else if (tags.includes("service") || road.kind === "service") {
    baseChance = 0.72;
  } else if (road.kind === "coastal") {
    baseChance = 0.78;
  } else if (road.kind === "avenue") {
    baseChance = 0.9;
  } else if (road.kind === "commercial") {
    baseChance = 0.94;
  } else if (road.kind === "street") {
    baseChance = 0.86;
  } else if (road.kind === "ring") {
    baseChance = 0.76;
  }

  if (tags.includes("main") || tags.includes("fast")) {
    baseChance += 0.08;
  }

  return clamp(baseChance * BUILDING_DEVELOPMENT_CHANCE_MULTIPLIER, 0, 0.98);
}

function getLotSpacingMeters(road: HomeDriveGeneratedRoadSegment): number {
  /*
    Mantém a escala original do lote.
    A multiplicação real vem de BUILDING_SLOT_DENSITY_MULTIPLIER.
  */
  switch (road.kind) {
    case "coastal":
      return 86;

    case "avenue":
      return 72;

    case "commercial":
      return 54;

    case "ring":
      return 88;

    case "service":
      return 76;

    case "street":
      return 48;

    default:
      return 64;
  }
}

function getLotSetbackMeters(_road: HomeDriveGeneratedRoadSegment): number {
  return 0;
}

function getPointOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
): HomeDriveVector2 {
  return {
    x: road.from.x + (road.to.x - road.from.x) * t,
    z: road.from.z + (road.to.z - road.from.z) * t,
  };
}

function getPaddedSlotT(
  roadSeed: number,
  slotIndex: number,
  slotCount: number,
  side: HomeDriveBuildingSide,
  salt: number,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawSlotT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const jitterSeed = hashVector(roadSeed, slotIndex, salt + getSideSalt(side));
  const jitter = (jitterSeed - 0.5) * slotWidth * LOT_POSITION_JITTER_RATIO;
  const shapedT = clamp01(rawSlotT + jitter);

  return (
    LOT_ENDPOINT_PADDING_RATIO +
    shapedT * (1 - LOT_ENDPOINT_PADDING_RATIO * 2)
  );
}

function getRotationYForRoad(road: HomeDriveGeneratedRoadSegment): number {
  /*
    Alinha a largura do box com a direção da rua.
    Em Three.js, um box unitário usa X como largura e Z como profundidade.
  */
  return Math.atan2(-road.direction.z, road.direction.x);
}

function pickBuildingKind(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveBuildingKind {
  const districtId = road.districtId;
  const tags = getRoadTags(road);
  const shapedSeed = smoothstep01(seed);

  if (road.kind === "service" || tags.includes("service")) {
    if (shapedSeed > 0.64) {
      return "warehouse";
    }

    if (shapedSeed > 0.28) {
      return "commerce";
    }

    return "house";
  }

  if (districtId === "castelao") {
    if (shapedSeed > 0.78) {
      return "commerce";
    }

    if (shapedSeed > 0.48) {
      return "warehouse";
    }

    if (shapedSeed > 0.18) {
      return "house";
    }

    return "commerce";
  }

  if (districtId === "centro") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.42) {
      return "apartment";
    }

    if (shapedSeed > 0.16) {
      return "commerce";
    }

    return "office";
  }

  if (districtId === "aldeota" || districtId === "meireles") {
    if (shapedSeed > 0.76) {
      return "office";
    }

    if (shapedSeed > 0.42) {
      return "apartment";
    }

    if (shapedSeed > 0.18) {
      return "commerce";
    }

    return "apartment";
  }

  if (districtId === "benfica") {
    if (shapedSeed > 0.74) {
      return "apartment";
    }

    if (shapedSeed > 0.42) {
      return "commerce";
    }

    if (shapedSeed > 0.16) {
      return "house";
    }

    return "apartment";
  }

  if (districtId === "praia-de-iracema") {
    if (shapedSeed > 0.62) {
      return "commerce";
    }

    if (shapedSeed > 0.28) {
      return "apartment";
    }

    return "house";
  }

  if (road.kind === "commercial") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.22) {
      return "commerce";
    }

    return "apartment";
  }

  if (road.kind === "avenue") {
    if (shapedSeed > 0.72) {
      return "office";
    }

    if (shapedSeed > 0.36) {
      return "apartment";
    }

    return "commerce";
  }

  if (road.kind === "coastal") {
    if (shapedSeed > 0.64) {
      return "apartment";
    }

    if (shapedSeed > 0.24) {
      return "commerce";
    }

    return "house";
  }

  return shapedSeed > 0.58 ? "commerce" : "house";
}

function getBuildingMaterialKey(
  kind: HomeDriveBuildingKind,
  seed: number,
): HomeDriveBuildingMaterialKey {
  switch (kind) {
    case "house":
      return seed > 0.5 ? "house-warm" : "house-cool";

    case "commerce":
      return seed > 0.56 ? "commerce-night" : "commerce-warm";

    case "apartment":
      return seed > 0.5 ? "apartment-concrete" : "apartment-light";

    case "office":
      return seed > 0.32 ? "office-blue" : "apartment-concrete";

    case "warehouse":
    default:
      return seed > 0.28 ? "warehouse-metal" : "commerce-night";
  }
}

function getBuildingDimensions(
  kind: HomeDriveBuildingKind,
  seedA: number,
  seedB: number,
  seedC: number,
): Readonly<{
  widthMeters: number;
  depthMeters: number;
  heightMeters: number;
  floors: number;
}> {
  switch (kind) {
    case "house": {
      const floors = seedC > 0.66 ? 2 : 1;

      return {
        widthMeters: 7.5 + seedA * 7.4,
        depthMeters: 8 + seedB * 5.8,
        heightMeters: floors * 3.2 + 1.2 + seedA * 0.7,
        floors,
      };
    }

    case "commerce": {
      const floors =
        seedC > 0.86 ? 4 : seedC > 0.58 ? 3 : seedC > 0.24 ? 2 : 1;

      return {
        widthMeters: 9.5 + seedA * 12.8,
        depthMeters: 8.8 + seedB * 8.6,
        heightMeters: floors * 3.6 + 1.4 + seedB * 0.9,
        floors,
      };
    }

    case "apartment": {
      const floors = 3 + Math.floor(seedC * 9);

      return {
        widthMeters: 11 + seedA * 13.8,
        depthMeters: 10.5 + seedB * 10.2,
        heightMeters: floors * 3.05 + 2.2 + seedA * 1.1,
        floors,
      };
    }

    case "office": {
      const floors = 4 + Math.floor(seedC * 12);

      return {
        widthMeters: 12.5 + seedA * 15.2,
        depthMeters: 12 + seedB * 11.4,
        heightMeters: floors * 3.25 + 2.4 + seedB * 1.4,
        floors,
      };
    }

    case "warehouse":
    default: {
      return {
        widthMeters: 15 + seedA * 17.8,
        depthMeters: 13.5 + seedB * 14.5,
        heightMeters: 6 + seedC * 8.2,
        floors: 1,
      };
    }
  }
}

function getBuildingFootprintSamples(
  position: HomeDriveVector2,
  widthMeters: number,
  depthMeters: number,
  rotationYRad: number,
): readonly HomeDriveVector2[] {
  const cos = Math.cos(rotationYRad);
  const sin = Math.sin(rotationYRad);
  const halfWidth = widthMeters / 2;
  const halfDepth = depthMeters / 2;

  const localPoints = [
    { x: 0, z: 0 },
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
    { x: -halfWidth, z: halfDepth },
    { x: 0, z: -halfDepth },
    { x: 0, z: halfDepth },
    { x: -halfWidth, z: 0 },
    { x: halfWidth, z: 0 },
  ];

  return localPoints.map((point) => {
    return {
      x: position.x + point.x * cos + point.z * sin,
      z: position.z - point.x * sin + point.z * cos,
    };
  });
}

function isBuildingFootprintBlockedByRoad(
  position: HomeDriveVector2,
  widthMeters: number,
  depthMeters: number,
  rotationYRad: number,
): boolean {
  const samples = getBuildingFootprintSamples(
    position,
    widthMeters,
    depthMeters,
    rotationYRad,
  );

  return samples.some((sample) =>
    isHomeDrivePositionBlockedByRoad(
      sample,
      BUILDING_ROAD_COLLISION_SAMPLE_RADIUS_METERS,
    ),
  );
}

function getSpatialCellCoordinate(value: number): number {
  return Math.floor(value / BUILDING_SPATIAL_GRID_CELL_METERS);
}

function getSpatialCellKey(x: number, z: number): string {
  return `${getSpatialCellCoordinate(x)}:${getSpatialCellCoordinate(z)}`;
}

function getNearbyPlacedBuildings(
  position: HomeDriveVector2,
  spatialIndex: BuildingSpatialIndex,
): readonly HomeDriveBuilding[] {
  const centerX = getSpatialCellCoordinate(position.x);
  const centerZ = getSpatialCellCoordinate(position.z);
  const nearby: HomeDriveBuilding[] = [];

  for (
    let cellX = centerX - BUILDING_SPATIAL_SEARCH_RADIUS_CELLS;
    cellX <= centerX + BUILDING_SPATIAL_SEARCH_RADIUS_CELLS;
    cellX += 1
  ) {
    for (
      let cellZ = centerZ - BUILDING_SPATIAL_SEARCH_RADIUS_CELLS;
      cellZ <= centerZ + BUILDING_SPATIAL_SEARCH_RADIUS_CELLS;
      cellZ += 1
    ) {
      const cellBuildings = spatialIndex.get(`${cellX}:${cellZ}`);

      if (cellBuildings) {
        nearby.push(...cellBuildings);
      }
    }
  }

  return nearby;
}

function addBuildingToSpatialIndex(
  building: HomeDriveBuilding,
  spatialIndex: BuildingSpatialIndex,
): void {
  const key = getSpatialCellKey(building.position.x, building.position.z);
  const current = spatialIndex.get(key);

  if (current) {
    current.push(building);
    return;
  }

  spatialIndex.set(key, [building]);
}

function getBuildingLocalXAxis(rotationYRad: number): BuildingAxis {
  return {
    x: Math.cos(rotationYRad),
    z: -Math.sin(rotationYRad),
  };
}

function getBuildingLocalZAxis(rotationYRad: number): BuildingAxis {
  return {
    x: Math.sin(rotationYRad),
    z: Math.cos(rotationYRad),
  };
}

function getProjectionRadiusOnAxis(
  footprint: Pick<
    BuildingFootprint,
    "widthMeters" | "depthMeters" | "rotationYRad"
  >,
  axis: BuildingAxis,
): number {
  const localXAxis = getBuildingLocalXAxis(footprint.rotationYRad);
  const localZAxis = getBuildingLocalZAxis(footprint.rotationYRad);

  return (
    (footprint.widthMeters / 2) * Math.abs(dot(localXAxis, axis)) +
    (footprint.depthMeters / 2) * Math.abs(dot(localZAxis, axis))
  );
}

function getFootprintClearanceMeters(
  candidate: Pick<BuildingFootprint, "segmentId" | "side">,
  existing: Pick<HomeDriveBuilding, "segmentId" | "side">,
): number {
  if (candidate.segmentId === existing.segmentId) {
    return candidate.side === existing.side
      ? BUILDING_SAME_STREET_SIDE_CLEARANCE_METERS
      : BUILDING_OPPOSITE_SIDE_CLEARANCE_METERS;
  }

  return BUILDING_FOOTPRINT_CLEARANCE_METERS;
}

function areBuildingFootprintsOverlapping(
  candidate: BuildingFootprint,
  existing: HomeDriveBuilding,
): boolean {
  const candidateAxes = [
    getBuildingLocalXAxis(candidate.rotationYRad),
    getBuildingLocalZAxis(candidate.rotationYRad),
  ];

  const existingAxes = [
    getBuildingLocalXAxis(existing.rotationYRad),
    getBuildingLocalZAxis(existing.rotationYRad),
  ];

  const axes = [...candidateAxes, ...existingAxes];
  const centerDelta = {
    x: candidate.position.x - existing.position.x,
    z: candidate.position.z - existing.position.z,
  };
  const clearance = getFootprintClearanceMeters(candidate, existing);

  for (const axis of axes) {
    const candidateRadius = getProjectionRadiusOnAxis(candidate, axis);
    const existingRadius = getProjectionRadiusOnAxis(existing, axis);
    const centerDistance = Math.abs(dot(centerDelta, axis));

    if (centerDistance >= candidateRadius + existingRadius + clearance) {
      return false;
    }
  }

  return true;
}

function isTooCloseToPlacedBuilding(
  candidate: BuildingFootprint,
  spatialIndex: BuildingSpatialIndex,
): boolean {
  const nearbyBuildings = getNearbyPlacedBuildings(
    candidate.position,
    spatialIndex,
  );

  return nearbyBuildings.some((building) =>
    areBuildingFootprintsOverlapping(candidate, building),
  );
}

function getBuildingCenterOffsetFromRoad(
  road: HomeDriveGeneratedRoadSegment,
  buildingDepthMeters: number,
  frontGapMeters: number,
): number {
  return (
    road.width / 2 +
    getCurbWidthMeters(road) +
    getSidewalkWidthMeters(road) +
    getLotSetbackMeters(road) +
    frontGapMeters +
    buildingDepthMeters / 2 +
    LOT_SIDE_OFFSET_RANDOM_METERS
  );
}

function getBuildingPositionFromRoadOffset(
  pointOnRoad: HomeDriveVector2,
  roadNormal: HomeDriveVector2,
  side: HomeDriveBuildingSide,
  offsetMeters: number,
): HomeDriveVector2 {
  return {
    x: pointOnRoad.x + roadNormal.x * side * offsetMeters,
    z: pointOnRoad.z + roadNormal.z * side * offsetMeters,
  };
}

function createLotCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  side: HomeDriveBuildingSide,
): HomeDriveBuildingLotCandidate {
  const sideSalt = getSideSalt(side);
  const pointOnRoad = getPointOnRoad(
    road,
    getPaddedSlotT(roadSeed, slotIndex, slotCount, side, 233),
  );

  /*
    Prévia para o lote.
    O posicionamento definitivo é feito em createBuildingFromCandidate,
    já com a profundidade real do prédio e fallback de colisão.
  */
  const shallowPreviewDepth = 10;
  const offsetMeters = getBuildingCenterOffsetFromRoad(
    road,
    shallowPreviewDepth,
    LOT_FRONT_GAP_TO_SIDEWALK_METERS,
  );

  const roadDirection = normalizeVector2(road.direction);
  const roadNormal = normalizeVector2(road.normal);

  return {
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
    position: getBuildingPositionFromRoadOffset(
      pointOnRoad,
      roadNormal,
      side,
      offsetMeters,
    ),
    roadDirection,
    roadNormal,
    side,
    streetFacingSide: side,
    seed: hashVector(roadSeed, slotIndex, 229 + sideSalt),
  };
}

function pickWindowStyle(
  kind: HomeDriveBuildingKind,
  buildingId: string,
  variant: number,
): HomeDriveBuildingWindowStyle {
  const seed = getHomeDriveStableStringSeed(
    `${buildingId}:window-style:${variant}`,
    113,
  );

  if (kind === "office") {
    return seed > 0.24 ? "glass" : "mixed";
  }

  if (kind === "warehouse") {
    return seed > 0.58 ? "gridded" : "dark";
  }

  if (kind === "house") {
    if (seed > 0.72) {
      return "open";
    }

    if (seed > 0.38) {
      return "wood";
    }

    return "mixed";
  }

  if (kind === "commerce") {
    if (seed > 0.72) {
      return "glass";
    }

    if (seed > 0.46) {
      return "mixed";
    }

    if (seed > 0.22) {
      return "wood";
    }

    return "dark";
  }

  if (seed > 0.72) {
    return "gridded";
  }

  if (seed > 0.46) {
    return "glass";
  }

  if (seed > 0.22) {
    return "mixed";
  }

  return "dark";
}

function pickAirConditionerPresence(
  kind: HomeDriveBuildingKind,
  buildingId: string,
  variant: number,
): boolean {
  const seed = getHomeDriveStableStringSeed(
    `${buildingId}:air-conditioners:${variant}`,
    127,
  );

  switch (kind) {
    case "office":
    case "apartment":
      return seed > 0.24;

    case "commerce":
      return seed > 0.42;

    case "house":
      return seed > 0.68;

    case "warehouse":
    default:
      return seed > 0.82;
  }
}

function createBuildingFromCandidate(
  candidate: HomeDriveBuildingLotCandidate,
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): HomeDriveBuilding | null {
  const sideSalt = getSideSalt(candidate.side);
  const kindSeed = hashVector(roadSeed, slotIndex, 301 + sideSalt);
  const materialSeed = hashVector(roadSeed, slotIndex, 307 + sideSalt);
  const widthSeed = hashVector(roadSeed, slotIndex, 311 + sideSalt);
  const depthSeed = hashVector(roadSeed, slotIndex, 313 + sideSalt);
  const heightSeed = hashVector(roadSeed, slotIndex, 317 + sideSalt);
  const variantSeed = hashVector(roadSeed, slotIndex, 331 + sideSalt);

  const kind = pickBuildingKind(road, kindSeed);
  const dimensions = getBuildingDimensions(
    kind,
    widthSeed,
    depthSeed,
    heightSeed,
  );

  const rotationYRad = getRotationYForRoad(road);

  const pointOnRoad = getPointOnRoad(
    road,
    getPaddedSlotT(roadSeed, slotIndex, slotCount, candidate.side, 347),
  );

  const roadNormal = normalizeVector2(candidate.roadNormal);

  let position: HomeDriveVector2 | null = null;

  for (const frontGapMeters of LOT_FRONT_GAP_FALLBACKS_METERS) {
    const exactOffsetMeters = getBuildingCenterOffsetFromRoad(
      road,
      dimensions.depthMeters,
      frontGapMeters,
    );

    const candidatePosition = getBuildingPositionFromRoadOffset(
      pointOnRoad,
      roadNormal,
      candidate.side,
      exactOffsetMeters,
    );

    const blockedByRoad = isBuildingFootprintBlockedByRoad(
      candidatePosition,
      dimensions.widthMeters,
      dimensions.depthMeters,
      rotationYRad,
    );

    if (!blockedByRoad) {
      position = candidatePosition;
      break;
    }
  }

  if (!position) {
    return null;
  }

  const variant = Math.floor(variantSeed * 11);
  const materialKey = getBuildingMaterialKey(kind, materialSeed);
  const id = `building-${road.id}-${slotIndex}-${candidate.side}`;

  const commerceInput = {
    id,
    kind,
    materialKey,
    variant,
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
  };

  const commerceDescriptor = getHomeDriveCommerceDescriptor(commerceInput);
  const hasCommerceSign = shouldHomeDriveBuildingHaveCommerceSign(commerceInput);
  const facadeSeed = getHomeDriveStableStringSeed(`${id}:facade`, 139);

  return {
    id,
    kind,
    materialKey,
    position,
    widthMeters: dimensions.widthMeters,
    depthMeters: dimensions.depthMeters,
    heightMeters: dimensions.heightMeters,
    rotationYRad,
    floors: dimensions.floors,
    variant,
    side: candidate.side,
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
    roadDirection: normalizeVector2(candidate.roadDirection),
    roadNormal,
    streetFacingSide: candidate.streetFacingSide,
    commerceName: hasCommerceSign ? commerceDescriptor.name : undefined,
    commerceCategory: commerceDescriptor.category,
    signStyle: hasCommerceSign ? commerceDescriptor.signStyle : undefined,
    awningStyle: commerceDescriptor.awningStyle,
    windowStyle: pickWindowStyle(kind, id, variant),
    hasAirConditioners: pickAirConditionerPresence(kind, id, variant),
    facadeSeed,
  };
}

export function getHomeDriveBuildings(
  options: HomeDriveBuildingGenerationOptions = {},
): readonly HomeDriveBuilding[] {
  const maxBuildings = options.maxBuildings ?? DEFAULT_MAX_BUILDINGS;
  const minSegmentLengthMeters =
    options.minSegmentLengthMeters ?? DEFAULT_MIN_SEGMENT_LENGTH_METERS;

  const buildings: HomeDriveBuilding[] = [];
  const spatialIndex: BuildingSpatialIndex = new Map();
  const roads = generateHomeDriveRoadSegments();

  for (const road of roads) {
    if (buildings.length >= maxBuildings) {
      break;
    }

    if (road.length < minSegmentLengthMeters) {
      continue;
    }

    const roadSeed = getStableRoadSeed(road);
    const spacing = getLotSpacingMeters(road);
    const baseSlotCount = Math.max(1, Math.floor(road.length / spacing));
    const slotCount = Math.max(
      1,
      Math.floor(baseSlotCount * BUILDING_SLOT_DENSITY_MULTIPLIER),
    );
    const developmentChance = getRoadDevelopmentChance(road);
    const sides: readonly HomeDriveBuildingSide[] = [-1, 1];

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      if (buildings.length >= maxBuildings) {
        break;
      }

      for (const side of sides) {
        if (buildings.length >= maxBuildings) {
          break;
        }

        const sideSalt = getSideSalt(side);
        const occupancySeed = hashVector(roadSeed, slotIndex, 199 + sideSalt);

        if (occupancySeed > developmentChance) {
          continue;
        }

        const candidate = createLotCandidate(
          road,
          slotIndex,
          slotCount,
          roadSeed,
          side,
        );

        const building = createBuildingFromCandidate(
          candidate,
          road,
          slotIndex,
          slotCount,
          roadSeed,
        );

        if (!building) {
          continue;
        }

        if (
          isTooCloseToPlacedBuilding(
            {
              position: building.position,
              widthMeters: building.widthMeters,
              depthMeters: building.depthMeters,
              rotationYRad: building.rotationYRad,
              segmentId: building.segmentId,
              side: building.side,
            },
            spatialIndex,
          )
        ) {
          continue;
        }

        buildings.push(building);
        addBuildingToSpatialIndex(building, spatialIndex);
      }
    }
  }

  return buildings;
}
