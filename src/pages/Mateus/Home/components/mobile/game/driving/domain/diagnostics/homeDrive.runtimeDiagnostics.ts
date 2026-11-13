// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeDiagnostics.ts

import { HOME_DRIVE_WORLD_TOGGLES } from "../homeDrive.globalDebugFlags";
import type {
  HomeDriveRuntimeDiagnosticsSnapshot,
  HomeDriveRuntimeDiagnosticsSnapshotInput,
} from "./homeDrive.runtimeDiagnostics.types";
import {
  round,
  getBrowserMemorySnapshot,
  createFrameBudget,
  withRuntimeSignals,
} from "./homeDrive.runtimeDiagnostics.helpers";
import {
  createEngineGroup,
  createCarsGroup,
  createPedestriansGroup,
  createBuildingsGroup,
  rankGroups,
  createBottleneck,
} from "./homeDrive.runtimeDiagnostics.groups";

export function createHomeDriveRuntimeDiagnosticsSnapshot(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): HomeDriveRuntimeDiagnosticsSnapshot {
  const frameBudget = createFrameBudget(input.fps, input.frameTimeMs);
  const baseGroups = [
    createEngineGroup(input),
    createCarsGroup(input),
    createPedestriansGroup(input),
    createBuildingsGroup(input),
  ];
  const totalWorkUnits = baseGroups.reduce((sum, group) => {
    return sum + group.estimatedWorkUnits;
  }, 0);
  const groups = rankGroups(
    baseGroups.map((group) =>
      withRuntimeSignals(group, input, frameBudget, totalWorkUnits),
    ),
  );

  const estimatedMemoryKb = groups.reduce((sum, group) => {
    return sum + group.estimatedMemoryKb;
  }, 0);
  const estimatedWorkUnits = groups.reduce((sum, group) => {
    return sum + group.estimatedWorkUnits;
  }, 0);
  const entityCount = groups.reduce((sum, group) => {
    return sum + group.count;
  }, 0);
  const activeCount = groups.reduce((sum, group) => {
    return sum + group.activeCount;
  }, 0);

  return {
    sampledAtMs: input.sampledAtMs,
    elapsedSeconds: input.runtime.elapsedSeconds,
    fps: round(input.fps, 1),
    frameTimeMs: round(input.frameTimeMs, 1),
    speedMps: round(input.runtime.car.speedMps, 2),
    speedKmh: round(input.runtime.car.speedMps * 3.6, 1),
    frameBudget,
    toggles: HOME_DRIVE_WORLD_TOGGLES,
    bottleneck: createBottleneck(groups, frameBudget),
    groups,
    totals: {
      entityCount,
      activeCount,
      estimatedMemoryKb: round(estimatedMemoryKb, 1),
      estimatedWorkUnits: round(estimatedWorkUnits, 1),
      measuredCpuMs: input.profiler ? round(input.profiler.totalMeasuredMs, 2) : null,
    },
    browserMemory: getBrowserMemorySnapshot(),
    renderer: input.renderer,
    profiler: input.profiler,
  };
}
