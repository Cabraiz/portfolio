// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.activeIndexes.ts

import {
  getHomeDriveTrafficSpatialRelation,
  getHomeDriveTrafficSimulationPriority,
  shouldKinematicTickHomeDriveTrafficVehicle,
  shouldSimulateHomeDriveTrafficVehicle,
} from "./homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";
import type {
  TrafficRuntimePerformanceContext,
} from "./homeDrive.traffic.recyclePlacement";

export function getActiveTrafficVehicleIndexes(
  vehicles: readonly HomeDriveTrafficVehicle[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext | null,
): readonly number[] {
  if (!context) {
    return vehicles.map((_, index) => index);
  }

  if (!context.profile.frameBudgetEnabled) {
    return vehicles
      .map((vehicle, index) => ({ vehicle, index }))
      .filter(({ vehicle }) =>
        shouldSimulateHomeDriveTrafficVehicle(
          vehicle,
          context.activeCenter,
          context.activeHeadingRad,
          context.activeSpeedMps,
          trafficElapsedSeconds,
          context.profile,
        ),
      )
      .map(({ index }) => index);
  }

  const forcedIndexes: number[] = [];
  const candidates: Array<Readonly<{ index: number; priority: number }>> = [];

  vehicles.forEach((vehicle, index) => {
    if (trafficElapsedSeconds - vehicle.lastCollisionAt <= context.profile.damagedGraceSeconds) {
      forcedIndexes.push(index);
      return;
    }

    const relation = getHomeDriveTrafficSpatialRelation(
      vehicle.position,
      context.activeCenter,
      context.activeHeadingRad,
    );

    if (relation.distanceMeters <= context.profile.forcedCollisionRadiusMeters) {
      forcedIndexes.push(index);
      return;
    }

    if (
      !shouldSimulateHomeDriveTrafficVehicle(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        context.activeSpeedMps,
        trafficElapsedSeconds,
        context.profile,
      )
    ) {
      return;
    }

    candidates.push({
      index,
      priority: getHomeDriveTrafficSimulationPriority(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        context.activeSpeedMps,
        trafficElapsedSeconds,
        context.profile,
      ),
    });
  });

  const forcedSet = new Set(forcedIndexes);
  const remainingBudget = Math.max(
    0,
    context.profile.maxFullSimulationVehiclesPerTick - forcedSet.size,
  );

  const selected = candidates
    .filter((candidate) => !forcedSet.has(candidate.index))
    .sort((first, second) => first.priority - second.priority)
    .slice(0, remainingBudget)
    .map((candidate) => candidate.index);

  return [...forcedIndexes, ...selected];
}

export function getKinematicTrafficVehicleIndexes(
  vehicles: readonly HomeDriveTrafficVehicle[],
  activeIndexes: readonly number[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext | null,
): readonly number[] {
  if (!context || !context.profile.frameBudgetEnabled) {
    return [];
  }

  const activeSet = new Set(activeIndexes);
  const modulo = Math.max(1, context.profile.kinematicTickModulo);
  const tickSerial = Math.floor(trafficElapsedSeconds * 60);
  const candidates: Array<Readonly<{ index: number; priority: number }>> = [];

  vehicles.forEach((vehicle, index) => {
    if (activeSet.has(index)) {
      return;
    }

    if ((index + tickSerial) % modulo !== 0) {
      return;
    }

    if (
      !shouldKinematicTickHomeDriveTrafficVehicle(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        context.activeSpeedMps,
        trafficElapsedSeconds,
        context.profile,
      )
    ) {
      return;
    }

    candidates.push({
      index,
      priority: getHomeDriveTrafficSimulationPriority(
        vehicle,
        context.activeCenter,
        context.activeHeadingRad,
        context.activeSpeedMps,
        trafficElapsedSeconds,
        context.profile,
      ),
    });
  });

  return candidates
    .sort((first, second) => first.priority - second.priority)
    .slice(0, context.profile.maxKinematicVehiclesPerTick)
    .map((candidate) => candidate.index);
}

export function getAwarenessTrafficVehicleIndexes(
  vehicles: readonly HomeDriveTrafficVehicle[],
  activeIndexes: readonly number[],
  kinematicIndexes: readonly number[],
  trafficElapsedSeconds: number,
  context: TrafficRuntimePerformanceContext | null,
): readonly number[] {
  if (!context || !context.profile.frameBudgetEnabled) {
    return vehicles.map((_, index) => index);
  }

  const selectedIndexes = new Set<number>();

  activeIndexes.forEach((index) => selectedIndexes.add(index));
  kinematicIndexes.forEach((index) => selectedIndexes.add(index));

  vehicles.forEach((vehicle, index) => {
    if (selectedIndexes.has(index)) {
      return;
    }

    const relation = getHomeDriveTrafficSpatialRelation(
      vehicle.position,
      context.activeCenter,
      context.activeHeadingRad,
    );

    const recentlyDamaged =
      trafficElapsedSeconds - vehicle.lastCollisionAt <= context.profile.damagedGraceSeconds;
    const hardNear = relation.distanceMeters <= context.profile.activeRadiusMeters * 1.35;
    const visibleStopper =
      relation.distanceMeters <= context.profile.renderCoreRadiusMeters &&
      (vehicle.speedMps <= 2.4 ||
        Boolean(vehicle.yieldingToCrosswalkId) ||
        Boolean(vehicle.followingVehicleId) ||
        vehicle.brakeLightIntensity > 0.45);

    if (recentlyDamaged || hardNear || visibleStopper) {
      selectedIndexes.add(index);
    }
  });

  return [...selectedIndexes];
}

export function createActiveTrafficState(
  traffic: HomeDriveTrafficRuntimeState,
  vehicles: readonly HomeDriveTrafficVehicle[],
  indexes: readonly number[],
): HomeDriveTrafficRuntimeState {
  return {
    ...traffic,
    vehicles: indexes.map((index) => vehicles[index]),
  };
}
