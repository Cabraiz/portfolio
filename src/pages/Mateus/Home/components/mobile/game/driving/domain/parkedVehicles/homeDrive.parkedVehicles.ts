// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.ts

import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type {
  HomeDriveParkedVehicleGenerationOptions,
  HomeDriveParkedVehicleQueryResult,
  HomeDriveParkedVehicleRuntimeState,
  HomeDriveParkedVehicleSide,
} from "./homeDrive.parkedVehicles.types";
import {
  DEFAULT_MAX_PARKED_VEHICLES,
  DEFAULT_PARKED_VEHICLE_DENSITY,
  DEFAULT_MIN_ROAD_LENGTH_METERS,
  DEFAULT_PARKED_VEHICLE_SEED,
  MIN_ROAD_LENGTH_METERS,
  clamp01,
  getStableRoadSeed,
  getRoadParkingChance,
  getParkingSlotSpacingMeters,
} from "./homeDrive.parkedVehicles.helpers";
import type { ParkedVehicleCandidate } from "./homeDrive.parkedVehicles.helpers";
import { createParkedVehicleCandidate } from "./homeDrive.parkedVehicles.candidate";

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
  const globalSeed = Math.floor(
    (options.seed ?? DEFAULT_PARKED_VEHICLE_SEED) % 10_000,
  );

  const roads = generateHomeDriveRoadSegments()
    .filter((road) => {
      return (
        road.length >= minRoadLengthMeters &&
        road.length > MIN_ROAD_LENGTH_METERS &&
        getRoadParkingChance(road) > 0
      );
    })
    .sort((first, second) => {
      const chanceDiff =
        getRoadParkingChance(second) - getRoadParkingChance(first);

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
      const renderedPosition = {
        x: vehicle.position.x + vehicle.impactOffset.x,
        z: vehicle.position.z + vehicle.impactOffset.z,
      };
      const dx = renderedPosition.x - position.x;
      const dz = renderedPosition.z - position.z;
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
