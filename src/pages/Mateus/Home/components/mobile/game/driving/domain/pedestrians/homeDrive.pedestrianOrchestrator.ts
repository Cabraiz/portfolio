// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianOrchestrator.ts

import { tickHomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime";
import type {
  HomeDrivePedestrianOrchestratorDiagnostics,
  HomeDrivePedestrianOrchestratorInput,
  HomeDrivePedestrianOrchestratorResult,
  HomeDrivePedestrianOrchestratorRuntime,
} from "./homeDrive.pedestrianOrchestrator.types";

function createRuntime(
  input: HomeDrivePedestrianOrchestratorInput,
  diagnostics: HomeDrivePedestrianOrchestratorDiagnostics,
  residentPoolRuntime?: HomeDrivePedestrianOrchestratorRuntime["residentPoolRuntime"],
): HomeDrivePedestrianOrchestratorRuntime {
  return {
    generation: (input.runtime?.generation ?? 0) + 1,
    residentPoolRuntime,
    lastDiagnostics: diagnostics,
  };
}

export function orchestrateHomeDrivePedestrians(
  input: HomeDrivePedestrianOrchestratorInput,
): HomeDrivePedestrianOrchestratorResult {
  if (!input.config.enabled) {
    const diagnostics: HomeDrivePedestrianOrchestratorDiagnostics = {
      id: `ped-orchestrator:disabled:${Math.round(input.elapsedSeconds * 10)}`,
      enabled: false,
      elapsedSeconds: input.elapsedSeconds,
      previousAgentCount: input.agents.length,
      finalAgentCount: input.agents.length,
      createdAgentCount: 0,
      teleportedAgentCount: 0,
      reusedAgentCount: input.agents.length,
      reason: "disabled",
    };

    return {
      agents: input.agents,
      runtime: createRuntime(input, diagnostics, input.runtime?.residentPoolRuntime),
      diagnostics,
      didRepopulate: false,
      createdAgentCount: 0,
      teleportedAgentCount: 0,
    };
  }

  if (!input.activeCenter) {
    const diagnostics: HomeDrivePedestrianOrchestratorDiagnostics = {
      id: `ped-orchestrator:no-active-center:${Math.round(input.elapsedSeconds * 10)}`,
      enabled: true,
      elapsedSeconds: input.elapsedSeconds,
      previousAgentCount: input.agents.length,
      finalAgentCount: input.agents.length,
      createdAgentCount: 0,
      teleportedAgentCount: 0,
      reusedAgentCount: input.agents.length,
      reason: "no-active-center",
    };

    return {
      agents: input.agents,
      runtime: createRuntime(input, diagnostics, input.runtime?.residentPoolRuntime),
      diagnostics,
      didRepopulate: false,
      createdAgentCount: 0,
      teleportedAgentCount: 0,
    };
  }

  const residentResult = tickHomeDrivePedestrianResidentPoolRuntime({
    agents: input.agents,
    zones: input.zones,
    activeCenter: input.activeCenter,
    activeHeadingRad: input.activeHeadingRad,
    activeSpeedMps: input.activeSpeedMps,
    elapsedSeconds: input.elapsedSeconds,
    seed: input.seed,
    runtime: input.runtime?.residentPoolRuntime,
    config: input.config,
  });

  const diagnostics: HomeDrivePedestrianOrchestratorDiagnostics = {
    id: `ped-orchestrator:resident:${residentResult.diagnostics.id}`,
    enabled: true,
    elapsedSeconds: input.elapsedSeconds,
    previousAgentCount: input.agents.length,
    finalAgentCount: residentResult.agents.length,
    createdAgentCount: residentResult.createdAgentCount,
    teleportedAgentCount: residentResult.teleportedAgentCount,
    reusedAgentCount: residentResult.reusedAgentCount,
    residentPoolDiagnostics: residentResult.diagnostics,
    reason: "resident-pool",
  };

  return {
    agents: residentResult.agents,
    runtime: createRuntime(input, diagnostics, residentResult.runtime),
    diagnostics,
    didRepopulate:
      residentResult.createdAgentCount > 0 ||
      residentResult.teleportedAgentCount > 0,
    createdAgentCount: residentResult.createdAgentCount,
    teleportedAgentCount: residentResult.teleportedAgentCount,
  };
}
