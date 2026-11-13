// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.buildings.ts

import { createHomeDriveBuildingEntranceProfile } from "./buildingEntrances";
import {
  getHomeDriveCommerceDescriptor,
  getHomeDriveStableStringSeed,
  shouldHomeDriveBuildingHaveCommerceSign,
} from "./homeDrive.commerceNames";
import { hashVector } from "./homeDrive.math";

import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingGenerationOptions,
  HomeDriveBuildingLotCandidate,
  HomeDriveBuildingSide,
} from "./homeDrive.building.types";
import {
  LOT_FRONT_GAP_FALLBACKS_METERS,
  DEFAULT_MAX_BUILDINGS,
  DEFAULT_MIN_SEGMENT_LENGTH_METERS,
  BUILDING_SLOT_DENSITY_MULTIPLIER,
} from "./homeDrive.buildings.constants";
import type { BuildingSpatialIndex } from "./homeDrive.buildings.constants";
import {
  getSideSalt,
  getRotationYForRoad,
  getPointOnRoad,
  getPaddedSlotT,
  normalizeVector2,
  getRoadTags,
  getStableRoadSeed,
  getLotSpacingMeters,
  getRoadDevelopmentChance,
} from "./homeDrive.buildings.lots";
import {
  pickBuildingKind,
  getBuildingDimensions,
  getBuildingMaterialKey,
  pickWindowStyle,
  pickAirConditionerPresence,
} from "./homeDrive.buildings.appearance";
import {
  getBuildingCenterOffsetFromRoad,
  getBuildingPositionFromRoadOffset,
  isBuildingFootprintBlockedByRoad,
  createLotCandidate,
  isTooCloseToPlacedBuilding,
  addBuildingToSpatialIndex,
} from "./homeDrive.buildings.footprint";

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
  const roadTags = getRoadTags(road);
  const entranceProfile = createHomeDriveBuildingEntranceProfile({
    buildingId: id,
    kind,
    materialKey,
    widthMeters: dimensions.widthMeters,
    heightMeters: dimensions.heightMeters,
    floors: dimensions.floors,
    variant,
    districtId: road.districtId,
    roadId: road.roadId,
    roadKind: road.kind,
    facadeSeed,
    commercialBias:
      road.kind === "commercial" ||
      road.roadTone === "urban-core" ||
      roadTags.includes("main") ||
      roadTags.includes("fast"),
    premiumBias:
      road.districtId === "aldeota" ||
      road.districtId === "meireles" ||
      road.districtId === "praia-de-iracema" ||
      materialKey === "office-blue",
    agedBias:
      road.districtId === "centro" ||
      road.districtId === "benfica" ||
      materialKey === "commerce-night",
    serviceBias:
      road.kind === "service" ||
      roadTags.includes("service") ||
      kind === "warehouse",
  });

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
    entranceProfile,
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
