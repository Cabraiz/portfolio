// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianFrameBudget.types.ts

export type HomeDrivePedestrianFrameBudgetPressure =
  | "idle"
  | "normal"
  | "high"
  | "critical";

export type HomeDrivePedestrianFrameBudgetState = Readonly<{
  frameIndex: number;
  lastDeltaSeconds: number;
  rollingDeltaSeconds: number;
  pressure: HomeDrivePedestrianFrameBudgetPressure;
}>;

export type HomeDrivePedestrianFrameBudgetOptions = Readonly<{
  targetFps?: number;
  smoothing?: number;
  highPressureMultiplier?: number;
  criticalPressureMultiplier?: number;

  minSnapshotHz?: number;
  maxSnapshotHz?: number;
  minSimulationHz?: number;
  maxSimulationHz?: number;

  baseVisiblePedestrians?: number;
  minVisiblePedestrians?: number;
  maxVisiblePedestrians?: number;
}>;

export type HomeDrivePedestrianFrameBudgetResult = Readonly<{
  state: HomeDrivePedestrianFrameBudgetState;
  pressure: HomeDrivePedestrianFrameBudgetPressure;
  frameTimeMs: number;
  targetFrameTimeMs: number;
  snapshotHz: number;
  simulationHz: number;
  visiblePedestrianBudget: number;
  warmTickModulo: number;
  coldTickModulo: number;
}>;

export type HomeDrivePedestrianBudgetedValueInput = Readonly<{
  pressure: HomeDrivePedestrianFrameBudgetPressure;
  normal: number;
  high?: number;
  critical?: number;
  idle?: number;
}>;
