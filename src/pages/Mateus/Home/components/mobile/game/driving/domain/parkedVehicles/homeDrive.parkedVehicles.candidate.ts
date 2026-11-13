// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.candidate.ts
// Escolha de modelo/pintura e criação do candidato.

import { hashVector } from "../homeDrive.math";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import {
  getHomeDriveVehicleModelDescriptor,
  pickHomeDriveVehicleModelKey,
  pickHomeDriveVehiclePaintKey,
} from "../vehicles";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleSide,
} from "./homeDrive.parkedVehicles.types";
import {
  getPointOnRoad,
  getPaddedSlotT,
  getHeadingYForRoad,
  getParkedVehicleMode,
  getParkedVehicleOffsetFromRoadCenter,
  getParkedVehicleYawNoise,
  shouldParkOnRoadSide,
  getParkedVehicleCollisionRadiusMeters,
  getParkedVehicleMassKg,
} from "./homeDrive.parkedVehicles.helpers";
import type { ParkedVehicleCandidate } from "./homeDrive.parkedVehicles.helpers";

type ParkedVehiclePickContext = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  roadSeed: number;
  slotIndex: number;
  sideSalt: number;
  globalSeed: number;
}>;

function getDiverseParkedVehicleModelKey(
  context: ParkedVehiclePickContext,
): ReturnType<typeof pickHomeDriveVehicleModelKey> {
  const candidateSeeds = [
    hashVector(context.roadSeed, context.slotIndex, 743 + context.sideSalt + context.globalSeed),
    hashVector(context.roadSeed, context.slotIndex, 1743 + context.sideSalt + context.globalSeed),
    hashVector(context.roadSeed, context.slotIndex, 2743 + context.sideSalt + context.globalSeed),
    hashVector(context.roadSeed, context.slotIndex, 3743 + context.sideSalt + context.globalSeed),
  ];

  const candidates = Array.from(
    new Set(
      candidateSeeds.map((seed) =>
        pickHomeDriveVehicleModelKey(seed, {
          roadKind: context.road.kind,
          parked: true,
          commercialBias: context.road.kind === "commercial",
          serviceBias: context.road.kind === "service",
        }),
      ),
    ),
  );

  const interestingOffset =
    context.road.kind === "commercial"
      ? 1
      : context.road.kind === "service"
        ? 2
        : context.road.kind === "coastal"
          ? 1
          : 0;

  return candidates[(context.slotIndex + interestingOffset) % candidates.length] ?? candidates[0];
}

function getDiverseParkedVehiclePaintKey(
  modelKey: ReturnType<typeof pickHomeDriveVehicleModelKey>,
  context: ParkedVehiclePickContext,
): ReturnType<typeof pickHomeDriveVehiclePaintKey> {
  const candidateSeeds = [
    hashVector(context.roadSeed, context.slotIndex, 757 + context.sideSalt + context.globalSeed),
    hashVector(context.roadSeed, context.slotIndex, 1757 + context.sideSalt + context.globalSeed),
    hashVector(context.roadSeed, context.slotIndex, 2757 + context.sideSalt + context.globalSeed),
  ];

  const candidates = Array.from(
    new Set(candidateSeeds.map((seed) => pickHomeDriveVehiclePaintKey(seed, modelKey))),
  );

  const paletteShift = Math.floor(
    hashVector(context.roadSeed, context.globalSeed, 1979 + context.sideSalt) * Math.max(1, candidates.length),
  );

  return candidates[(context.slotIndex + paletteShift) % candidates.length] ?? candidates[0];
}

export function createParkedVehicleCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  side: HomeDriveParkedVehicleSide,
  globalSeed: number,
  parkingChance: number,
): ParkedVehicleCandidate | null {
  const sideSalt = side === 1 ? 0 : 10_000;
  const sideSeed = hashVector(roadSeed, slotIndex, 733 + sideSalt + globalSeed);

  if (!shouldParkOnRoadSide(road, side, sideSeed)) {
    return null;
  }

  const spawnSeed = hashVector(roadSeed, slotIndex, 739 + sideSalt + globalSeed);

  if (spawnSeed > parkingChance) {
    return null;
  }

  const modeSeed = hashVector(roadSeed, slotIndex, 751 + sideSalt + globalSeed);
  const directionSeed = hashVector(
    roadSeed,
    slotIndex,
    761 + sideSalt + globalSeed,
  );
  const yawSeed = hashVector(roadSeed, slotIndex, 769 + sideSalt + globalSeed);
  const prioritySeed = hashVector(
    roadSeed,
    slotIndex,
    773 + sideSalt + globalSeed,
  );

  const mode = getParkedVehicleMode(road, modeSeed);
  const pickContext: ParkedVehiclePickContext = {
    road,
    roadSeed,
    slotIndex,
    sideSalt,
    globalSeed,
  };
  const modelKey = getDiverseParkedVehicleModelKey(pickContext);
  const model = getHomeDriveVehicleModelDescriptor(modelKey);
  const paintKey = getDiverseParkedVehiclePaintKey(modelKey, pickContext);
  const t = getPaddedSlotT(roadSeed, slotIndex, slotCount, side);
  const pointOnRoad = getPointOnRoad(road, t);
  const offsetMeters = getParkedVehicleOffsetFromRoadCenter(
    road,
    mode,
    model.dimensions.widthMeters,
  );
  const directionSign = directionSeed > 0.5 ? 1 : -1;
  const headingRad =
    getHeadingYForRoad(road, directionSign) + getParkedVehicleYawNoise(yawSeed);

  const position = {
    x: pointOnRoad.x + road.normal.x * side * offsetMeters,
    z: pointOnRoad.z + road.normal.z * side * offsetMeters,
  };

  const vehicle: HomeDriveParkedVehicle = {
    id: `parked-${road.id}-${slotIndex}-${side}`,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    districtId: road.districtId,
    roadKind: road.kind,
    modelKey,
    paintKey,
    mode,
    position,
    headingRad,
    side,
    widthMeters: model.dimensions.widthMeters,
    lengthMeters: model.dimensions.lengthMeters,
    heightMeters: model.dimensions.heightMeters,
    collisionRadiusMeters: getParkedVehicleCollisionRadiusMeters({
      widthMeters: model.dimensions.widthMeters,
      lengthMeters: model.dimensions.lengthMeters,
    }),
    massKg: getParkedVehicleMassKg({
      widthMeters: model.dimensions.widthMeters,
      lengthMeters: model.dimensions.lengthMeters,
      heightMeters: model.dimensions.heightMeters,
    }),
    damage: 0,
    hasBeenHit: false,
    damageSide: side,
    damageLocalZ: 0,
    impactOffset: {
      x: 0,
      z: 0,
    },
    impactVelocity: {
      x: 0,
      z: 0,
    },
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    lastCollisionAt: -999,
    t,
    seed: hashVector(roadSeed, slotIndex, 787 + sideSalt + globalSeed),
  };

  return {
    vehicle,
    priority:
      prioritySeed -
      parkingChance * 0.18 -
      (road.kind === "commercial" ? 0.08 : 0),
  };
}
