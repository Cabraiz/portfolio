// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeDiagnostics.groups.ts
// Grupos de diagnóstico e gargalo.

import { HOME_DRIVE_WORLD_TOGGLES } from "../homeDrive.globalDebugFlags";
import { getHomeDriveTrafficBudgetDiagnostics } from "../homeDrive.trafficBudgetDiagnostics";
import type {
  HomeDriveRuntimeDiagnosticsBottleneck,
  HomeDriveRuntimeDiagnosticsFrameBudget,
  HomeDriveRuntimeDiagnosticsGroup,
  HomeDriveRuntimeDiagnosticsSnapshotInput,
} from "./homeDrive.runtimeDiagnostics.types";
import {
  ENGINE_BASE_KB,
  CAR_BASE_KB,
  TRAFFIC_VEHICLE_KB,
  PARKED_VEHICLE_KB,
  PEDESTRIAN_AGENT_KB,
  PEDESTRIAN_ZONE_KB,
  PEDESTRIAN_POOL_OVERHEAD_KB,
  BUILDING_KB,
  BUILDING_DAMAGE_MARK_KB,
  BUILDING_DESTRUCTION_KB,
  BUILDING_DESTRUCTION_ZONE_KB,
  BUILDING_RUBBLE_KB,
  countDamagedVehicles,
  countImpactedPedestrians,
  countCrossingPedestrians,
  countBuildingRubblePieces,
  countBuildingDestructionZones,
  inferPortraitViewport,
} from "./homeDrive.runtimeDiagnostics.helpers";

export function createEngineGroup(
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

export function createCarsGroup(
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

export function createPedestriansGroup(
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

export function createBuildingsGroup(
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

export function rankGroups(
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

export function createBottleneck(
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
