// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.ts

import { hashVector } from "./homeDrive.math";

import {
  createHomeDriveTrafficAwarenessSnapshot,
  stabilizeHomeDriveTrafficLaneSeparation,
} from "./homeDrive.trafficAwareness";

import { repairHomeDriveTrafficIntersectionAccumulation } from "./homeDrive.trafficIntersectionFlow";

import type {
  HomeDriveTrafficGenerationOptions,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficTickOptions,
} from "./homeDrive.traffic.types";
import {
  DEFAULT_MAX_TRAFFIC_VEHICLES,
  DEFAULT_MIN_ROAD_LENGTH_METERS,
  DEFAULT_TRAFFIC_DENSITY,
} from "./homeDrive.traffic.constants";
import type { TrafficVehicleCandidate } from "./homeDrive.traffic.constants";
import {
  getTrafficRoadSegments,
  getStableRoadSeed,
  clamp01,
  getTrafficRoadTopology,
  getRoadBySegmentIdMap,
} from "./homeDrive.traffic.roads";
import {
  getTrafficRoadChance,
  getTrafficSlotSpacingMeters,
} from "./homeDrive.traffic.vehicleProfile";
import {
  createTrafficVehicleCandidate,
  selectTrafficSpawnCandidates,
} from "./homeDrive.traffic.spawn";
import {
  createTrafficRuntimePerformanceContext,
} from "./homeDrive.traffic.recyclePlacement";
import { recycleColdTrafficVehicles } from "./homeDrive.traffic.recycle";
import {
  getActiveTrafficVehicleIndexes,
  getKinematicTrafficVehicleIndexes,
  getAwarenessTrafficVehicleIndexes,
  createActiveTrafficState,
} from "./homeDrive.traffic.activeIndexes";
import {
  tickTrafficVehicle,
  tickTrafficVehicleKinematic,
} from "./homeDrive.traffic.tick";
import {
  repairTrafficCongestionAfterBudgetTick,
} from "./homeDrive.traffic.congestion";

export function createInitialHomeDriveTrafficState(
  options: HomeDriveTrafficGenerationOptions = {},
): HomeDriveTrafficRuntimeState {
  const maxVehicles = options.maxVehicles ?? DEFAULT_MAX_TRAFFIC_VEHICLES;
  const minRoadLengthMeters =
    options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const density = options.density ?? DEFAULT_TRAFFIC_DENSITY;

  const roads = getTrafficRoadSegments();
  const candidates: TrafficVehicleCandidate[] = [];

  for (const road of roads) {
    if (road.length < minRoadLengthMeters) {
      continue;
    }

    const roadSeed = getStableRoadSeed(road);
    const roadChance = clamp01(getTrafficRoadChance(road) * density);
    const spacing = getTrafficSlotSpacingMeters(road);
    const slotCount = Math.max(1, Math.floor(road.length / spacing));

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const spawnSeed = hashVector(roadSeed, slotIndex, 491);

      if (spawnSeed > roadChance) {
        continue;
      }

      candidates.push(
        createTrafficVehicleCandidate(
          road,
          slotIndex,
          slotCount,
          roadSeed,
          roadChance,
        ),
      );
    }
  }

  const vehicles = selectTrafficSpawnCandidates(candidates, maxVehicles).map(
    (candidate) => candidate.vehicle,
  );

  return {
    vehicles,
    elapsedSeconds: 0,
    lastCollisionAt: -999,
  };
}

export function tickHomeDriveTraffic(
  traffic: HomeDriveTrafficRuntimeState,
  deltaSeconds: number,
  options: HomeDriveTrafficTickOptions = {},
): HomeDriveTrafficRuntimeState {
  if (options.enabled === false || deltaSeconds <= 0) {
    return traffic;
  }

  const roads = getTrafficRoadSegments();
  const topology = getTrafficRoadTopology(roads);
  const roadsBySegmentId = getRoadBySegmentIdMap(roads);
  const context = createTrafficRuntimePerformanceContext(options);
  const nextElapsedSeconds = traffic.elapsedSeconds + deltaSeconds;

  const pooledVehicles = recycleColdTrafficVehicles(
    traffic.vehicles,
    roads,
    nextElapsedSeconds,
    context,
    options.crosswalks,
  );
  const activeIndexes = getActiveTrafficVehicleIndexes(
    pooledVehicles,
    nextElapsedSeconds,
    context,
  );
  const kinematicIndexes = getKinematicTrafficVehicleIndexes(
    pooledVehicles,
    activeIndexes,
    nextElapsedSeconds,
    context,
  );

  if (activeIndexes.length <= 0 && kinematicIndexes.length <= 0) {
    const repairedVehicles = repairTrafficCongestionAfterBudgetTick(
      pooledVehicles,
      roads,
      nextElapsedSeconds,
      context,
      options.crosswalks,
    );
    const flowRepairedVehicles = repairHomeDriveTrafficIntersectionAccumulation({
      vehicles: repairedVehicles,
      roads,
      roadsBySegmentId,
      topology,
      options: {
        elapsedSeconds: nextElapsedSeconds,
        activeCenter: context?.activeCenter,
        activeHeadingRad: context?.activeHeadingRad,
        crosswalks: options.crosswalks,
        enabled: context?.profile.congestionGuardEnabled ?? true,
        maxRepairsPerTick: context?.profile.congestionRepairMaxVehiclesPerTick,
      },
    });

    return {
      ...traffic,
      elapsedSeconds: nextElapsedSeconds,
      vehicles: flowRepairedVehicles,
    };
  }

  const movedVehicles = pooledVehicles.slice();

  if (activeIndexes.length > 0) {
    const awarenessIndexes = getAwarenessTrafficVehicleIndexes(
      pooledVehicles,
      activeIndexes,
      kinematicIndexes,
      nextElapsedSeconds,
      context,
    );
    const awarenessTraffic = createActiveTrafficState(
      traffic,
      pooledVehicles,
      awarenessIndexes,
    );
    const awareness = createHomeDriveTrafficAwarenessSnapshot(awarenessTraffic, roads);
    const movedActiveVehicles = activeIndexes.map((vehicleIndex) => {
      const vehicle = pooledVehicles[vehicleIndex];
      const road = roadsBySegmentId.get(vehicle.segmentId);

      if (!road) {
        return vehicle;
      }

      return tickTrafficVehicle(
        vehicle,
        road,
        roads,
        topology,
        deltaSeconds,
        options.crosswalks,
        awareness.decisionsByVehicleId.get(vehicle.id),
      );
    });
    const stabilizedActiveVehicles = stabilizeHomeDriveTrafficLaneSeparation(
      movedActiveVehicles,
      roads,
    );

    activeIndexes.forEach((vehicleIndex, activeIndex) => {
      movedVehicles[vehicleIndex] = stabilizedActiveVehicles[activeIndex];
    });
  }

  kinematicIndexes.forEach((vehicleIndex) => {
    const vehicle = movedVehicles[vehicleIndex] ?? pooledVehicles[vehicleIndex];
    const road = roadsBySegmentId.get(vehicle.segmentId);

    if (!road) {
      return;
    }

    movedVehicles[vehicleIndex] = tickTrafficVehicleKinematic(
      vehicle,
      road,
      roads,
      topology,
      deltaSeconds * Math.max(1, context?.profile.kinematicTickModulo ?? 1),
    );
  });

  const repairedVehicles = repairTrafficCongestionAfterBudgetTick(
    movedVehicles,
    roads,
    nextElapsedSeconds,
    context,
    options.crosswalks,
  );
  const flowRepairedVehicles = repairHomeDriveTrafficIntersectionAccumulation({
    vehicles: repairedVehicles,
    roads,
    roadsBySegmentId,
    topology,
    options: {
      elapsedSeconds: nextElapsedSeconds,
      activeCenter: context?.activeCenter,
      activeHeadingRad: context?.activeHeadingRad,
      crosswalks: options.crosswalks,
      enabled: context?.profile.congestionGuardEnabled ?? true,
      maxRepairsPerTick: context?.profile.congestionRepairMaxVehiclesPerTick,
    },
  });

  return {
    ...traffic,
    elapsedSeconds: nextElapsedSeconds,
    vehicles: flowRepairedVehicles,
  };
}
