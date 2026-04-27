// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.ts

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
} from "./homeDrive.building.types";

const DEFAULT_MAX_BUILDINGS = 260;
const DEFAULT_MIN_SEGMENT_LENGTH_METERS = 72;

const LOT_ENDPOINT_PADDING_RATIO = 0.18;
const BUILDING_ROAD_COLLISION_SAMPLE_RADIUS_METERS = 0.85;
const BUILDING_MIN_DISTANCE_METERS = 12;

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

function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 9.2;
    case "avenue":
      return 6.4;
    case "commercial":
      return 5.8;
    case "ring":
      return 5.2;
    case "service":
      return 2.8;
    case "street":
      return 3.6;
    default:
      if (road.roadTone === "boulevard") {
        return 7.4;
      }

      if (road.roadTone === "urban-core") {
        return 4.8;
      }

      return 4.4;
  }
}

function getCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

function getRoadDevelopmentChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("closed-loop")) {
    return 0.3;
  }

  if (tags.includes("service") || road.kind === "service") {
    return 0.42;
  }

  if (road.kind === "coastal") {
    return 0.58;
  }

  if (road.kind === "avenue") {
    return 0.68;
  }

  if (road.kind === "commercial") {
    return 0.74;
  }

  if (road.kind === "street") {
    return 0.64;
  }

  return 0.56;
}

function getLotSpacingMeters(road: HomeDriveGeneratedRoadSegment): number {
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

function getLotSetbackMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 10;
    case "avenue":
      return 7;
    case "commercial":
      return 4.8;
    case "service":
      return 5.2;
    case "street":
      return 4.2;
    default:
      return 5.8;
  }
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

  if (road.kind === "service" || tags.includes("service")) {
    return seed > 0.52 ? "warehouse" : "commerce";
  }

  if (districtId === "castelao") {
    if (seed > 0.72) {
      return "commerce";
    }

    if (seed > 0.42) {
      return "warehouse";
    }

    return "house";
  }

  if (districtId === "centro") {
    if (seed > 0.66) {
      return "office";
    }

    if (seed > 0.32) {
      return "commerce";
    }

    return "apartment";
  }

  if (districtId === "aldeota" || districtId === "meireles") {
    if (seed > 0.72) {
      return "office";
    }

    if (seed > 0.42) {
      return "apartment";
    }

    return "commerce";
  }

  if (districtId === "benfica") {
    if (seed > 0.72) {
      return "apartment";
    }

    if (seed > 0.42) {
      return "commerce";
    }

    return "house";
  }

  if (districtId === "praia-de-iracema") {
    if (seed > 0.52) {
      return "commerce";
    }

    if (seed > 0.24) {
      return "apartment";
    }

    return "house";
  }

  if (road.kind === "commercial") {
    return seed > 0.36 ? "commerce" : "office";
  }

  if (road.kind === "avenue") {
    return seed > 0.52 ? "apartment" : "commerce";
  }

  return seed > 0.58 ? "commerce" : "house";
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
      return "office-blue";
    case "warehouse":
    default:
      return "warehouse-metal";
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
      const floors = seedC > 0.72 ? 2 : 1;

      return {
        widthMeters: 9 + seedA * 7,
        depthMeters: 9 + seedB * 6,
        heightMeters: floors * 3.2 + 1.2,
        floors,
      };
    }

    case "commerce": {
      const floors = seedC > 0.82 ? 3 : seedC > 0.5 ? 2 : 1;

      return {
        widthMeters: 12 + seedA * 12,
        depthMeters: 10 + seedB * 9,
        heightMeters: floors * 3.6 + 1.4,
        floors,
      };
    }

    case "apartment": {
      const floors = 4 + Math.floor(seedC * 7);

      return {
        widthMeters: 14 + seedA * 12,
        depthMeters: 12 + seedB * 10,
        heightMeters: floors * 3.05 + 2.2,
        floors,
      };
    }

    case "office": {
      const floors = 5 + Math.floor(seedC * 9);

      return {
        widthMeters: 16 + seedA * 14,
        depthMeters: 14 + seedB * 12,
        heightMeters: floors * 3.25 + 2.4,
        floors,
      };
    }

    case "warehouse":
    default: {
      return {
        widthMeters: 22 + seedA * 18,
        depthMeters: 18 + seedB * 16,
        heightMeters: 7 + seedC * 7,
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

function isTooCloseToPlacedBuilding(
  position: HomeDriveVector2,
  widthMeters: number,
  depthMeters: number,
  placedBuildings: readonly HomeDriveBuilding[],
): boolean {
  const candidateRadius = Math.max(widthMeters, depthMeters) * 0.58;

  return placedBuildings.some((building) => {
    const existingRadius =
      Math.max(building.widthMeters, building.depthMeters) * 0.58;
    const minDistance =
      candidateRadius + existingRadius + BUILDING_MIN_DISTANCE_METERS;

    return (
      Math.hypot(
        position.x - building.position.x,
        position.z - building.position.z,
      ) < minDistance
    );
  });
}

function createLotCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): HomeDriveBuildingLotCandidate {
  const sideSeed = hashVector(roadSeed, slotIndex, 211);
  const offsetSeed = hashVector(roadSeed, slotIndex, 223);
  const side: HomeDriveBuildingSide = sideSeed > 0.5 ? 1 : -1;

  const paddedT =
    LOT_ENDPOINT_PADDING_RATIO +
    ((slotIndex + 0.5) / slotCount) * (1 - LOT_ENDPOINT_PADDING_RATIO * 2);

  const pointOnRoad = getPointOnRoad(road, paddedT);

  const shallowPreviewDepth = 14;
  const offsetMeters =
    road.width / 2 +
    getSidewalkWidthMeters(road) +
    getCurbWidthMeters(road) +
    getLotSetbackMeters(road) +
    shallowPreviewDepth / 2 +
    offsetSeed * 5;

  return {
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
    position: {
      x: pointOnRoad.x + road.normal.x * side * offsetMeters,
      z: pointOnRoad.z + road.normal.z * side * offsetMeters,
    },
    roadDirection: road.direction,
    side,
    seed: hashVector(roadSeed, slotIndex, 229),
  };
}

function createBuildingFromCandidate(
  candidate: HomeDriveBuildingLotCandidate,
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  roadSeed: number,
): HomeDriveBuilding | null {
  const kindSeed = hashVector(roadSeed, slotIndex, 301);
  const materialSeed = hashVector(roadSeed, slotIndex, 307);
  const widthSeed = hashVector(roadSeed, slotIndex, 311);
  const depthSeed = hashVector(roadSeed, slotIndex, 313);
  const heightSeed = hashVector(roadSeed, slotIndex, 317);
  const variantSeed = hashVector(roadSeed, slotIndex, 331);

  const kind = pickBuildingKind(road, kindSeed);
  const dimensions = getBuildingDimensions(
    kind,
    widthSeed,
    depthSeed,
    heightSeed,
  );

  const rotationYRad = getRotationYForRoad(road);
  const exactOffsetMeters =
    road.width / 2 +
    getSidewalkWidthMeters(road) +
    getCurbWidthMeters(road) +
    getLotSetbackMeters(road) +
    dimensions.depthMeters / 2 +
    hashVector(roadSeed, slotIndex, 337) * 5;

  const pointOnRoad = getPointOnRoad(
    road,
    LOT_ENDPOINT_PADDING_RATIO +
      ((slotIndex + 0.5) /
        Math.max(1, Math.floor(road.length / getLotSpacingMeters(road)))) *
        (1 - LOT_ENDPOINT_PADDING_RATIO * 2),
  );

  const position = {
    x: pointOnRoad.x + road.normal.x * candidate.side * exactOffsetMeters,
    z: pointOnRoad.z + road.normal.z * candidate.side * exactOffsetMeters,
  };

  if (
    isBuildingFootprintBlockedByRoad(
      position,
      dimensions.widthMeters,
      dimensions.depthMeters,
      rotationYRad,
    )
  ) {
    return null;
  }

  return {
    id: `building-${road.id}-${slotIndex}-${candidate.side}`,
    kind,
    materialKey: getBuildingMaterialKey(kind, materialSeed),
    position,
    widthMeters: dimensions.widthMeters,
    depthMeters: dimensions.depthMeters,
    heightMeters: dimensions.heightMeters,
    rotationYRad,
    floors: dimensions.floors,
    variant: Math.floor(variantSeed * 5),
    side: candidate.side,
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
  };
}

export function getHomeDriveBuildings(
  options: HomeDriveBuildingGenerationOptions = {},
): readonly HomeDriveBuilding[] {
  const maxBuildings = options.maxBuildings ?? DEFAULT_MAX_BUILDINGS;
  const minSegmentLengthMeters =
    options.minSegmentLengthMeters ?? DEFAULT_MIN_SEGMENT_LENGTH_METERS;

  const buildings: HomeDriveBuilding[] = [];
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
    const slotCount = Math.max(1, Math.floor(road.length / spacing));
    const developmentChance = getRoadDevelopmentChance(road);

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      if (buildings.length >= maxBuildings) {
        break;
      }

      const occupancySeed = hashVector(roadSeed, slotIndex, 199);

      if (occupancySeed > developmentChance) {
        continue;
      }

      const candidate = createLotCandidate(road, slotIndex, slotCount, roadSeed);
      const building = createBuildingFromCandidate(
        candidate,
        road,
        slotIndex,
        roadSeed,
      );

      if (!building) {
        continue;
      }

      if (
        isTooCloseToPlacedBuilding(
          building.position,
          building.widthMeters,
          building.depthMeters,
          buildings,
        )
      ) {
        continue;
      }

      buildings.push(building);
    }
  }

  return buildings;
}
