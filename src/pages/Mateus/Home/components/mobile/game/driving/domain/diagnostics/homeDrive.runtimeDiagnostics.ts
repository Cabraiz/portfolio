// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeDiagnostics.ts

import {
  HOME_DRIVE_WORLD_TOGGLES,
  HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS,
} from "../homeDrive.globalDebugFlags";
import { getHomeDriveTrafficBudgetDiagnostics } from "../homeDrive.trafficBudgetDiagnostics";
import type { HomeDriveRuntimeProfilerSectionKey } from "./homeDrive.runtimeProfiler.types";
import type {
  HomeDriveRuntimeDiagnosticsBottleneck,
  HomeDriveRuntimeDiagnosticsBrowserMemory,
  HomeDriveRuntimeDiagnosticsFrameBudget,
  HomeDriveRuntimeDiagnosticsGroup,
  HomeDriveRuntimeDiagnosticsGroupKey,
  HomeDriveRuntimeDiagnosticsGroupSeverity,
  HomeDriveRuntimeDiagnosticsSnapshot,
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

const ENGINE_BASE_KB = 128;
const CAR_BASE_KB = 2.4;
const TRAFFIC_VEHICLE_KB = 6.4;
const PARKED_VEHICLE_KB = 5.6;

const PEDESTRIAN_AGENT_KB = 8.2;
const PEDESTRIAN_ZONE_KB = 1.7;
const PEDESTRIAN_POOL_OVERHEAD_KB = 0.9;

const BUILDING_KB = 5.4;
const BUILDING_DAMAGE_MARK_KB = 1.2;
const BUILDING_DESTRUCTION_KB = 13.5;
const BUILDING_DESTRUCTION_ZONE_KB = 4.5;
const BUILDING_RUBBLE_KB = 1.35;

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

function round(value: number, precision = 1): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}

function countDamagedVehicles<T extends Readonly<{ damage: number }>>(
  vehicles: readonly T[],
): number {
  return vehicles.reduce((count, vehicle) => {
    return count + (vehicle.damage > 0.01 ? 1 : 0);
  }, 0);
}

function countImpactedPedestrians(
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

function countCrossingPedestrians(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.pedestrians.agents.reduce((count, agent) => {
    return count + (agent.crosswalkId ? 1 : 0);
  }, 0);
}

function countBuildingRubblePieces(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.buildingCollisions.destructions.reduce((count, destruction) => {
    return count + destruction.rubble.length;
  }, 0);
}

function countBuildingDestructionZones(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): number {
  return input.buildingCollisions.destructions.reduce((count, destruction) => {
    return count + destruction.zones.length;
  }, 0);
}

function getBrowserMemorySnapshot(): HomeDriveRuntimeDiagnosticsBrowserMemory {
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

function inferPortraitViewport(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.innerHeight >= window.innerWidth;
}

function createFrameBudget(
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

function withRuntimeSignals(
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

function createEngineGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): Omit<
  HomeDriveRuntimeDiagnosticsGroup,
  | "workSharePercent"
  | "profiledMs"
  | "profiledSharePercent"
  | "villainScore"
  | "villainRank"
  | "severity"
  | "reasons"
> {
  const renderer = input.renderer;
  const drawCalls = renderer?.render.calls ?? 0;
  const triangles = renderer?.render.triangles ?? 0;
  const geometries = renderer?.memory.geometries ?? 0;
  const textures = renderer?.memory.textures ?? 0;
  const estimatedWorkUnits =
    8 + drawCalls * 0.018 + triangles / 120_000 + geometries * 0.012 + textures * 0.02;

  return {
    key: "engine",
    label: "Motor/base",
    enabled: true,
    count: 1,
    activeCount: 1,
    estimatedMemoryKb: ENGINE_BASE_KB,
    estimatedWorkUnits,
    details: [
      {
        label: "draw calls",
        value: drawCalls,
      },
      {
        label: "triângulos",
        value: triangles,
      },
      {
        label: "geometrias",
        value: geometries,
      },
      {
        label: "texturas",
        value: textures,
      },
    ],
  };
}

function createCarsGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): Omit<
  HomeDriveRuntimeDiagnosticsGroup,
  | "workSharePercent"
  | "profiledMs"
  | "profiledSharePercent"
  | "villainScore"
  | "villainRank"
  | "severity"
  | "reasons"
> {
  const enabled = HOME_DRIVE_WORLD_TOGGLES.cars;
  const movingVehicleCount = enabled ? input.traffic.vehicles.length : 0;
  const parkedVehicleCount = enabled ? input.parkedVehicles.vehicles.length : 0;
  const damagedMovingVehicleCount = enabled
    ? countDamagedVehicles(input.traffic.vehicles)
    : 0;
  const damagedParkedVehicleCount = enabled
    ? countDamagedVehicles(input.parkedVehicles.vehicles)
    : 0;
  const activeTraffic = enabled
    ? getHomeDriveTrafficBudgetDiagnostics({
        traffic: input.traffic,
        runtime: input.runtime,
        isPortrait: inferPortraitViewport(),
      })
    : {
        fullSimulation: 0,
        rendered: 0,
        coldPool: 0,
      };
  const count = 1 + movingVehicleCount + parkedVehicleCount;
  const activeCount = 1 + activeTraffic.fullSimulation + activeTraffic.rendered;
  const estimatedMemoryKb = enabled
    ? CAR_BASE_KB +
      movingVehicleCount * TRAFFIC_VEHICLE_KB +
      parkedVehicleCount * PARKED_VEHICLE_KB
    : CAR_BASE_KB;
  const estimatedWorkUnits = enabled
    ? 1.8 +
      activeTraffic.fullSimulation * 1.46 +
      activeTraffic.rendered * 0.34 +
      activeTraffic.coldPool * 0.035 +
      parkedVehicleCount * 0.18
    : 1.8;

  return {
    key: "cars",
    label: "Carros",
    enabled,
    count,
    activeCount,
    estimatedMemoryKb,
    estimatedWorkUnits,
    details: [
      {
        label: "player",
        value: 1,
      },
      {
        label: "andando",
        value: movingVehicleCount,
      },
      {
        label: "IA cheia",
        value: activeTraffic.fullSimulation,
      },
      {
        label: "renderizados",
        value: activeTraffic.rendered,
      },
      {
        label: "parados",
        value: parkedVehicleCount,
      },
      {
        label: "danificados",
        value: damagedMovingVehicleCount + damagedParkedVehicleCount,
      },
    ],
  };
}

function createPedestriansGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): Omit<
  HomeDriveRuntimeDiagnosticsGroup,
  | "workSharePercent"
  | "profiledMs"
  | "profiledSharePercent"
  | "villainScore"
  | "villainRank"
  | "severity"
  | "reasons"
> {
  const enabled = HOME_DRIVE_WORLD_TOGGLES.pedestrians;
  const agentCount = enabled ? input.pedestrians.agents.length : 0;
  const zoneCount = enabled ? input.pedestrians.zones.length : 0;
  const impactedCount = enabled ? countImpactedPedestrians(input) : 0;
  const crossingCount = enabled ? countCrossingPedestrians(input) : 0;
  const residentDiagnostics = enabled
    ? input.pedestrians.populationRuntime?.residentPoolDiagnostics
    : undefined;
  const residentPoolSize = residentDiagnostics?.requestedPoolSize ?? agentCount;
  const lockedCount = residentDiagnostics?.collisionLockedCount ?? impactedCount;
  const estimatedMemoryKb = enabled
    ? agentCount * PEDESTRIAN_AGENT_KB +
      zoneCount * PEDESTRIAN_ZONE_KB +
      residentPoolSize * PEDESTRIAN_POOL_OVERHEAD_KB
    : 0;
  const estimatedWorkUnits = enabled
    ? agentCount * 1.58 +
      crossingCount * 0.6 +
      impactedCount * 1.85 +
      Math.max(0, residentPoolSize - agentCount) * 0.28
    : 0;

  return {
    key: "pedestrians",
    label: "Pedestres",
    enabled,
    count: agentCount,
    activeCount: Math.max(agentCount, residentPoolSize),
    estimatedMemoryKb,
    estimatedWorkUnits,
    details: [
      {
        label: "agentes",
        value: agentCount,
      },
      {
        label: "zonas",
        value: zoneCount,
      },
      {
        label: "pool",
        value: residentPoolSize,
      },
      {
        label: "colisão lock",
        value: lockedCount,
      },
      {
        label: "travessia",
        value: crossingCount,
      },
    ],
  };
}

function createBuildingsGroup(
  input: HomeDriveRuntimeDiagnosticsSnapshotInput,
): Omit<
  HomeDriveRuntimeDiagnosticsGroup,
  | "workSharePercent"
  | "profiledMs"
  | "profiledSharePercent"
  | "villainScore"
  | "villainRank"
  | "severity"
  | "reasons"
> {
  const enabled = HOME_DRIVE_WORLD_TOGGLES.buildings;
  const buildingCount = enabled ? input.buildings.length : 0;
  const markCount = enabled ? input.buildingCollisions.marks.length : 0;
  const destructionCount = enabled ? input.buildingCollisions.destructions.length : 0;
  const destructionZoneCount = enabled ? countBuildingDestructionZones(input) : 0;
  const rubbleCount = enabled ? countBuildingRubblePieces(input) : 0;
  const estimatedMemoryKb = enabled
    ? buildingCount * BUILDING_KB +
      markCount * BUILDING_DAMAGE_MARK_KB +
      destructionCount * BUILDING_DESTRUCTION_KB +
      destructionZoneCount * BUILDING_DESTRUCTION_ZONE_KB +
      rubbleCount * BUILDING_RUBBLE_KB
    : 0;
  const estimatedWorkUnits = enabled
    ? buildingCount * 0.24 +
      markCount * 0.32 +
      destructionCount * 2.3 +
      destructionZoneCount * 0.8 +
      rubbleCount * 0.42
    : 0;

  return {
    key: "buildings",
    label: "Prédios",
    enabled,
    count: buildingCount,
    activeCount: buildingCount + destructionCount + rubbleCount,
    estimatedMemoryKb,
    estimatedWorkUnits,
    details: [
      {
        label: "bases",
        value: buildingCount,
      },
      {
        label: "danificados",
        value: destructionCount,
      },
      {
        label: "buracos",
        value: destructionZoneCount,
      },
      {
        label: "pedregulhos",
        value: rubbleCount,
      },
    ],
  };
}

function rankGroups(
  groups: readonly HomeDriveRuntimeDiagnosticsGroup[],
): readonly HomeDriveRuntimeDiagnosticsGroup[] {
  const rankedKeys = [...groups]
    .filter((group) => group.enabled)
    .sort((first, second) => second.villainScore - first.villainScore)
    .map((group) => group.key);

  return groups.map((group) => ({
    ...group,
    villainRank: group.enabled ? rankedKeys.indexOf(group.key) + 1 : 0,
  }));
}

function createBottleneck(
  groups: readonly HomeDriveRuntimeDiagnosticsGroup[],
  frameBudget: HomeDriveRuntimeDiagnosticsFrameBudget,
): HomeDriveRuntimeDiagnosticsBottleneck | null {
  if (!frameBudget.isBelowTarget) {
    return null;
  }

  const topGroup = [...groups]
    .filter((group) => group.enabled)
    .sort((first, second) => second.villainScore - first.villainScore)[0];

  if (!topGroup) {
    return null;
  }

  const firstReason = topGroup.reasons[0] ?? "Maior score de pressão no frame atual.";

  return {
    key: topGroup.key,
    label: topGroup.label,
    severity: topGroup.severity,
    score: topGroup.villainScore,
    reason: firstReason,
  };
}

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
