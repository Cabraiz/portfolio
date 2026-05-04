// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeDiagnostics.types.ts

import type { HomeDriveBuildingCollisionRuntimeState } from "../buildingCollisions";
import type { HomeDriveBuilding } from "../homeDrive.building.types";
import type { HomeDriveTrafficRuntimeState } from "../homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "../homeDrive.types";
import type { HomeDriveParkedVehicleRuntimeState } from "../parkedVehicles";
import type { HomeDrivePedestrianRuntimeState } from "../pedestrians";
import type { HomeDriveRuntimeProfilerSnapshot } from "./homeDrive.runtimeProfiler.types";

export type HomeDriveRuntimeDiagnosticsGroupKey =
  | "engine"
  | "cars"
  | "pedestrians"
  | "buildings";

export type HomeDriveRuntimeDiagnosticsGroupSeverity =
  | "off"
  | "ok"
  | "watch"
  | "suspect"
  | "critical";

export type HomeDriveRuntimeDiagnosticsDetail = Readonly<{
  label: string;
  value: string | number;
  suffix?: string;
}>;

export type HomeDriveRuntimeDiagnosticsGroup = Readonly<{
  key: HomeDriveRuntimeDiagnosticsGroupKey;
  label: string;
  enabled: boolean;
  count: number;
  activeCount: number;
  estimatedMemoryKb: number;
  estimatedWorkUnits: number;
  workSharePercent: number;
  profiledMs: number | null;
  profiledSharePercent: number | null;
  villainScore: number;
  villainRank: number;
  severity: HomeDriveRuntimeDiagnosticsGroupSeverity;
  reasons: readonly string[];
  details: readonly HomeDriveRuntimeDiagnosticsDetail[];
}>;

export type HomeDriveRuntimeDiagnosticsBrowserMemory = Readonly<{
  isSupported: boolean;
  usedJSHeapSizeMb: number | null;
  totalJSHeapSizeMb: number | null;
  jsHeapSizeLimitMb: number | null;
  usagePercent: number | null;
}>;

export type HomeDriveRuntimeDiagnosticsRendererInfo = Readonly<{
  memory: Readonly<{
    geometries: number;
    textures: number;
  }>;
  render: Readonly<{
    calls: number;
    triangles: number;
    points: number;
    lines: number;
  }>;
}>;

export type HomeDriveRuntimeDiagnosticsFrameBudget = Readonly<{
  targetFps: number;
  targetFrameTimeMs: number;
  fpsGap: number;
  frameTimeOverBudgetMs: number;
  budgetUsagePercent: number;
  isBelowTarget: boolean;
}>;

export type HomeDriveRuntimeDiagnosticsToggleSnapshot = Readonly<{
  cars: boolean;
  pedestrians: boolean;
  buildings: boolean;
}>;

export type HomeDriveRuntimeDiagnosticsBottleneck = Readonly<{
  key: HomeDriveRuntimeDiagnosticsGroupKey;
  label: string;
  severity: HomeDriveRuntimeDiagnosticsGroupSeverity;
  score: number;
  reason: string;
}>;

export type HomeDriveRuntimeDiagnosticsSnapshot = Readonly<{
  sampledAtMs: number;
  elapsedSeconds: number;
  fps: number;
  frameTimeMs: number;
  speedMps: number;
  speedKmh: number;
  frameBudget: HomeDriveRuntimeDiagnosticsFrameBudget;
  toggles: HomeDriveRuntimeDiagnosticsToggleSnapshot;
  bottleneck: HomeDriveRuntimeDiagnosticsBottleneck | null;
  groups: readonly HomeDriveRuntimeDiagnosticsGroup[];
  totals: Readonly<{
    entityCount: number;
    activeCount: number;
    estimatedMemoryKb: number;
    estimatedWorkUnits: number;
    measuredCpuMs: number | null;
  }>;
  browserMemory: HomeDriveRuntimeDiagnosticsBrowserMemory;
  renderer: HomeDriveRuntimeDiagnosticsRendererInfo | null;
  profiler: HomeDriveRuntimeProfilerSnapshot | null;
}>;

export type HomeDriveRuntimeDiagnosticsSnapshotInput = Readonly<{
  sampledAtMs: number;
  fps: number;
  frameTimeMs: number;
  runtime: HomeDriveRuntimeState;
  traffic: HomeDriveTrafficRuntimeState;
  parkedVehicles: HomeDriveParkedVehicleRuntimeState;
  pedestrians: HomeDrivePedestrianRuntimeState;
  buildings: readonly HomeDriveBuilding[];
  buildingCollisions: HomeDriveBuildingCollisionRuntimeState;
  renderer: HomeDriveRuntimeDiagnosticsRendererInfo | null;
  profiler: HomeDriveRuntimeProfilerSnapshot | null;
}>;
