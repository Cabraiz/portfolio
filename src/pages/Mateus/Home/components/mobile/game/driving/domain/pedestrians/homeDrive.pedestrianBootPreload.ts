// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianBootPreload.ts

import { isHomeDrivePedestrianResidentPoolAgent } from "./homeDrive.pedestrianResidentPool";
import type { HomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime.types";
import { tickHomeDrivePedestrians } from "./homeDrive.pedestrians";
import type {
  HomeDrivePedestrianRuntimeState,
  HomeDrivePedestrianTickOptions,
} from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianBootPreloadDiagnostics,
  HomeDrivePedestrianBootPreloadOptions,
  HomeDrivePedestrianBootPreloadResult,
} from "./homeDrive.pedestrianBootPreload.types";
import type { HomeDrivePedestrianPerformanceProfile } from "./homeDrive.pedestrianPerformance";

const DEFAULT_BOOT_PRELOAD_STEPS = 8;
const DEFAULT_BOOT_PRELOAD_STEP_SECONDS = 1 / 20;

function positiveInteger(value: number | undefined, fallback: number, min = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.floor(value ?? fallback));
}

function positiveSeconds(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1 / 120, value ?? fallback);
}

function getResidentPoolAgentIds(
  pedestrians: HomeDrivePedestrianRuntimeState,
): readonly string[] {
  return pedestrians.agents
    .filter(isHomeDrivePedestrianResidentPoolAgent)
    .map((agent) => agent.id)
    .sort((first, second) => first.localeCompare(second));
}

function buildTickOptions(
  profile: HomeDrivePedestrianPerformanceProfile,
  options: HomeDrivePedestrianBootPreloadOptions,
  tickIndex: number,
): HomeDrivePedestrianTickOptions {
  return {
    maxDeltaSeconds: options.stepSeconds ?? profile.pedestrianBootPreloadStepSeconds,
    activeCenter: options.activeCenter,
    activeHeadingRad: options.activeHeadingRad,
    activeSpeedMps: options.activeSpeedMps ?? 0,
    activeRadiusMeters: profile.activeSimulationRadiusMeters,
    warmRadiusMeters: profile.warmSimulationRadiusMeters,
    warmTickModulo: 1,
    coldTickModulo: 1,
    tickIndex,
    density: profile.density,
    seed: options.seed,
    populateRadiusMeters: profile.populateRadiusMeters,
    pedestrianResidentPoolEnabled: profile.pedestrianResidentPoolEnabled,
    pedestrianResidentPoolSize: profile.pedestrianResidentPoolSize,
    pedestrianResidentPoolMinFrontAgents: profile.pedestrianResidentPoolMinFrontAgents,
    pedestrianResidentPoolMinFarAgents: profile.pedestrianResidentPoolMinFarAgents,
    pedestrianResidentPoolTeleportMinForwardMeters:
      profile.pedestrianResidentPoolTeleportMinForwardMeters,
    pedestrianResidentPoolTeleportMaxForwardMeters:
      profile.pedestrianResidentPoolTeleportMaxForwardMeters,
    pedestrianResidentPoolTeleportHorizonMaxForwardMeters:
      profile.pedestrianResidentPoolTeleportHorizonMaxForwardMeters,
    pedestrianResidentPoolRecycleBehindMeters:
      profile.pedestrianResidentPoolRecycleBehindMeters,
    pedestrianResidentPoolRecycleSideMeters:
      profile.pedestrianResidentPoolRecycleSideMeters,
    pedestrianResidentPoolMaxTeleportsPerTick:
      profile.pedestrianResidentPoolMaxInitialTeleports,
    pedestrianResidentPoolMaxInitialTeleports:
      profile.pedestrianResidentPoolMaxInitialTeleports,
    pedestrianResidentPoolProtectVisibleConeMeters:
      profile.pedestrianResidentPoolProtectVisibleConeMeters,
    pedestrianResidentPoolProtectVisibleConeRadians:
      profile.pedestrianResidentPoolProtectVisibleConeRadians,
    pedestrianResidentPoolDebug: profile.pedestrianResidentPoolDebug,
    pedestrianResidentPoolViewportOccupancyEnabled:
      profile.pedestrianResidentPoolViewportOccupancyEnabled,
    pedestrianResidentPoolForceAllAgentsIntoViewport:
      profile.pedestrianResidentPoolForceAllAgentsIntoViewport,
    pedestrianResidentPoolVisibleNearMinMeters:
      profile.pedestrianResidentPoolVisibleNearMinMeters,
    pedestrianResidentPoolVisibleNearMaxMeters:
      profile.pedestrianResidentPoolVisibleNearMaxMeters,
    pedestrianResidentPoolVisibleNearCount:
      profile.pedestrianResidentPoolVisibleNearCount,
    pedestrianResidentPoolVisibleMidMinMeters:
      profile.pedestrianResidentPoolVisibleMidMinMeters,
    pedestrianResidentPoolVisibleMidMaxMeters:
      profile.pedestrianResidentPoolVisibleMidMaxMeters,
    pedestrianResidentPoolVisibleMidCount:
      profile.pedestrianResidentPoolVisibleMidCount,
    pedestrianResidentPoolVisibleFarMinMeters:
      profile.pedestrianResidentPoolVisibleFarMinMeters,
    pedestrianResidentPoolVisibleFarMaxMeters:
      profile.pedestrianResidentPoolVisibleFarMaxMeters,
    pedestrianResidentPoolVisibleFarCount:
      profile.pedestrianResidentPoolVisibleFarCount,
    pedestrianResidentPoolSideMinForwardMeters:
      profile.pedestrianResidentPoolSideMinForwardMeters,
    pedestrianResidentPoolSideMaxForwardMeters:
      profile.pedestrianResidentPoolSideMaxForwardMeters,
    pedestrianResidentPoolSideLateralMinMeters:
      profile.pedestrianResidentPoolSideLateralMinMeters,
    pedestrianResidentPoolSideLateralMaxMeters:
      profile.pedestrianResidentPoolSideLateralMaxMeters,
    pedestrianResidentPoolSideCount: profile.pedestrianResidentPoolSideCount,
    pedestrianResidentPoolMaxViewportTeleportsPerTick:
      profile.pedestrianResidentPoolMaxInitialTeleports,
    pedestrianResidentPoolViewportMinSpacingMeters:
      profile.pedestrianResidentPoolViewportMinSpacingMeters,
    pedestrianResidentPoolAllowRuntimeExpansion: true,
    pedestrianResidentPoolLockAfterBoot: false,
    populationEnabled: true,
  };
}

function lockResidentPoolRuntime(
  runtime: HomeDrivePedestrianResidentPoolRuntime | undefined,
  pedestrians: HomeDrivePedestrianRuntimeState,
  requestedPoolSize: number,
): HomeDrivePedestrianResidentPoolRuntime | undefined {
  if (!runtime) {
    return runtime;
  }

  const lockedPoolAgentIds = getResidentPoolAgentIds(pedestrians);

  return {
    ...runtime,
    bootLocked: true,
    lockedPoolSize: requestedPoolSize,
    lockedPoolAgentIds,
    createdAtBootCount: lockedPoolAgentIds.length,
    runtimeSpawnViolationCount: runtime.runtimeSpawnViolationCount ?? 0,
  };
}

function attachBootDiagnostics(
  pedestrians: HomeDrivePedestrianRuntimeState,
  diagnostics: HomeDrivePedestrianBootPreloadDiagnostics,
): HomeDrivePedestrianRuntimeState {
  const populationRuntime = pedestrians.populationRuntime;

  if (!populationRuntime) {
    return pedestrians;
  }

  const lockedResidentRuntime = lockResidentPoolRuntime(
    populationRuntime.residentPoolRuntime,
    pedestrians,
    diagnostics.requestedPoolSize,
  );

  return {
    ...pedestrians,
    populationRuntime: {
      ...populationRuntime,
      bootPreloadDiagnostics: diagnostics,
      residentPoolRuntime: lockedResidentRuntime,
      orchestratorRuntime: populationRuntime.orchestratorRuntime
        ? {
            ...populationRuntime.orchestratorRuntime,
            residentPoolRuntime: lockedResidentRuntime,
          }
        : populationRuntime.orchestratorRuntime,
    },
  };
}

export function preloadHomeDrivePedestrianBootRuntime(
  pedestrians: HomeDrivePedestrianRuntimeState,
  options: HomeDrivePedestrianBootPreloadOptions,
): HomeDrivePedestrianBootPreloadResult {
  const profile = options.profile;
  const enabled = options.enabled ?? profile.pedestrianBootPreloadEnabled;
  const steps = positiveInteger(
    options.steps,
    profile.pedestrianBootPreloadSteps ?? DEFAULT_BOOT_PRELOAD_STEPS,
    0,
  );
  const stepSeconds = positiveSeconds(
    options.stepSeconds,
    profile.pedestrianBootPreloadStepSeconds ?? DEFAULT_BOOT_PRELOAD_STEP_SECONDS,
  );
  const requestedPoolSize = Math.max(0, profile.pedestrianResidentPoolSize);

  if (!enabled || steps <= 0) {
    const diagnostics: HomeDrivePedestrianBootPreloadDiagnostics = {
      phase: "disabled",
      enabled: false,
      steps: 0,
      stepSeconds,
      startedAtSeconds: pedestrians.elapsedSeconds,
      finishedAtSeconds: pedestrians.elapsedSeconds,
      requestedPoolSize,
      finalAgentCount: pedestrians.agents.length,
      lockedAgentCount: getResidentPoolAgentIds(pedestrians).length,
      createdAgentCountDuringBoot: 0,
      teleportedAgentCountDuringBoot: 0,
      bakeLibraryClipCount: options.bakeLibraryClipCount,
      bakeLibrarySampleCount: options.bakeLibrarySampleCount,
      runtimeExpansionAllowed: profile.pedestrianResidentPoolAllowRuntimeExpansion,
    };

    return {
      pedestrians: attachBootDiagnostics(pedestrians, diagnostics),
      diagnostics,
    };
  }

  let nextPedestrians = pedestrians;
  let createdAgentCountDuringBoot = 0;
  let teleportedAgentCountDuringBoot = 0;

  for (let index = 0; index < steps; index += 1) {
    nextPedestrians = tickHomeDrivePedestrians(nextPedestrians, stepSeconds, {
      ...buildTickOptions(profile, options, index + 1),
      maxDeltaSeconds: stepSeconds,
    });

    const residentDiagnostics =
      nextPedestrians.populationRuntime?.residentPoolDiagnostics;

    createdAgentCountDuringBoot += residentDiagnostics?.createdAgentCount ?? 0;
    teleportedAgentCountDuringBoot += residentDiagnostics?.teleportedAgentCount ?? 0;

    if (getResidentPoolAgentIds(nextPedestrians).length >= requestedPoolSize) {
      break;
    }
  }

  const lockedAgentIds = getResidentPoolAgentIds(nextPedestrians);
  const diagnostics: HomeDrivePedestrianBootPreloadDiagnostics = {
    phase: "locked",
    enabled: true,
    steps,
    stepSeconds,
    startedAtSeconds: pedestrians.elapsedSeconds,
    finishedAtSeconds: nextPedestrians.elapsedSeconds,
    requestedPoolSize,
    finalAgentCount: nextPedestrians.agents.length,
    lockedAgentCount: lockedAgentIds.length,
    createdAgentCountDuringBoot,
    teleportedAgentCountDuringBoot,
    bakeLibraryClipCount: options.bakeLibraryClipCount,
    bakeLibrarySampleCount: options.bakeLibrarySampleCount,
    runtimeExpansionAllowed: profile.pedestrianResidentPoolAllowRuntimeExpansion,
  };

  const lockedPedestrians = attachBootDiagnostics(nextPedestrians, diagnostics);

  if (options.debug && typeof console !== "undefined") {
    console.info("[Pedestrians:BootPreload]", diagnostics);
  }

  return {
    pedestrians: lockedPedestrians,
    diagnostics,
  };
}
