// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.frame.ts
// Log, quadro da câmera e portões de entrada.

import {
  createHomeDrivePedestrianViewportEntryGateConfig,
  getHomeDrivePedestrianViewportEntryGateResult,
} from "./homeDrive.pedestrianViewportEntryGates";
import { isHomeDrivePedestrianAgentCollisionLocked } from "./homeDrive.pedestrianCollisionGuard";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianResidentPoolRuntime,
} from "./homeDrive.pedestrianResidentPoolRuntime.types";
import type {
  HomeDrivePedestrianResidentPoolViewportRuntimeOptions,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

const RESIDENT_VIEWPORT_LOG_INTERVAL_SECONDS = 1;

const residentViewportLastLogAtByKey = new Map<string, number>();



export function logResidentViewport(

  key: string,

  elapsedSeconds: number,

  enabled: boolean,

  payload: Readonly<Record<string, unknown>>,

): void {

  if (!enabled || typeof console === "undefined") {

    return;

  }



  const lastLogAt = residentViewportLastLogAtByKey.get(key) ?? Number.NEGATIVE_INFINITY;



  if (elapsedSeconds - lastLogAt < RESIDENT_VIEWPORT_LOG_INTERVAL_SECONDS) {

    return;

  }



  residentViewportLastLogAtByKey.set(key, elapsedSeconds);

  console.info(`[Pedestrians:ResidentViewport:${key}]`, payload);

}



function getForwardVector(headingRad: number): HomeDriveVector2 {

  return {

    x: Math.sin(headingRad),

    z: Math.cos(headingRad),

  };

}



function getRightVector(headingRad: number): HomeDriveVector2 {

  return {

    x: Math.cos(headingRad),

    z: -Math.sin(headingRad),

  };

}



function getFrame(point: HomeDriveVector2, center: HomeDriveVector2, headingRad: number) {

  const forward = getForwardVector(headingRad);

  const right = getRightVector(headingRad);

  const dx = point.x - center.x;

  const dz = point.z - center.z;

  const forwardMeters = dx * forward.x + dz * forward.z;

  const lateralMeters = dx * right.x + dz * right.z;



  return {

    forwardMeters,

    lateralMeters,

    absoluteLateralMeters: Math.abs(lateralMeters),

    distanceMeters: Math.hypot(dx, dz),

  };

}




export function isAgentLockedForCollision(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): boolean {

  return isHomeDrivePedestrianAgentCollisionLocked(agent, {

    carPosition: options.activeCenter,

    carHeadingRad: options.activeHeadingRad,

    carSpeedMps: options.activeSpeedMps,

    nowSeconds: options.elapsedSeconds,

    impactForwardMeters: 5.2,

    speedLookaheadSeconds: 0.34,

    maxImpactForwardMeters: 22,

    lateralPaddingMeters: 1.05,

    nearStabilityForwardMeters: Math.max(

      42,

      (options.config.viewportVisibleNearMinMeters ?? 42) + 8,

    ),

    nearStabilityLateralMeters: 7.2,

  });

}


export function createRuntime(previous?: HomeDrivePedestrianResidentPoolRuntime): HomeDrivePedestrianResidentPoolRuntime {

  return {

    generation: previous?.generation ?? 0,

    poolAgentIds: previous?.poolAgentIds ?? [],

    lastTeleportAtSecondsByAgentId: previous?.lastTeleportAtSecondsByAgentId ?? {},

    lastSlotIdByAgentId: previous?.lastSlotIdByAgentId ?? {},

    lastDiagnostics: previous?.lastDiagnostics,
    bootLocked: previous?.bootLocked ?? false,
    lockedPoolSize: previous?.lockedPoolSize,
    lockedPoolAgentIds: previous?.lockedPoolAgentIds ?? [],
    createdAtBootCount: previous?.createdAtBootCount ?? 0,
    runtimeSpawnViolationCount: previous?.runtimeSpawnViolationCount ?? 0,
    lastRuntimeSpawnViolationAtSeconds:
      previous?.lastRuntimeSpawnViolationAtSeconds,
    lastRuntimeSpawnViolationMessage:
      previous?.lastRuntimeSpawnViolationMessage,

  };

}



export function isAgentInsideViewportOccupancy(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): boolean {

  const frame = getFrame(agent.position, options.activeCenter, options.activeHeadingRad);

  const maxForward = Math.max(

    options.config.viewportVisibleFarMaxMeters ?? options.config.teleportMinForwardMeters,

    options.config.viewportSideMaxForwardMeters ?? options.config.teleportMinForwardMeters,

  );

  const maxSide = Math.max(

    options.config.viewportSideLateralMaxMeters ?? options.config.recycleSideMeters,

    80,

  );



  if (isAgentLockedForCollision(agent, options)) {

    return true;

  }

  const nearBackPaddingMeters = Math.max(

    12,

    Math.min(42, Math.abs(options.activeSpeedMps) * 0.55),

  );

  return (

    frame.forwardMeters >= -nearBackPaddingMeters &&

    frame.forwardMeters <= maxForward + 20 &&

    frame.absoluteLateralMeters <= maxSide + 36

  );

}



export function isAgentInsideSafeEntryGate(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): boolean {

  const frame = getFrame(agent.position, options.activeCenter, options.activeHeadingRad);

  const maxForward = Math.max(

    options.config.viewportVisibleFarMaxMeters ?? options.config.teleportMinForwardMeters,

    options.config.viewportSideMaxForwardMeters ?? options.config.teleportMinForwardMeters,

  );

  const maxSide = Math.max(

    options.config.viewportSideLateralMaxMeters ?? options.config.recycleSideMeters,

    120,

  );



  return getHomeDrivePedestrianViewportEntryGateResult(

    {

      position: agent.position,

      forwardMeters: frame.forwardMeters,

      lateralMeters: frame.lateralMeters,

      distanceMeters: frame.distanceMeters,

      viewportBand: agent.residentViewportBand,

    },

    createHomeDrivePedestrianViewportEntryGateConfig({

      minForwardMeters: Math.max(58, (options.config.viewportVisibleNearMinMeters ?? 55) * 0.72),

      maxForwardMeters: maxForward + 96,

      centerBlockForwardMeters: Math.max(150, options.config.viewportVisibleMidMinMeters ?? 160),

      centerBlockAbsLateralMeters: Math.max(42, (options.config.viewportSideLateralMinMeters ?? 70) * 0.56),

      sideMinAbsLateralMeters: Math.max(42, (options.config.viewportSideLateralMinMeters ?? 70) * 0.58),

      sideMaxAbsLateralMeters: maxSide + 96,

      farEdgeMinForwardMeters: Math.max(170, (options.config.viewportVisibleFarMinMeters ?? 260) * 0.62),

      allowRelaxedFallback: true,

    }),

  ).allowed;

}
