// src/pages/Mateus/Home/components/mobile/game/driving/domain/missions/homeDrive.missionRuntime.ts

import {
  getHomeDriveMissionDestinationById,
  getHomeDriveMissionDestinations,
} from "./homeDrive.missionDestinations";
import { createHomeDriveMissionRoute } from "./homeDrive.missionRoute";
import type {
  HomeDriveMissionDestination,
  HomeDriveMissionDestinationId,
  HomeDriveMissionRuntimeState,
  HomeDriveMissionRuntimeTickInput,
  HomeDriveMissionRuntimeTickResult,
} from "./homeDrive.mission.types";

export type CreateHomeDriveMissionRuntimeOptions = Readonly<{
  seed?: number;
  destinations?: readonly HomeDriveMissionDestination[];
  startedAtSeconds?: number;
  startDestinationId?: HomeDriveMissionDestinationId | null;
}>;

export const HOME_DRIVE_MISSION_DEFAULT_CHECK_IN_HOLD_SECONDS = 0.72;

const VISUAL_TICK_SECONDS = 1 / 20;
const ACTIVE_SECONDS_EPSILON = 0.0001;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function appendUniqueId(
  ids: readonly HomeDriveMissionDestinationId[],
  id: HomeDriveMissionDestinationId,
): readonly HomeDriveMissionDestinationId[] {
  if (ids.includes(id)) {
    return ids;
  }

  return [...ids, id];
}

function areNumbersEquivalent(
  first: number,
  second: number,
  epsilon = ACTIVE_SECONDS_EPSILON,
): boolean {
  return Math.abs(first - second) <= epsilon;
}

function withActiveInsideSeconds(
  runtime: HomeDriveMissionRuntimeState,
  activeInsideSeconds: number,
): HomeDriveMissionRuntimeState {
  if (areNumbersEquivalent(runtime.activeInsideSeconds, activeInsideSeconds)) {
    return runtime;
  }

  return {
    ...runtime,
    activeInsideSeconds,
  };
}

export function createInitialHomeDriveMissionRuntimeState({
  seed,
  destinations = getHomeDriveMissionDestinations(),
  startedAtSeconds = 0,
  startDestinationId = null,
}: CreateHomeDriveMissionRuntimeOptions = {}): HomeDriveMissionRuntimeState {
  const route = createHomeDriveMissionRoute({
    seed,
    destinations,
    startDestinationId,
  });

  return {
    status: route.destinationIds.length > 0 ? "active" : "completed",
    seed: route.seed,
    routeDestinationIds: route.destinationIds,
    activeIndex: 0,
    completedDestinationIds: [],
    activeInsideSeconds: 0,
    startedAtSeconds,
    lastCheckInAtSeconds: null,
    completedAtSeconds: route.destinationIds.length > 0 ? null : startedAtSeconds,
  };
}

export function getHomeDriveMissionActiveDestinationId(
  runtime: HomeDriveMissionRuntimeState,
): HomeDriveMissionDestinationId | null {
  if (runtime.status === "completed") {
    return null;
  }

  return runtime.routeDestinationIds[runtime.activeIndex] ?? null;
}

export function getHomeDriveMissionActiveDestination(
  runtime: HomeDriveMissionRuntimeState,
  destinations: readonly HomeDriveMissionDestination[] = getHomeDriveMissionDestinations(),
): HomeDriveMissionDestination | null {
  const activeDestinationId = getHomeDriveMissionActiveDestinationId(runtime);

  if (!activeDestinationId) {
    return null;
  }

  return getHomeDriveMissionDestinationById(activeDestinationId, destinations);
}

export function getHomeDriveMissionCompletedCount(
  runtime: HomeDriveMissionRuntimeState,
): number {
  return runtime.completedDestinationIds.length;
}

export function getHomeDriveMissionTotalCount(
  runtime: HomeDriveMissionRuntimeState,
): number {
  return runtime.routeDestinationIds.length;
}

export function getHomeDriveMissionProgressRatio(
  runtime: HomeDriveMissionRuntimeState,
): number {
  const total = getHomeDriveMissionTotalCount(runtime);

  if (total <= 0) {
    return 1;
  }

  return clamp01(getHomeDriveMissionCompletedCount(runtime) / total);
}

function completeActiveDestination(params: {
  runtime: HomeDriveMissionRuntimeState;
  destination: HomeDriveMissionDestination;
  elapsedSeconds: number;
}): HomeDriveMissionRuntimeState {
  const completedDestinationIds = appendUniqueId(
    params.runtime.completedDestinationIds,
    params.destination.id,
  );

  const nextIndex = params.runtime.activeIndex + 1;
  const isCompleted = nextIndex >= params.runtime.routeDestinationIds.length;

  return {
    ...params.runtime,
    status: isCompleted ? "completed" : "active",
    activeIndex: nextIndex,
    completedDestinationIds,
    activeInsideSeconds: 0,
    lastCheckInAtSeconds: params.elapsedSeconds,
    completedAtSeconds: isCompleted ? params.elapsedSeconds : null,
  };
}

function createCompletedRuntimeIfNeeded(
  runtime: HomeDriveMissionRuntimeState,
  elapsedSeconds: number,
): HomeDriveMissionRuntimeState {
  if (
    runtime.status === "completed" &&
    runtime.completedAtSeconds !== null &&
    runtime.activeInsideSeconds === 0
  ) {
    return runtime;
  }

  return {
    ...runtime,
    status: "completed",
    activeInsideSeconds: 0,
    completedAtSeconds: runtime.completedAtSeconds ?? elapsedSeconds,
  };
}

export function tickHomeDriveMissionRuntime({
  runtime,
  carPosition,
  elapsedSeconds,
  destinations = getHomeDriveMissionDestinations(),
  checkInHoldSeconds = HOME_DRIVE_MISSION_DEFAULT_CHECK_IN_HOLD_SECONDS,
}: HomeDriveMissionRuntimeTickInput): HomeDriveMissionRuntimeTickResult {
  if (runtime.status === "completed") {
    return {
      runtime,
      activeDestination: null,
      checkedInDestination: null,
      distanceMeters: null,
      isInsideCheckInRadius: false,
      checkInProgress: 1,
    };
  }

  const activeDestination = getHomeDriveMissionActiveDestination(
    runtime,
    destinations,
  );

  if (!activeDestination) {
    const completedRuntime = createCompletedRuntimeIfNeeded(
      runtime,
      elapsedSeconds,
    );

    return {
      runtime: completedRuntime,
      activeDestination: null,
      checkedInDestination: null,
      distanceMeters: null,
      isInsideCheckInRadius: false,
      checkInProgress: 1,
    };
  }

  const distanceMeters = getDistanceMeters(carPosition, activeDestination.position);
  const isInsideCheckInRadius = distanceMeters <= activeDestination.radiusMeters;

  if (!isInsideCheckInRadius) {
    const nextRuntime = withActiveInsideSeconds(runtime, 0);

    return {
      runtime: nextRuntime,
      activeDestination,
      checkedInDestination: null,
      distanceMeters,
      isInsideCheckInRadius: false,
      checkInProgress: 0,
    };
  }

  /*
    Por enquanto o runtime de missão roda pelo snapshot React.
    Então o incremento é estável e controlado, sem depender de setState em loop.
  */
  const stableInsideSeconds = Math.min(
    checkInHoldSeconds,
    runtime.activeInsideSeconds + VISUAL_TICK_SECONDS,
  );

  const checkInProgress = clamp01(
    stableInsideSeconds / Math.max(0.001, checkInHoldSeconds),
  );

  if (checkInProgress >= 1) {
    const completedRuntime = completeActiveDestination({
      runtime,
      destination: activeDestination,
      elapsedSeconds,
    });

    return {
      runtime: completedRuntime,
      activeDestination:
        getHomeDriveMissionActiveDestination(completedRuntime, destinations),
      checkedInDestination: activeDestination,
      distanceMeters,
      isInsideCheckInRadius,
      checkInProgress: 1,
    };
  }

  const nextRuntime = withActiveInsideSeconds(runtime, stableInsideSeconds);

  return {
    runtime: nextRuntime,
    activeDestination,
    checkedInDestination: null,
    distanceMeters,
    isInsideCheckInRadius,
    checkInProgress,
  };
}
