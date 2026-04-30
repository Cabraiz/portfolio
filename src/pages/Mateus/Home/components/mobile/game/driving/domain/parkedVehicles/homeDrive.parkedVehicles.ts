// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.ts

import { hashVector } from "../homeDrive.math";
import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import {
  getHomeDriveVehicleModelDescriptor,
  pickHomeDriveVehicleModelKey,
  pickHomeDriveVehiclePaintKey,
} from "../vehicles";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleGenerationOptions,
  HomeDriveParkedVehicleMode,
  HomeDriveParkedVehicleQueryResult,
  HomeDriveParkedVehicleRuntimeState,
  HomeDriveParkedVehicleSide,
} from "./homeDrive.parkedVehicles.types";

const DEFAULT_MAX_PARKED_VEHICLES = 180;
const DEFAULT_PARKED_VEHICLE_DENSITY = 1;
const DEFAULT_MIN_ROAD_LENGTH_METERS = 74;
const DEFAULT_PARKED_VEHICLE_SEED = 6617;

const PARKED_ENDPOINT_PADDING_RATIO = 0.08;
const PARKED_SLOT_JITTER_RATIO = 0.42;
const MIN_ROAD_LENGTH_METERS = 0.000001;

type ParkedVehicleCandidate = Readonly<{
  vehicle: HomeDriveParkedVehicle;
  priority: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 37;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 43 + road.id.charCodeAt(index)) % 104729;
  }

  return hash + road.segmentIndex * 193;
}

function getRoadParkingChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("safe-endcap") || tags.includes("no-parking")) {
    return 0;
  }

  if (road.surface === "water") {
    return 0;
  }

  if (road.kind === "commercial") {
    return 0.86;
  }

  if (road.kind === "street") {
    return 0.78;
  }

  if (road.kind === "avenue") {
    return 0.52;
  }

  if (road.kind === "coastal") {
    return 0.38;
  }

  if (road.kind === "service") {
    return 0.58;
  }

  if (road.kind === "ring") {
    return 0.18;
  }

  return 0.44;
}

function getParkingSlotSpacingMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "commercial":
      return 38;

    case "street":
      return 42;

    case "avenue":
      return 58;

    case "coastal":
      return 72;

    case "service":
      return 50;

    case "ring":
      return 92;

    default:
      return 62;
  }
}

function getRoadSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
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

function getRoadCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
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
  side: HomeDriveParkedVehicleSide,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const sideSalt = side === 1 ? 0 : 9_000;
  const jitter =
    (hashVector(roadSeed, slotIndex, 701 + sideSalt) - 0.5) *
    slotWidth *
    PARKED_SLOT_JITTER_RATIO;

  return (
    PARKED_ENDPOINT_PADDING_RATIO +
    clamp01(rawT + jitter) * (1 - PARKED_ENDPOINT_PADDING_RATIO * 2)
  );
}

function getHeadingYForRoad(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: 1 | -1,
): number {
  const sign = directionSign >= 0 ? 1 : -1;

  return Math.atan2(road.direction.x * sign, road.direction.z * sign);
}

function getParkedVehicleMode(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveParkedVehicleMode {
  const commercialBoost = road.kind === "commercial" ? 0.08 : 0;
  const serviceBoost = road.kind === "service" ? 0.06 : 0;
  const avenuePenalty = road.kind === "avenue" || road.kind === "ring" ? 0.08 : 0;
  const coastalPenalty = road.kind === "coastal" ? 0.06 : 0;

  const halfSidewalkLimit = 0.72 + commercialBoost;
  const invasiveLimit = halfSidewalkLimit + 0.17 - avenuePenalty - coastalPenalty;
  const deliveryLimit = invasiveLimit + 0.06 + commercialBoost + serviceBoost;
  const drivewayLimit = deliveryLimit + 0.025;

  if (seed < halfSidewalkLimit) {
    return "curb-parallel";
  }

  if (seed < invasiveLimit) {
    return "half-sidewalk";
  }

  if (seed < deliveryLimit) {
    return "sidewalk-invasive";
  }

  if (seed < drivewayLimit) {
    return "delivery-stop";
  }

  return "driveway-front";
}

function getParkedVehicleOffsetFromRoadCenter(
  road: HomeDriveGeneratedRoadSegment,
  mode: HomeDriveParkedVehicleMode,
  vehicleWidthMeters: number,
): number {
  const roadHalfWidth = road.width / 2;
  const curbWidth = getRoadCurbWidthMeters(road);
  const sidewalkWidth = getRoadSidewalkWidthMeters(road);

  switch (mode) {
    case "curb-parallel":
      return roadHalfWidth - vehicleWidthMeters * 0.48 - 0.18;

    case "half-sidewalk":
      return roadHalfWidth + curbWidth + vehicleWidthMeters * 0.08;

    case "sidewalk-invasive":
      return roadHalfWidth + curbWidth + vehicleWidthMeters * 0.42;

    case "delivery-stop":
      return roadHalfWidth - vehicleWidthMeters * 0.5 - 0.08;

    case "driveway-front":
    default:
      return (
        roadHalfWidth +
        curbWidth +
        sidewalkWidth * 0.76 +
        vehicleWidthMeters * 0.18
      );
  }
}

function getParkedVehicleYawNoise(seed: number): number {
  return (seed - 0.5) * 0.12;
}

function shouldParkOnRoadSide(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveParkedVehicleSide,
  seed: number,
): boolean {
  if (road.kind === "ring") {
    return side === 1 && seed > 0.35;
  }

  if (road.kind === "avenue") {
    return seed > 0.24;
  }

  return seed > 0.08;
}

function createParkedVehicleCandidate(
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

  const modelSeed = hashVector(roadSeed, slotIndex, 743 + sideSalt + globalSeed);
  const modeSeed = hashVector(roadSeed, slotIndex, 751 + sideSalt + globalSeed);
  const paintSeed = hashVector(roadSeed, slotIndex, 757 + sideSalt + globalSeed);
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
  const modelKey = pickHomeDriveVehicleModelKey(modelSeed, {
    roadKind: road.kind,
    parked: true,
    commercialBias: road.kind === "commercial",
    serviceBias: road.kind === "service",
  });
  const model = getHomeDriveVehicleModelDescriptor(modelKey);
  const paintKey = pickHomeDriveVehiclePaintKey(paintSeed, modelKey);
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

export function createInitialHomeDriveParkedVehicleState(
  options: HomeDriveParkedVehicleGenerationOptions = {},
): HomeDriveParkedVehicleRuntimeState {
  if (options.enabled === false) {
    return {
      vehicles: [],
      seed: options.seed ?? DEFAULT_PARKED_VEHICLE_SEED,
    };
  }

  const maxVehicles = options.maxVehicles ?? DEFAULT_MAX_PARKED_VEHICLES;
  const density = options.density ?? DEFAULT_PARKED_VEHICLE_DENSITY;
  const minRoadLengthMeters =
    options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const maxRoads = options.maxRoads ?? Number.POSITIVE_INFINITY;
  const globalSeed = Math.floor((options.seed ?? DEFAULT_PARKED_VEHICLE_SEED) % 10_000);

  const roads = generateHomeDriveRoadSegments()
    .filter((road) => {
      return (
        road.length >= minRoadLengthMeters &&
        road.length > MIN_ROAD_LENGTH_METERS &&
        getRoadParkingChance(road) > 0
      );
    })
    .sort((first, second) => {
      const chanceDiff = getRoadParkingChance(second) - getRoadParkingChance(first);

      if (Math.abs(chanceDiff) > 0.0001) {
        return chanceDiff;
      }

      return second.length - first.length;
    })
    .slice(0, maxRoads);

  const candidates: ParkedVehicleCandidate[] = [];

  for (const road of roads) {
    const parkingChance = clamp01(getRoadParkingChance(road) * density);

    if (parkingChance <= 0) {
      continue;
    }

    const roadSeed = getStableRoadSeed(road);
    const spacing = getParkingSlotSpacingMeters(road);
    const slotCount = Math.max(1, Math.floor(road.length / spacing));
    const sides: readonly HomeDriveParkedVehicleSide[] = [-1, 1];

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      for (const side of sides) {
        const candidate = createParkedVehicleCandidate(
          road,
          slotIndex,
          slotCount,
          roadSeed,
          side,
          globalSeed,
          parkingChance,
        );

        if (candidate) {
          candidates.push(candidate);
        }
      }
    }
  }

  const vehicles = candidates
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.vehicle.id.localeCompare(second.vehicle.id);
    })
    .slice(0, maxVehicles)
    .map((candidate) => candidate.vehicle);

  return {
    vehicles,
    seed: globalSeed,
  };
}

export function getHomeDriveParkedVehiclesNearPosition(
  state: HomeDriveParkedVehicleRuntimeState,
  position: Readonly<{ x: number; z: number }>,
  radiusMeters: number,
): readonly HomeDriveParkedVehicleQueryResult[] {
  const radiusSquared = radiusMeters * radiusMeters;

  return state.vehicles
    .map((vehicle) => {
      const dx = vehicle.position.x - position.x;
      const dz = vehicle.position.z - position.z;
      const distanceSquared = dx * dx + dz * dz;

      return {
        vehicle,
        distanceMeters: Math.sqrt(distanceSquared),
        distanceSquared,
      };
    })
    .filter((item) => {
      return item.distanceSquared <= radiusSquared;
    })
    .sort((first, second) => {
      return first.distanceMeters - second.distanceMeters;
    })
    .map((item) => ({
      vehicle: item.vehicle,
      distanceMeters: item.distanceMeters,
    }));
}
