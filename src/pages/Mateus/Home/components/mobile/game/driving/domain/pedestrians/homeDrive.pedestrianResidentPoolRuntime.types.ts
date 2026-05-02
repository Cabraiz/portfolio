// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.types.ts

import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";

export type HomeDrivePedestrianResidentPoolRuntime = Readonly<{
  generation: number;
  poolAgentIds: readonly string[];
  lastTeleportAtSecondsByAgentId: Readonly<Record<string, number>>;
  lastSlotIdByAgentId: Readonly<Record<string, string>>;
  lastDiagnostics?: HomeDrivePedestrianResidentPoolDiagnostics;
}>;

export type HomeDrivePedestrianResidentPoolRuntimeResult = Readonly<{
  agents: import("./homeDrive.pedestrians.types").HomeDrivePedestrianAgent[];
  runtime: HomeDrivePedestrianResidentPoolRuntime;
  diagnostics: HomeDrivePedestrianResidentPoolDiagnostics;
  createdAgentCount: number;
  reusedAgentCount: number;
  teleportedAgentCount: number;
}>;
