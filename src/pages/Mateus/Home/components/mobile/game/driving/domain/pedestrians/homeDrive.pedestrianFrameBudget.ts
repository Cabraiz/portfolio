// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianFrameBudget.ts

import type {
  HomeDrivePedestrianBudgetedValueInput,
  HomeDrivePedestrianFrameBudgetOptions,
  HomeDrivePedestrianFrameBudgetPressure,
  HomeDrivePedestrianFrameBudgetResult,
  HomeDrivePedestrianFrameBudgetState,
} from "./homeDrive.pedestrianFrameBudget.types";

const DEFAULT_TARGET_FPS = 60;
const DEFAULT_SMOOTHING = 0.12;
const DEFAULT_MIN_SNAPSHOT_HZ = 5;
const DEFAULT_MAX_SNAPSHOT_HZ = 10;
const DEFAULT_MIN_SIMULATION_HZ = 4;
const DEFAULT_MAX_SIMULATION_HZ = 7;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getPressure(
  rollingDeltaSeconds: number,
  targetDeltaSeconds: number,
  options: HomeDrivePedestrianFrameBudgetOptions,
): HomeDrivePedestrianFrameBudgetPressure {
  const highMultiplier = Math.max(1.05, options.highPressureMultiplier ?? 1.32);
  const criticalMultiplier = Math.max(
    highMultiplier,
    options.criticalPressureMultiplier ?? 1.68,
  );

  if (rollingDeltaSeconds >= targetDeltaSeconds * criticalMultiplier) {
    return "critical";
  }

  if (rollingDeltaSeconds >= targetDeltaSeconds * highMultiplier) {
    return "high";
  }

  if (rollingDeltaSeconds <= targetDeltaSeconds * 0.72) {
    return "idle";
  }

  return "normal";
}

export function createInitialHomeDrivePedestrianFrameBudgetState(
  targetFps = DEFAULT_TARGET_FPS,
): HomeDrivePedestrianFrameBudgetState {
  const targetDeltaSeconds = 1 / Math.max(1, targetFps);

  return {
    frameIndex: 0,
    lastDeltaSeconds: targetDeltaSeconds,
    rollingDeltaSeconds: targetDeltaSeconds,
    pressure: "normal",
  };
}

export function getHomeDrivePedestrianBudgetedValue(
  input: HomeDrivePedestrianBudgetedValueInput,
): number {
  switch (input.pressure) {
    case "idle":
      return input.idle ?? input.normal;

    case "high":
      return input.high ?? input.normal;

    case "critical":
      return input.critical ?? input.high ?? input.normal;

    case "normal":
    default:
      return input.normal;
  }
}

export function updateHomeDrivePedestrianFrameBudget(
  previousState: HomeDrivePedestrianFrameBudgetState | null | undefined,
  deltaSeconds: number,
  options: HomeDrivePedestrianFrameBudgetOptions = {},
): HomeDrivePedestrianFrameBudgetResult {
  const targetFps = Math.max(1, options.targetFps ?? DEFAULT_TARGET_FPS);
  const targetDeltaSeconds = 1 / targetFps;
  const smoothing = clamp(options.smoothing ?? DEFAULT_SMOOTHING, 0.02, 0.5);
  const safeDeltaSeconds = clamp(deltaSeconds, 0, 0.25);
  const baseState =
    previousState ?? createInitialHomeDrivePedestrianFrameBudgetState(targetFps);
  const rollingDeltaSeconds =
    baseState.rollingDeltaSeconds * (1 - smoothing) + safeDeltaSeconds * smoothing;
  const pressure = getPressure(rollingDeltaSeconds, targetDeltaSeconds, options);

  const minSnapshotHz = Math.max(1, options.minSnapshotHz ?? DEFAULT_MIN_SNAPSHOT_HZ);
  const maxSnapshotHz = Math.max(
    minSnapshotHz,
    options.maxSnapshotHz ?? DEFAULT_MAX_SNAPSHOT_HZ,
  );
  const minSimulationHz = Math.max(
    1,
    options.minSimulationHz ?? DEFAULT_MIN_SIMULATION_HZ,
  );
  const maxSimulationHz = Math.max(
    minSimulationHz,
    options.maxSimulationHz ?? DEFAULT_MAX_SIMULATION_HZ,
  );
  const baseVisiblePedestrians = Math.max(0, options.baseVisiblePedestrians ?? 820);
  const minVisiblePedestrians = Math.max(0, options.minVisiblePedestrians ?? 520);
  const maxVisiblePedestrians = Math.max(
    minVisiblePedestrians,
    options.maxVisiblePedestrians ?? baseVisiblePedestrians,
  );

  const snapshotHz = Math.round(
    clamp(
      getHomeDrivePedestrianBudgetedValue({
        pressure,
        idle: maxSnapshotHz,
        normal: Math.min(maxSnapshotHz, Math.max(minSnapshotHz, 8)),
        high: Math.max(minSnapshotHz, 6),
        critical: minSnapshotHz,
      }),
      minSnapshotHz,
      maxSnapshotHz,
    ),
  );

  const simulationHz = Math.round(
    clamp(
      getHomeDrivePedestrianBudgetedValue({
        pressure,
        idle: maxSimulationHz,
        normal: Math.min(maxSimulationHz, Math.max(minSimulationHz, 6)),
        high: Math.max(minSimulationHz, 5),
        critical: minSimulationHz,
      }),
      minSimulationHz,
      maxSimulationHz,
    ),
  );

  const visiblePedestrianBudget = Math.round(
    clamp(
      getHomeDrivePedestrianBudgetedValue({
        pressure,
        idle: maxVisiblePedestrians,
        normal: baseVisiblePedestrians,
        high: Math.max(minVisiblePedestrians, baseVisiblePedestrians * 0.84),
        critical: minVisiblePedestrians,
      }),
      minVisiblePedestrians,
      maxVisiblePedestrians,
    ),
  );

  const warmTickModulo = Math.round(
    getHomeDrivePedestrianBudgetedValue({
      pressure,
      idle: 2,
      normal: 3,
      high: 4,
      critical: 6,
    }),
  );
  const coldTickModulo = Math.round(
    getHomeDrivePedestrianBudgetedValue({
      pressure,
      idle: 8,
      normal: 10,
      high: 13,
      critical: 18,
    }),
  );

  const state: HomeDrivePedestrianFrameBudgetState = {
    frameIndex: baseState.frameIndex + 1,
    lastDeltaSeconds: safeDeltaSeconds,
    rollingDeltaSeconds,
    pressure,
  };

  return {
    state,
    pressure,
    frameTimeMs: rollingDeltaSeconds * 1000,
    targetFrameTimeMs: targetDeltaSeconds * 1000,
    snapshotHz,
    simulationHz,
    visiblePedestrianBudget,
    warmTickModulo,
    coldTickModulo,
  };
}
