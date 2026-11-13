// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.diagnostics.ts
// Diagnóstico do tick do pool residente no viewport.

import type {
  HomeDrivePedestrianResidentPoolDiagnostics,
} from "./homeDrive.pedestrianResidentPoolDiagnostics.types";
import type {
  HomeDrivePedestrianResidentPoolRuntime,
} from "./homeDrive.pedestrianResidentPoolRuntime.types";
import type {
  HomeDrivePedestrianResidentPoolViewportRuntimeOptions,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import type { HomeDrivePedestrianViewportOccupancySlotResult } from "./homeDrive.pedestrianViewportOccupancySlots.types";
import {
  isAgentLockedForCollision,
  isAgentInsideViewportOccupancy,
  isAgentInsideSafeEntryGate,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.frame";

export type ResidentViewportDiagnosticsInput = Readonly<{
  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions;
  runtime: HomeDrivePedestrianResidentPoolRuntime;
  slotResult: HomeDrivePedestrianViewportOccupancySlotResult;
  updatedAgents: HomeDrivePedestrianAgent[];
  createdAgents: readonly HomeDrivePedestrianAgent[];
  existingPoolAgents: readonly HomeDrivePedestrianAgent[];
  teleportedCount: number;
  isBootLocked: boolean;
  runtimeSpawnViolationCount: number;
  runtimeSpawnBlockedCount: number;
  collisionGuardBlockedTeleportCount: number;
}>;

export function createResidentViewportDiagnostics({
  options,
  runtime,
  slotResult,
  updatedAgents,
  createdAgents,
  existingPoolAgents,
  teleportedCount,
  isBootLocked,
  runtimeSpawnViolationCount,
  runtimeSpawnBlockedCount,
  collisionGuardBlockedTeleportCount,
}: ResidentViewportDiagnosticsInput): HomeDrivePedestrianResidentPoolDiagnostics {

  const countsByBand = updatedAgents.reduce(

    (counts, agent) => {

      const band = agent.residentViewportBand ?? "visible-mid";

      return {

        ...counts,

        [band]: (counts[band] ?? 0) + 1,

      };

    },

    {} as Record<string, number>,

  );

  const offViewportCount = updatedAgents.filter((agent) => {

    return !isAgentInsideViewportOccupancy(agent, options);

  }).length;

  const diagnostics: HomeDrivePedestrianResidentPoolDiagnostics = {

    id: [

      "resident-viewport",

      Math.round(options.elapsedSeconds * 10),

      Math.round(options.activeSpeedMps * 10),

      updatedAgents.length,

      teleportedCount,

    ].join(":"),

    enabled: true,

    elapsedSeconds: options.elapsedSeconds,

    activeSpeedMps: options.activeSpeedMps,

    requestedPoolSize: options.config.size,

    finalAgentCount: updatedAgents.length,

    createdAgentCount: createdAgents.length,

    reusedAgentCount: existingPoolAgents.length,

    teleportedAgentCount: teleportedCount,

    protectedAgentCount: updatedAgents.filter((agent) => isAgentInsideSafeEntryGate(agent, options)).length,

    frontAgentCount:

      (countsByBand["visible-near"] ?? 0) + (countsByBand["visible-mid"] ?? 0),

    farAgentCount: (countsByBand["visible-far"] ?? 0),

    behindAgentCount: 0,

    sideAgentCount:

      (countsByBand["side-left"] ?? 0) + (countsByBand["side-right"] ?? 0),

    recyclableAgentCount: offViewportCount,

    slotCount: slotResult.slotCount,

    frontSlotCount:

      slotResult.slotCountByBand["visible-near"] +

      slotResult.slotCountByBand["visible-mid"],

    farSlotCount: slotResult.slotCountByBand["visible-far"],

    horizonSlotCount:

      slotResult.slotCountByBand["side-left"] +

      slotResult.slotCountByBand["side-right"],

    visibleNearCount: countsByBand["visible-near"] ?? 0,

    visibleMidCount: countsByBand["visible-mid"] ?? 0,

    visibleFarCount: countsByBand["visible-far"] ?? 0,

    sideLeftCount: countsByBand["side-left"] ?? 0,

    sideRightCount: countsByBand["side-right"] ?? 0,

    offViewportCount,

    teleportedToViewportCount: teleportedCount,

    missingSlotCount: Math.max(0, updatedAgents.length - slotResult.slotCount),
    bootLocked: isBootLocked,
    lockedPoolSize: runtime.lockedPoolSize,
    runtimeSpawnViolationCount,
    runtimeSpawnBlockedCount,

    collisionLockedCount: updatedAgents.filter((agent) =>

      isAgentLockedForCollision(agent, options),

    ).length,

    collisionGuardBlockedTeleportCount,

    reason: slotResult.slotCount <= 0 ? "no-viewport-slots" : teleportedCount > 0 ? "safe-entry-teleport" : "stable-safe-entry",

  };

  return diagnostics;

}
