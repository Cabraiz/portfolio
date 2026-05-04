// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficPerformance.ts

import {
  HOME_DRIVE_TRAFFIC_DISTANCE_DETAIL_BUDGET_ENABLED,
  HOME_DRIVE_TRAFFIC_CONGESTION_GUARD_ENABLED,
  HOME_DRIVE_TRAFFIC_FRAME_BUDGET_ENABLED,
  HOME_DRIVE_TRAFFIC_PACK_VISIBLE_INSTANCES_ENABLED,
  HOME_DRIVE_TRAFFIC_RENDER_CULLING_ENABLED,
  HOME_DRIVE_TRAFFIC_RENDER_MASK_HZ,
  HOME_DRIVE_TRAFFIC_RUNTIME_RECYCLING_ENABLED,
} from "./homeDrive.globalDebugFlags";
import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import type { HomeDriveVector2 } from "./homeDrive.types";

export type HomeDriveTrafficRenderTier = "hidden" | "body" | "core" | "full";

export type HomeDriveTrafficPerformanceProfile = Readonly<{
  runtimeRecyclingEnabled: boolean;
  frameBudgetEnabled: boolean;
  renderCullingEnabled: boolean;
  packVisibleInstancesEnabled: boolean;
  distanceDetailBudgetEnabled: boolean;
  congestionGuardEnabled: boolean;

  activeRadiusMeters: number;
  activeForwardMeters: number;
  activeBehindMeters: number;
  activeSideMeters: number;
  activeHardDistanceMeters: number;
  damagedGraceSeconds: number;

  maxFullSimulationVehiclesPerTick: number;
  maxKinematicVehiclesPerTick: number;
  kinematicTickModulo: number;
  forcedCollisionRadiusMeters: number;

  recycleBehindMeters: number;
  recycleSideMeters: number;
  recycleDistanceMeters: number;
  recycleForwardMinMeters: number;
  recycleForwardMaxMeters: number;
  recycleSideMaxMeters: number;
  recycleMinPlayerDistanceMeters: number;
  maxTeleportsPerTick: number;

  renderFullRadiusMeters: number;
  renderCoreRadiusMeters: number;
  renderBodyRadiusMeters: number;
  renderNearRadiusMeters: number;
  renderForwardMeters: number;
  renderBehindMeters: number;
  renderSideMeters: number;
  renderHardDistanceMeters: number;
  renderMaxVisibleVehicles: number;
  renderMaskHz: number;

  collisionCandidateRadiusMeters: number;

  congestionRepairMaxVehiclesPerTick: number;
  congestionRecycleMaxVehiclesPerTick: number;
  congestionHardGapRatio: number;
  stuckRescueMinSpeedMps: number;
  stuckRescueDistanceMeters: number;
}>;

export type HomeDriveTrafficSpatialRelation = Readonly<{
  dx: number;
  dz: number;
  forwardMeters: number;
  rightMeters: number;
  lateralAbsMeters: number;
  distanceMeters: number;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getSpeedHorizonBoostMeters(speedMps: number): number {
  return clamp(Math.abs(speedMps) * 5.4, 0, 150);
}

export function getHomeDriveTrafficPerformanceProfile(
  isPortrait: boolean,
): HomeDriveTrafficPerformanceProfile {
  const portrait = Boolean(isPortrait);

  return {
    runtimeRecyclingEnabled: HOME_DRIVE_TRAFFIC_RUNTIME_RECYCLING_ENABLED,
    frameBudgetEnabled: HOME_DRIVE_TRAFFIC_FRAME_BUDGET_ENABLED,
    renderCullingEnabled: HOME_DRIVE_TRAFFIC_RENDER_CULLING_ENABLED,
    packVisibleInstancesEnabled: HOME_DRIVE_TRAFFIC_PACK_VISIBLE_INSTANCES_ENABLED,
    distanceDetailBudgetEnabled: HOME_DRIVE_TRAFFIC_DISTANCE_DETAIL_BUDGET_ENABLED,
    congestionGuardEnabled: HOME_DRIVE_TRAFFIC_CONGESTION_GUARD_ENABLED,

    /*
      Janela de IA completa. Antes era grande demais e mantinha centenas de
      veículos rodando awareness/lane-change mesmo fora da tela vertical mobile.
    */
    activeRadiusMeters: portrait ? 96 : 132,
    activeForwardMeters: portrait ? 260 : 340,
    activeBehindMeters: portrait ? 48 : 70,
    activeSideMeters: portrait ? 108 : 155,
    activeHardDistanceMeters: portrait ? 380 : 520,
    damagedGraceSeconds: 3.4,

    /*
      Orçamento fixo: número de carros renderizados pode continuar alto, mas IA
      completa fica controlada. Cinemática barata mantém fluxo sem O(N) caro.
    */
    maxFullSimulationVehiclesPerTick: portrait ? 58 : 92,
    maxKinematicVehiclesPerTick: portrait ? 128 : 190,
    kinematicTickModulo: portrait ? 3 : 2,
    forcedCollisionRadiusMeters: portrait ? 46 : 58,

    recycleBehindMeters: portrait ? 250 : 340,
    recycleSideMeters: portrait ? 430 : 600,
    recycleDistanceMeters: portrait ? 620 : 860,
    recycleForwardMinMeters: portrait ? 145 : 210,
    recycleForwardMaxMeters: portrait ? 460 : 640,
    recycleSideMaxMeters: portrait ? 170 : 250,
    recycleMinPlayerDistanceMeters: portrait ? 128 : 170,
    maxTeleportsPerTick: portrait ? 5 : 7,

    /*
      Render em tiers. A câmera 9:16 não justifica atualizar farol, retrovisor,
      acessórios e interior de todos os carros fora do miolo de leitura.
    */
    renderFullRadiusMeters: portrait ? 92 : 132,
    renderCoreRadiusMeters: portrait ? 175 : 250,
    renderBodyRadiusMeters: portrait ? 330 : 470,
    renderNearRadiusMeters: portrait ? 105 : 145,
    renderForwardMeters: portrait ? 430 : 620,
    renderBehindMeters: portrait ? 74 : 108,
    renderSideMeters: portrait ? 185 : 285,
    renderHardDistanceMeters: portrait ? 540 : 760,
    renderMaxVisibleVehicles: portrait ? 154 : 240,
    renderMaskHz: Math.max(1, Math.min(12, HOME_DRIVE_TRAFFIC_RENDER_MASK_HZ)),

    collisionCandidateRadiusMeters: portrait ? 38 : 50,

    /*
      Anti-acúmulo pós-budget. Não reduz pool nem simplifica modelo; apenas
      impede que reciclagem/orçamento crie pilhas paradas na mesma faixa.
    */
    congestionRepairMaxVehiclesPerTick: portrait ? 14 : 22,
    congestionRecycleMaxVehiclesPerTick: portrait ? 3 : 4,
    congestionHardGapRatio: 0.46,
    stuckRescueMinSpeedMps: portrait ? 4.8 : 5.4,
    stuckRescueDistanceMeters: portrait ? 68 : 92,
  };
}

export function getHomeDriveTrafficSpatialRelation(
  point: HomeDriveVector2,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
): HomeDriveTrafficSpatialRelation {
  const heading = Number.isFinite(activeHeadingRad) ? activeHeadingRad : 0;
  const forwardX = Math.sin(heading);
  const forwardZ = Math.cos(heading);
  const rightX = Math.cos(heading);
  const rightZ = -Math.sin(heading);
  const dx = point.x - activeCenter.x;
  const dz = point.z - activeCenter.z;
  const forwardMeters = dx * forwardX + dz * forwardZ;
  const rightMeters = dx * rightX + dz * rightZ;

  return {
    dx,
    dz,
    forwardMeters,
    rightMeters,
    lateralAbsMeters: Math.abs(rightMeters),
    distanceMeters: Math.hypot(dx, dz),
  };
}

export function getHomeDriveTrafficSimulationPriority(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): number {
  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );
  const recentlyDamaged = elapsedSeconds - vehicle.lastCollisionAt <= profile.damagedGraceSeconds;
  const collisionUrgency = relation.distanceMeters <= profile.forcedCollisionRadiusMeters
    ? -1000
    : 0;
  const forwardPreference = relation.forwardMeters >= 0 ? relation.forwardMeters * -0.18 : Math.abs(relation.forwardMeters) * 0.65;
  const speedBoost = getSpeedHorizonBoostMeters(activeSpeedMps) * -0.08;
  const damageBoost = recentlyDamaged ? -850 : 0;

  return (
    collisionUrgency +
    damageBoost +
    relation.distanceMeters +
    relation.lateralAbsMeters * 0.72 +
    forwardPreference +
    speedBoost
  );
}

export function shouldSimulateHomeDriveTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  if (!profile.runtimeRecyclingEnabled || !profile.frameBudgetEnabled) {
    return true;
  }

  if (elapsedSeconds - vehicle.lastCollisionAt <= profile.damagedGraceSeconds) {
    return true;
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );
  const speedBoost = getSpeedHorizonBoostMeters(activeSpeedMps);

  if (relation.distanceMeters <= profile.activeRadiusMeters) {
    return true;
  }

  if (relation.distanceMeters > profile.activeHardDistanceMeters + speedBoost) {
    return false;
  }

  return (
    relation.forwardMeters >= -profile.activeBehindMeters &&
    relation.forwardMeters <= profile.activeForwardMeters + speedBoost &&
    relation.lateralAbsMeters <= profile.activeSideMeters
  );
}

export function shouldKinematicTickHomeDriveTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  if (!profile.runtimeRecyclingEnabled || !profile.frameBudgetEnabled) {
    return false;
  }

  if (elapsedSeconds - vehicle.lastCollisionAt <= profile.damagedGraceSeconds) {
    return false;
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );
  const speedBoost = getSpeedHorizonBoostMeters(activeSpeedMps);

  if (relation.distanceMeters <= profile.renderCoreRadiusMeters) {
    return true;
  }

  return (
    relation.forwardMeters >= -profile.renderBehindMeters &&
    relation.forwardMeters <= profile.renderForwardMeters + speedBoost &&
    relation.lateralAbsMeters <= profile.renderSideMeters &&
    relation.distanceMeters <= profile.renderHardDistanceMeters + speedBoost
  );
}

export function shouldRecycleHomeDriveTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  elapsedSeconds: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  if (!profile.runtimeRecyclingEnabled) {
    return false;
  }

  if (elapsedSeconds - vehicle.lastCollisionAt <= profile.damagedGraceSeconds) {
    return false;
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );
  const speedBoost = getSpeedHorizonBoostMeters(activeSpeedMps) * 0.32;

  if (relation.distanceMeters <= profile.recycleMinPlayerDistanceMeters) {
    return false;
  }

  return (
    relation.forwardMeters < -profile.recycleBehindMeters ||
    relation.lateralAbsMeters > profile.recycleSideMeters ||
    relation.distanceMeters > profile.recycleDistanceMeters + speedBoost
  );
}

export function getHomeDriveTrafficRenderTier(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  profile: HomeDriveTrafficPerformanceProfile,
): HomeDriveTrafficRenderTier {
  if (!profile.renderCullingEnabled) {
    return "full";
  }

  const relation = getHomeDriveTrafficSpatialRelation(
    vehicle.position,
    activeCenter,
    activeHeadingRad,
  );
  const speedBoost = getSpeedHorizonBoostMeters(activeSpeedMps);

  if (relation.distanceMeters <= profile.renderFullRadiusMeters) {
    return "full";
  }

  const insideCameraVolume =
    relation.forwardMeters >= -profile.renderBehindMeters &&
    relation.forwardMeters <= profile.renderForwardMeters + speedBoost &&
    relation.lateralAbsMeters <= profile.renderSideMeters &&
    relation.distanceMeters <= profile.renderHardDistanceMeters + speedBoost;

  if (!insideCameraVolume && relation.distanceMeters > profile.renderNearRadiusMeters) {
    return "hidden";
  }

  if (!profile.distanceDetailBudgetEnabled) {
    return "full";
  }

  if (relation.distanceMeters <= profile.renderCoreRadiusMeters) {
    return "core";
  }

  if (relation.distanceMeters <= profile.renderBodyRadiusMeters) {
    return "body";
  }

  return insideCameraVolume ? "body" : "hidden";
}

export function shouldRenderHomeDriveTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  profile: HomeDriveTrafficPerformanceProfile,
): boolean {
  return (
    getHomeDriveTrafficRenderTier(
      vehicle,
      activeCenter,
      activeHeadingRad,
      activeSpeedMps,
      profile,
    ) !== "hidden"
  );
}


