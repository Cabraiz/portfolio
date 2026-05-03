// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.types.ts

import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianResidentPoolRuntime = Readonly<{
  generation: number;
  poolAgentIds: readonly string[];
  lastTeleportAtSecondsByAgentId: Readonly<Record<string, number>>;
  lastSlotIdByAgentId: Readonly<Record<string, string>>;
  lastDiagnostics?: HomeDrivePedestrianResidentPoolDiagnostics;

  /** Trava criada pelo boot/preload. Depois disso não nasce agente novo. */
  bootLocked?: boolean;
  lockedPoolSize?: number;
  lockedPoolAgentIds?: readonly string[];
  createdAtBootCount?: number;
  runtimeSpawnViolationCount?: number;
  lastRuntimeSpawnViolationAtSeconds?: number;
  lastRuntimeSpawnViolationMessage?: string;
}>;

export type HomeDrivePedestrianResidentPoolRuntimeResult = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  runtime: HomeDrivePedestrianResidentPoolRuntime;
  diagnostics: HomeDrivePedestrianResidentPoolDiagnostics;
  createdAgentCount: number;
  reusedAgentCount: number;
  teleportedAgentCount: number;
}>;
