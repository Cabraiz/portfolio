// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeDiagnostics.helpers.ts
// Constantes, contagens e sinais de runtime.

import { HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS } from "../homeDrive.globalDebugFlags";
import type { HomeDriveRuntimeProfilerSectionKey } from "./homeDrive.runtimeProfiler.types";
import type {
  HomeDriveRuntimeDiagnosticsBrowserMemory,
  HomeDriveRuntimeDiagnosticsFrameBudget,
  HomeDriveRuntimeDiagnosticsGroup,
  HomeDriveRuntimeDiagnosticsGroupKey,
  HomeDriveRuntimeDiagnosticsGroupSeverity,
  HomeDriveRuntimeDiagnosticsSnapshotInput,
} from "./homeDrive.runtimeDiagnostics.types";

type PerformanceMemorySnapshot = Readonly<{
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}>;

type PerformanceWithOptionalMemory = Performance & Readonly<{
  memory?: PerformanceMemorySnapshot;
}>;

const BYTES_PER_MB = 1024 * 1024;

export const ENGINE_BASE_KB = 128;
export const CAR_BASE_KB = 2.4;
export const TRAFFIC_VEHICLE_KB = 6.4;
export const PARKED_VEHICLE_KB = 5.6;

export const PEDESTRIAN_AGENT_KB = 8.2;
export const PEDESTRIAN_ZONE_KB = 1.7;
export const PEDESTRIAN_POOL_OVERHEAD_KB = 0.9;

export const BUILDING_KB = 5.4;
export const BUILDING_DAMAGE_MARK_KB = 1.2;
export const BUILDING_DESTRUCTION_KB = 13.5;
export const BUILDING_DESTRUCTION_ZONE_KB = 4.5;
export const BUILDING_RUBBLE_KB = 1.35;

const TARGET_FRAME_TIME_MS = 1000 / HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS;

const GROUP_SECTION_KEYS: Readonly<
  Record<HomeDriveRuntimeDiagnosticsGroupKey, readonly HomeDriveRuntimeProfilerSectionKey[]>
> = Object.freeze({
  engine: ["physics"],
  cars: ["traffic", "parkedVehicles"],
  pedestrians: ["pedestrians"],
  buildings: ["buildings", "urbanFixtures"],
});

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function round(value: number, precision = 1): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}

export function countDamagedVehicles<T extends Readonly<{ damage: number }>>(
  vehicles: readonly T[],
): number {
  return vehicles.reduce((count, vehicle) => {
    return count + (vehicle.damage > 0.01 ? 1 : 0);
  }, 0);
}

export function countImpactedPedestrians(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  const nowSeconds = input.runtime.elapsedSeconds;

  return input.pedestrians.agents.reduce((count, agent) => {
    const hasActiveImpact = Boolean(agent.pedestrianImpact);
    const isCollisionLocked =
      typeof agent.collisionLockedUntilSeconds === "number" &&
      agent.collisionLockedUntilSeconds > nowSeconds;

    return count + (hasActiveImpact || isCollisionLocked ? 1 : 0);
  }, 0);
}

export function countCrossingPedestrians(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.pedestrians.agents.reduce((count, agent) => {
    return count + (agent.crosswalkId ? 1 : 0);
  }, 0);
}

export function countBuildingRubblePieces(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.buildingCollisions.destructions.reduce((count, destruction) => {
    return count + destruction.rubble.length;
  }, 0);
}

export function countBuildingDestructionZones(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.buildingCollisions.destructions.reduce((count, destruction) => {
    return count + destruction.zones.length;
  }, 0);
}

export function getBrowserMemorySnapshot(): HomeDriveRuntimeDiagnosticsBrowserMemory {
  if (typeof performance === "undefined") {
    return {
      isSupported: false,
      usedJSHeapSizeMb: null,
      totalJSHeapSizeMb: null,
      jsHeapSizeLimitMb: null,
      usagePercent: null,
    };
  }

  const memory = (performance as PerformanceWithOptionalMemory).memory;

  if (!memory) {
    return {
      isSupported: false,
      usedJSHeapSizeMb: null,
      totalJSHeapSizeMb: null,
      jsHeapSizeLimitMb: null,
      usagePercent: null,
    };
  }

  const usedJSHeapSizeMb = memory.usedJSHeapSize / BYTES_PER_MB;
  const totalJSHeapSizeMb = memory.totalJSHeapSize / BYTES_PER_MB;
  const jsHeapSizeLimitMb = memory.jsHeapSizeLimit / BYTES_PER_MB;
  const usagePercent =
    jsHeapSizeLimitMb > 0 ? (usedJSHeapSizeMb / jsHeapSizeLimitMb) * 100 : null;

  return {
    isSupported: true,
    usedJSHeapSizeMb: round(usedJSHeapSizeMb, 1),
    totalJSHeapSizeMb: round(totalJSHeapSizeMb, 1),
    jsHeapSizeLimitMb: round(jsHeapSizeLimitMb, 0),
    usagePercent: usagePercent === null ? null : round(usagePercent, 1),
  };
}

export function inferPortraitViewport(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.innerHeight >= window.innerWidth;
}

export function createFrameBudget(
  fps: number,
  frameTimeMs: number,
): HomeDriveRuntimeDiagnosticsFrameBudget {
  const safeFps = Math.max(0, fps);
  const safeFrameTimeMs = Math.max(0, frameTimeMs);
  const frameTimeOverBudgetMs = Math.max(0, safeFrameTimeMs - TARGET_FRAME_TIME_MS);

  return {
    targetFps: HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS,
    targetFrameTimeMs: round(TARGET_FRAME_TIME_MS, 2),
    fpsGap: round(Math.max(0, HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS - safeFps), 1),
    frameTimeOverBudgetMs: round(frameTimeOverBudgetMs, 2),
    budgetUsagePercent: round((safeFrameTimeMs / TARGET_FRAME_TIME_MS) * 100, 1),
    isBelowTarget: safeFps < HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS - 1,
  };
}

function getProfiledMsForGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
  groupKey: HomeDriveRuntimeDiagnosticsGroupKey,
): number | null {
  const profiler = input.profiler;

  if (!profiler || profiler.sections.length <= 0) {
    return null;
  }

  const sectionKeys = GROUP_SECTION_KEYS[groupKey];
  const totalMs = profiler.sections.reduce((sum, section) => {
    return sum + (sectionKeys.includes(section.key) ? section.totalMs : 0);
  }, 0);

  return round(totalMs, 2);
}

function getProfiledShareForGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
  groupKey: HomeDriveRuntimeDiagnosticsGroupKey,
): number | null {
  const profiler = input.profiler;
  const profiledMs = getProfiledMsForGroup(input, groupKey);

  if (!profiler || profiledMs === null || profiler.totalMeasuredMs <= 0) {
    return null;
  }

  return round((profiledMs / profiler.totalMeasuredMs) * 100, 1);
}

function createReasons(options: Readonly<{
  enabled: boolean;
  groupKey: HomeDriveRuntimeDiagnosticsGroupKey;
  workSharePercent: number;
  profiledSharePercent: number | null;
  profiledMs: number | null;
  activeCount: number;
  count: number;
  frameBudget: HomeDriveRuntimeDiagnosticsFrameBudget;
  rendererCalls?: number;
  triangles?: number;
}>): readonly string[] {
  if (!options.enabled) {
    return ["Desligado nos toggles reais do mundo em homeDrive.globalDebugFlags.ts."];
  }

  const reasons: string[] = [];

  if (options.profiledMs !== null && options.profiledMs > 0) {
    reasons.push(
      `Tempo medido ${round(options.profiledMs, 2)} ms/janela (${round(
        options.profiledSharePercent ?? 0,
        1,
      )}% do CPU medido).`,
    );
  } else {
    reasons.push(
      `Sem amostra própria ainda; usando peso estimado (${round(
        options.workSharePercent,
        1,
      )}%).`,
    );
  }

  if (options.frameBudget.isBelowTarget) {
    reasons.push(
      `Frame acima do orçamento por ${round(
        options.frameBudget.frameTimeOverBudgetMs,
        2,
      )} ms para 60 FPS.`,
    );
  }

  if (options.activeCount > 180 && options.groupKey !== "engine") {
    reasons.push(`${options.activeCount} itens ativos podem pressionar CPU/render.`);
  }

  if (options.rendererCalls && options.rendererCalls > 360) {
    reasons.push(`${options.rendererCalls} draw calls indicam pressão de GPU/render.`);
  }

  if (options.triangles && options.triangles > 450_000) {
    reasons.push(`${options.triangles} triângulos no frame indicam geometria pesada.`);
  }

  return reasons.slice(0, 3);
}

function getSeverity(
  enabled: boolean,
  villainScore: number,
  frameBudget: HomeDriveRuntimeDiagnosticsFrameBudget,
): HomeDriveRuntimeDiagnosticsGroupSeverity {
  if (!enabled) {
    return "off";
  }

  if (!frameBudget.isBelowTarget) {
    return villainScore >= 55 ? "watch" : "ok";
  }

  if (villainScore >= 58) {
    return "critical";
  }

  if (villainScore >= 34) {
    return "suspect";
  }

  if (villainScore >= 18) {
    return "watch";
  }

  return "ok";
}

export function withRuntimeSignals(
  group: Omit<
    HomeDriveRuntimeDiagnosticsGroup,
    | "workSharePercent"
    | "profiledMs"
    | "profiledSharePercent"
    | "villainScore"
    | "villainRank"
    | "severity"
    | "reasons"
  >,
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
  frameBudget: HomeDriveRuntimeDiagnosticsFrameBudget,
  totalWorkUnits: number,
): HomeDriveRuntimeDiagnosticsGroup {
  const workSharePercent =
    totalWorkUnits > 0
      ? round(clamp((group.estimatedWorkUnits / totalWorkUnits) * 100, 0, 100), 1)
      : 0;
  const profiledMs = getProfiledMsForGroup(input, group.key);
  const profiledSharePercent = getProfiledShareForGroup(input, group.key);
  const measuredShare = profiledSharePercent ?? workSharePercent;
  const pressureMultiplier = frameBudget.isBelowTarget ? 1.25 : 0.72;
  const activityPressure = clamp(group.activeCount / 360, 0, 1) * 8;
  const renderPressure =
    group.key === "engine" && input.renderer
      ? clamp(input.renderer.render.calls / 640, 0, 1) * 16
      : 0;
  const villainScore = group.enabled
    ? round(clamp(measuredShare * pressureMultiplier + activityPressure + renderPressure, 0, 100), 1)
    : 0;
  const severity = getSeverity(group.enabled, villainScore, frameBudget);
  const reasons = createReasons({
    enabled: group.enabled,
    groupKey: group.key,
    workSharePercent,
    profiledSharePercent,
    profiledMs,
    activeCount: group.activeCount,
    count: group.count,
    frameBudget,
    rendererCalls: group.key === "engine" ? input.renderer?.render.calls : undefined,
    triangles: group.key === "engine" ? input.renderer?.render.triangles : undefined,
  });

  return {
    ...group,
    estimatedMemoryKb: round(group.estimatedMemoryKb, 1),
    estimatedWorkUnits: round(group.estimatedWorkUnits, 1),
    workSharePercent,
    profiledMs,
    profiledSharePercent,
    villainScore,
    villainRank: 0,
    severity,
    reasons,
  };
}
