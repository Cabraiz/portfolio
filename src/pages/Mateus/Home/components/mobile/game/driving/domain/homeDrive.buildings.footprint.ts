// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.footprint.ts

import { hashVector } from "./homeDrive.math";
import { isHomeDrivePositionBlockedByRoad } from "./homeDrive.roadExclusion";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingLotCandidate,
  HomeDriveBuildingSide,
} from "./homeDrive.building.types";
import {
  BUILDING_ROAD_COLLISION_SAMPLE_RADIUS_METERS,
  BUILDING_SPATIAL_GRID_CELL_METERS,
  BUILDING_SPATIAL_SEARCH_RADIUS_CELLS,
  BUILDING_SAME_STREET_SIDE_CLEARANCE_METERS,
  BUILDING_OPPOSITE_SIDE_CLEARANCE_METERS,
  BUILDING_FOOTPRINT_CLEARANCE_METERS,
  LOT_SIDE_OFFSET_RANDOM_METERS,
  LOT_FRONT_GAP_TO_SIDEWALK_METERS,
} from "./homeDrive.buildings.constants";
import type {
  BuildingSpatialIndex,
  BuildingAxis,
  BuildingFootprint,
} from "./homeDrive.buildings.constants";
import {
  dot,
  getCurbWidthMeters,
  getSidewalkWidthMeters,
  getLotSetbackMeters,
  getSideSalt,
  getPointOnRoad,
  getPaddedSlotT,
  normalizeVector2,
} from "./homeDrive.buildings.lots";

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

export function isBuildingFootprintBlockedByRoad(
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

export function addBuildingToSpatialIndex(
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

export function isTooCloseToPlacedBuilding(
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

export function getBuildingCenterOffsetFromRoad(
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

export function getBuildingPositionFromRoadOffset(
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

export function createLotCandidate(
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
